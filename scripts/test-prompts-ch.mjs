/**
 * Smoke audit: CH AI prompts must target Česká republika, not DE/AT/PL.
 * Usage: npm run test:prompts-ch
 */
import {
  SYSTEM_PROMPT_DE,
  TRANSLATE_SYSTEM_DE,
  FAQ_SYSTEM_DE,
  QA_HTML_TRUNCATION_HINTS_DE,
  buildUserPromptDE,
  buildFaqUserPromptDE,
  buildProductCopyBrief,
} from "../src/lib/ai-content.de-prompts.ts";
import { deliveryH2For } from "../src/lib/pdp-variants.ts";
import { detectProductFacts } from "../src/lib/product-facts.ts";
import {
  buildDisplayTitleExamplesBlock,
  DISPLAY_TITLE_EXAMPLES,
  buildDescriptorStyleGuideDE,
} from "../src/lib/ai-content.examples.de.ts";
import { FEED_TITLE_FEW_SHOTS } from "../src/lib/feed-title-clean.de.ts";
import { PRODUCT_ROLE_FEW_SHOTS } from "../src/lib/product-role.de.ts";

const FORBIDDEN = [
  /\bPolsce\b/i,
  /\bDostawa\b/i,
  /\bWarszawa\b/i,
  /\bpo Ukrainie\b/i,
  /\bPrzeznaczenie\b/i,
  /\bDETTAGLI CATEGORIA\b/i,
  /\bIMPORTANTE:/i,
  /\bDeutschland\b/i,
  /\bÖsterreich\b/i,
  /deutschlandweit/i,
  /fГјr|nГјtz|Г¤|Г¶|Гј|вЂ/,
];

let failed = 0;

function check(label, text, opts = { requireČeská republika: true, requireDeutsch: true }) {
  for (const re of FORBIDDEN) {
    if (re.test(text)) {
      console.error(`FAIL ${label}: forbidden ${re}`);
      failed += 1;
      return;
    }
  }
  if (opts.requireDeutsch && !/Deutsch/i.test(text)) {
    console.error(`FAIL ${label}: missing Deutsch`);
    failed += 1;
    return;
  }
  if (opts.requireČeská republika && !/Česká republika/i.test(text)) {
    console.error(`FAIL ${label}: missing Česká republika`);
    failed += 1;
    return;
  }
  console.log(`OK  ${label}`);
}

check("SYSTEM_PROMPT_DE", SYSTEM_PROMPT_DE);
check("TRANSLATE_SYSTEM_DE", TRANSLATE_SYSTEM_DE, { requireČeská republika: false });
check("FAQ_SYSTEM_DE", FAQ_SYSTEM_DE);
check("QA_HTML_TRUNCATION_HINTS", QA_HTML_TRUNCATION_HINTS_DE.join("\n"), {
  requireČeská republika: false,
  requireDeutsch: false,
});

const sampleSrc = {
  title: "TestBrand — Kapseln",
  categorySlug: "klouby",
  facts: detectProductFacts("TestBrand — Kapseln für die Gelenke", "klouby"),
  displayTitle: "TestBrand — Kapseln für die Gelenke",
  feedCleaned: "Test feed",
  copyBrief: buildProductCopyBrief({
    rawTitle: "TestBrand — Kapseln",
    displayH1: "TestBrand — Kapseln für die Gelenke",
    categorySlug: "klouby",
    facts: detectProductFacts("TestBrand — Kapseln", "klouby"),
    feedCleaned: "Test feed",
  }),
};

const userPrompt = buildUserPromptDE(sampleSrc, "Test feed", "TestBrand — Kapseln", 42, "supplement");
check("buildUserPromptDE", userPrompt);

const faqPrompt = buildFaqUserPromptDE(sampleSrc, "supplement");
check("buildFaqUserPromptDE", faqPrompt);

const deliveryH2 = deliveryH2For("klouby", 1);
if (deliveryH2 !== "Lieferung und Zahlung in der Česká republika") {
  console.error(`FAIL deliveryH2For: got "${deliveryH2}"`);
  failed += 1;
} else {
  console.log("OK  deliveryH2For");
}

const displayBlock = buildDisplayTitleExamplesBlock();
for (const needle of ["ArtiZynt", "Cortitron", "Benaga Chaga"]) {
  if (!displayBlock.includes(needle)) {
    console.error(`FAIL display examples: missing ${needle}`);
    failed += 1;
  } else {
    console.log(`OK  display example ${needle}`);
  }
}

for (const [label, haystack, needle] of [
  ["TRANSLATE gel", TRANSLATE_SYSTEM_DE, "Gelenkgel"],
  ["TRANSLATE AT", TRANSLATE_SYSTEM_DE, "AT, DE"],
  ["TRANSLATE hemorrhoids", TRANSLATE_SYSTEM_DE, "gegen Hämorrhoiden"],
  ["feed Cortitron", FEED_TITLE_FEW_SHOTS.map((s) => s.feedTitle).join(" "), "Cortitron AT"],
  ["role ArtiZynt", PRODUCT_ROLE_FEW_SHOTS.map((s) => s.titlePattern).join(" "), "ArtiZynt"],
  ["Cortitron H1", displayBlock, "gegen Hämorrhoiden"],
]) {
  if (!haystack.includes(needle)) {
    console.error(`FAIL ${label}: missing ${needle}`);
    failed += 1;
  } else {
    console.log(`OK  ${label}`);
  }
}

const cortitronEx = DISPLAY_TITLE_EXAMPLES.find((e) => e.feedTitle.includes("Cortitron"));
if (cortitronEx?.badH1.includes("Intimkomfort") && cortitronEx?.goodH1.includes("Hämorrhoiden")) {
  console.log("OK  Cortitron good/bad H1 pair");
} else {
  console.error("FAIL Cortitron DISPLAY_TITLE pair");
  failed += 1;
}

const intimateGuide = buildDescriptorStyleGuideDE({
  categorySlug: "intimate-comfort",
  formLabel: "Kapseln",
  cleanBrand: "Cortitron",
});
if (intimateGuide.includes("Kapseln gegen Hämorrhoiden") && intimateGuide.includes("Intimkomfort")) {
  console.log("OK  descriptor style guide intimate-comfort");
} else {
  console.error("FAIL descriptor style guide");
  failed += 1;
}

if (failed) process.exit(1);
console.log("\ntest-prompts-ro OK");
