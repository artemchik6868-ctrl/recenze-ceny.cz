/**
 * Regen offers mis-shelved as intimate-comfort due to "recto" substring traps (e.g. Erectone).
 *
 * Usage:
 *   npx tsx scripts/regen-shelf-recto-traps.ts --dry-run
 *   npx tsx scripts/regen-shelf-recto-traps.ts
 *   npx tsx scripts/regen-shelf-recto-traps.ts --only=cpa_tl:20980
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyTitleFirst } from "../src/lib/classify";
import { inferProductIntentSlug } from "../src/lib/product-intent.it";
import type { OfferSource } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[m[1].trim()] = v;
}

const dryRun = process.argv.includes("--dry-run");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const onlyKeys = onlyArg
  ? new Set(onlyArg.slice(7).split(",").map((s) => s.trim()).filter(Boolean))
  : null;

const HEMORRHOID_RE = /proctonic|rectosave|hemorrh|геморр|гемол|проктофол/i;

function isRectoTrapMismatch(
  title: string,
  feedCategory: string,
  currentSlug: string,
): boolean {
  const feedCat = feedCategory ?? "";
  const intent = inferProductIntentSlug(title);
  const classified = classifyTitleFirst(title, feedCat, "other");
  const expected = intent ?? classified;
  if (expected === "other" || expected === currentSlug) return false;
  if (currentSlug !== "intimate-comfort") return false;
  if (expected !== "potence") return false;
  if (HEMORRHOID_RE.test(title)) return false;
  return /\berect/i.test(title) || intent === "potence";
}

const { loadOffers } = await import("../src/lib/offers.server.ts");
const { persistResolvedCategorySlug } = await import("../src/lib/catalog-shelf.server.ts");
const { getOrGenerateProductContent, PIPELINE_VERSION } = await import(
  "../src/lib/ai-content.server.ts"
);

const offers = await loadOffers();
const byKey = new Map(offers.map((o) => [`${o.source}:${o.id}`, o]));

const trapKeys = new Set<string>();
for (const o of offers) {
  const key = `${o.source}:${o.id}`;
  const feedCat = o.categoryKey ?? o.categoryName ?? "";
  if (isRectoTrapMismatch(o.title, feedCat, o.categorySlug)) trapKeys.add(key);
}

const targetKeys = onlyKeys
  ? [...onlyKeys].filter((k) => byKey.has(k))
  : [...trapKeys];

console.log(
  `\n=== regen-shelf-recto-traps — ${targetKeys.length} offers (dry=${dryRun}) pipeline=${PIPELINE_VERSION} ===\n`,
);

let ok = 0;
let skip = 0;
let fail = 0;

for (const key of targetKeys.sort()) {
  const offer = byKey.get(key);
  if (!offer) {
    console.log(`SKIP ${key} — not in catalog`);
    skip += 1;
    continue;
  }
  const feedCat = offer.categoryKey ?? offer.categoryName ?? "";
  const expected =
    inferProductIntentSlug(offer.title) ??
    classifyTitleFirst(offer.title, feedCat, offer.categorySlug);
  console.log(`REGEN ${key}`);
  console.log(`  title: ${offer.title.slice(0, 60)}`);
  console.log(`  was: ${offer.categorySlug} → expected: ${expected}`);
  if (dryRun) {
    ok += 1;
    continue;
  }
  const [source, idStr] = key.split(":");
  await persistResolvedCategorySlug(source as OfferSource, Number(idStr), expected);
  const out = await getOrGenerateProductContent(
    source as OfferSource,
    Number(idStr),
    "uk",
    expected,
    { forceRegen: true },
  );
  if (out?.description_html && out.description_html.length >= 400) {
    ok += 1;
    console.log(`  OK   display=${out.display_title?.slice(0, 70)} html=${out.description_html.length}`);
  } else {
    fail += 1;
    console.log(`  FAIL tier=${out?.content_tier ?? "null"}`);
  }
}

console.log(`\nDone — ok=${ok} skip=${skip} fail=${fail}`);
