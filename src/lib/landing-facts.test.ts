import assert from "node:assert/strict";
import { ALLOWED_SHELF_SLUGS } from "./catalog-shelf";
import {
  THIN_EXHAUST_AFTER,
  buildLandingFactsLlmPrompt,
  isUsableLandingFetch,
  listAdaptiveLandingUrls,
  listCpaTlCzLandingUrls,
  listM1TopLandingUrls,
  nextFetchErrorOutcome,
  nextThinOutcome,
  pickAdaptiveLandingUrl,
  pickCpaTlCzLandingUrl,
  pickFirstUsableLandingIndex,
  pickM1TopLandingUrl,
  isEyewearLandingFacts,
  resolveShelfFromLandingFacts,
  LANDING_FACTS_CATEGORY_HINT_SLUGS,
  type CompactLandingFacts,
} from "./landing-facts";

let failed = 0;

function ok(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`OK  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${name}:`, err instanceof Error ? err.message : err);
  }
}

const NOW = Date.parse("2026-07-17T10:00:00.000Z");
const ADAPTIVE = "\u0410\u0434\u0430\u043f\u0442\u0438\u0432\u043d\u044b\u0439"; // Адаптивный

ok("nextThinOutcome starts streak at 1 after ok", () => {
  const r = nextThinOutcome("ok", 0, NOW);
  assert.equal(r.status, "thin");
  assert.equal(r.fail_count, 1);
  assert.ok(r.locked_until);
});

ok("nextThinOutcome continues streak after thin", () => {
  const r = nextThinOutcome("thin", 3, NOW);
  assert.equal(r.status, "thin");
  assert.equal(r.fail_count, 4);
});

ok("nextThinOutcome resets streak after fetch_error", () => {
  const r = nextThinOutcome("fetch_error", 9, NOW);
  assert.equal(r.status, "thin");
  assert.equal(r.fail_count, 1);
});

ok(`nextThinOutcome exhausts after ${THIN_EXHAUST_AFTER} consecutive thin`, () => {
  const r = nextThinOutcome("thin", THIN_EXHAUST_AFTER - 1, NOW);
  assert.equal(r.status, "exhausted");
  assert.equal(r.fail_count, THIN_EXHAUST_AFTER);
  assert.equal(r.locked_until, null);
});

ok("nextFetchErrorOutcome resets streak after thin", () => {
  const r = nextFetchErrorOutcome("thin", 4, NOW);
  assert.equal(r.fail_count, 1);
  assert.ok(r.locked_until);
});

ok("nextFetchErrorOutcome continues fetch_error streak", () => {
  const r = nextFetchErrorOutcome("fetch_error", 2, NOW);
  assert.equal(r.fail_count, 3);
});

ok("listAdaptiveLandingUrls puts CZ first and dedupes", () => {
  const urls = listAdaptiveLandingUrls({
    landings: [
      { type: ADAPTIVE, url: "it.example.com/a" },
      { type: ADAPTIVE, url: "cz.example.com/b" },
      { type: ADAPTIVE, url: "https://cz.example.com/b" },
      { type: "transit", url: "cz.example.com/skip" },
      { type: ADAPTIVE, url: "pl.example.com/c" },
    ],
  });
  assert.deepEqual(urls, [
    "https://cz.example.com/b",
    "https://it.example.com/a",
    "https://pl.example.com/c",
  ]);
  assert.equal(pickAdaptiveLandingUrl({ landings: [{ type: ADAPTIVE, url: "cz.example.com/b" }] }), "https://cz.example.com/b");
});

ok("listCpaTlCzLandingUrls keeps cz/cs only and dedupes", () => {
  const urls = listCpaTlCzLandingUrls({
    landings: [
      { language_code: "it", url: "https://it.example.com/x" },
      { language_code: "cz", url: "landing.example.com/cz1" },
      { language_code: "cs", url: "https://landing.example.com/cz2" },
      { language_code: "cz", url: "https://landing.example.com/cz1" },
    ],
  });
  assert.deepEqual(urls, [
    "https://landing.example.com/cz1",
    "https://landing.example.com/cz2",
  ]);
  assert.equal(
    pickCpaTlCzLandingUrl({
      landings: [{ language_code: "cz", url: "landing.example.com/cz1" }],
    }),
    "https://landing.example.com/cz1",
  );
});

ok("listM1TopLandingUrls puts CZ-looking hosts first", () => {
  const urls = listM1TopLandingUrls({
    tracking_link: [
      "https://offer.example.com/x",
      "https://cz.offer.example.com/y",
      "https://shop.cz/z",
      "https://cz.offer.example.com/y",
    ],
  });
  assert.deepEqual(urls, [
    "https://cz.offer.example.com/y",
    "https://shop.cz/z",
    "https://offer.example.com/x",
  ]);
  assert.equal(pickM1TopLandingUrl({ tracking_link: urls }), urls[0]);
});

ok("isUsableLandingFetch requires 2xx and enough plain text", () => {
  assert.equal(isUsableLandingFetch({ status: 200, plainTextChars: 800 }), true);
  assert.equal(isUsableLandingFetch({ status: 200, plainTextChars: 799 }), false);
  assert.equal(isUsableLandingFetch({ status: 404, plainTextChars: 5000 }), false);
  assert.equal(isUsableLandingFetch({ status: 500, plainTextChars: 5000 }), false);
});

ok("pickFirstUsableLandingIndex skips 404 then takes next 200", () => {
  const idx = pickFirstUsableLandingIndex([
    { status: 404, plainTextChars: 50 },
    { status: 200, plainTextChars: 1200 },
    { status: 200, plainTextChars: 2000 },
  ]);
  assert.equal(idx, 1);
});

ok("pickFirstUsableLandingIndex returns -1 when all fail", () => {
  assert.equal(
    pickFirstUsableLandingIndex([
      { status: 404, plainTextChars: 10 },
      { status: 503, plainTextChars: 9000 },
      { status: 200, plainTextChars: 10 },
    ]),
    -1,
  );
});

ok("buildLandingFactsLlmPrompt requires Czech fact fields not full-page translation", () => {
  const prompt = buildLandingFactsLlmPrompt("Test", "Hello world gel");
  assert.match(prompt, /piš VŽDY česky/i);
  assert.match(prompt, /POUZE tato krátká pole/i);
  assert.match(prompt, /nepřekládej celý text landingu/i);
});

ok("buildLandingFactsLlmPrompt categoryHint enum lists all ALLOWED_SHELF_SLUGS", () => {
  const prompt = buildLandingFactsLlmPrompt("Test", "plain");
  assert.deepEqual([...LANDING_FACTS_CATEGORY_HINT_SLUGS], [...ALLOWED_SHELF_SLUGS]);
  assert.ok(ALLOWED_SHELF_SLUGS.length > 20, "expected full catalog of shelves");
  const hintLine = prompt.split("\n").find((l) => l.includes('"categoryHint"'));
  assert.ok(hintLine, "categoryHint schema line missing");
  const expectedEnum = `${ALLOWED_SHELF_SLUGS.join("|")}|other|null`;
  assert.ok(
    hintLine!.includes(`shelf slug: ${expectedEnum}`),
    "categoryHint enum must equal ALLOWED_SHELF_SLUGS|other|null",
  );
  assert.ok(!hintLine!.includes("proctology"), "legacy proctology must not appear in prompt enum");
  assert.ok(hintLine!.includes("cystitida"));
  assert.ok(hintLine!.includes("paraziti"));
  assert.ok(hintLine!.includes("prostata"));
  assert.ok(hintLine!.includes("hemoroidy"));
});

function facts(partial: Partial<CompactLandingFacts>): CompactLandingFacts {
  return {
    form: null,
    role: null,
    dosage: null,
    ingredients: [],
    benefits: [],
    h1: null,
    application: null,
    packSize: null,
    courseDays: null,
    usageSteps: [],
    audience: null,
    warnings: [],
    categoryHint: null,
    ...partial,
  };
}

ok("resolveShelfFromLandingFacts accepts any ALLOWED_SHELF_SLUGS as categoryHint", () => {
  for (const slug of ["cystitida", "paraziti", "prostata", "hemoroidy", "klouby"]) {
    assert.equal(resolveShelfFromLandingFacts(facts({ categoryHint: slug })), slug);
  }
});

ok("resolveShelfFromLandingFacts maps legacy proctology alias to hemorrhoids", () => {
  assert.equal(resolveShelfFromLandingFacts(facts({ categoryHint: "proctology" })), "hemoroidy");
});

ok("anatomical oční čočky + vision-eye-care stays vision-eye-care (not accessories)", () => {
  const f = facts({
    categoryHint: "zrak",
    application: "oral",
    role: "obnova zraku",
    benefits: ["Podporuje zaostření oční čočky"],
  });
  assert.equal(isEyewearLandingFacts(f), false);
  assert.equal(resolveShelfFromLandingFacts(f), "zrak");
});

ok("čočky benefit alone does not force accessories without eyewear cues", () => {
  const f = facts({
    role: "zlepšení zraku",
    benefits: ["zlepšuje stav čočky"],
  });
  assert.equal(isEyewearLandingFacts(f), false);
  assert.equal(resolveShelfFromLandingFacts(f), "zrak");
});

ok("Dial Vision / brýle landing resolves to accessories", () => {
  const f = facts({
    form: "jiné",
    role: "nastavitelné brýle",
    h1: "Dial Vision – nastavitelné dioptrie",
    categoryHint: "modni-doplnky",
    benefits: ["Brýle s nastavitelnými dioptriemi"],
  });
  assert.equal(isEyewearLandingFacts(f), true);
  assert.equal(resolveShelfFromLandingFacts(f), "modni-doplnky");
});

ok("kontaktní čočky still counts as eyewear accessories", () => {
  const f = facts({
    role: "kontaktní čočky",
    benefits: ["Měkké kontaktní čočky na denní nošení"],
  });
  assert.equal(isEyewearLandingFacts(f), true);
  assert.equal(resolveShelfFromLandingFacts(f), "modni-doplnky");
});

ok("papillomas hint + parasite role resolves to parasites", () => {
  assert.equal(
    resolveShelfFromLandingFacts(
      facts({
        categoryHint: "papilomy",
        role: "proti parazitům",
        benefits: ["Odstranění hlístů a jejich vajíček"],
      }),
    ),
    "paraziti",
  );
});

if (failed > 0) {
  process.exitCode = 1;
  console.error(`\n${failed} test(s) failed`);
} else {
  console.log("\nAll landing-facts tests passed");
}
