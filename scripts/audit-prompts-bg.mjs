/**
 * Audit BG runtime AI prompts for DE/PL/RO leakage.
 * Run: npm run audit:prompts-bg
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  SYSTEM_PROMPT_BG,
  buildUserPromptBG,
  buildProductCopyBrief,
} from "../src/lib/ai-content.bg-prompts.ts";
import { detectProductFacts } from "../src/lib/product-facts.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = [
  "src/lib/ai-content.bg-prompts.ts",
  "src/lib/ai-content.examples.bg.ts",
  "src/lib/ai-content.bg-fallbacks.ts",
  "src/lib/ai-content-pipeline.bg.ts",
  "src/lib/product-facts.bg-labels.ts",
  "src/lib/shelf-disambiguation.bg.ts",
  "src/lib/shelf-classification.examples.bg.ts",
  "src/lib/product-role.bg.ts",
  "src/lib/nutra-lane-archetypes.bg.ts",
  "src/lib/seo-intent.bg.ts",
  "src/lib/title-translate.bg.ts",
  "src/lib/qa-validator.ts",
];

const DE_BAD = [
  /[äöüß]/i,
  /\bDu bist\b/i,
  /\bSchreibe\b/i,
  /\bSchreib\b/i,
  /\bZahlung bei Lieferung\b/i,
  /\bStartseite\b/i,
];

const RO_BAD = [
  /\bPlata la livrare\b/i,
  /\bRecenzii Produse\b/i,
  /\bîn România\b/i,
  /\bromână\b/i,
  /Scrie doar în română/i,
];

let issues = 0;

function checkPatterns(rel, text, patterns, label) {
  for (const re of patterns) {
    if (
      label === "DE" &&
      (rel === "src/lib/title-translate.bg.ts" || rel === "src/lib/product-role.bg.ts") &&
      re.source === "[äöüß]"
    ) {
      continue;
    }
    if (re.test(text)) {
      console.log(`FAIL ${rel} — ${label} pattern ${re}`);
      issues += 1;
    }
  }
}

for (const rel of TARGETS) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, "utf8");
  checkPatterns(rel, text, DE_BAD, "DE");
  checkPatterns(rel, text, RO_BAD, "RO");
}

if (!/Česká republika|български/i.test(SYSTEM_PROMPT_BG)) {
  console.log("FAIL SYSTEM_PROMPT_BG: missing Czech Republic markers");
  issues += 1;
}
if (/[äöüß]|Du bist|Schreibe natürliches/i.test(SYSTEM_PROMPT_BG)) {
  console.log("FAIL SYSTEM_PROMPT_BG: German leakage");
  issues += 1;
}

const sampleSrc = {
  title: "TestBrand — capsules",
  categorySlug: "klouby",
  facts: detectProductFacts("TestBrand — gel za sklepe", "klouby"),
  displayTitle: "TestBrand — гел за стави",
  feedCleaned: "Test feed",
  copyBrief: buildProductCopyBrief({
    rawTitle: "TestBrand — capsules",
    displayH1: "TestBrand — гел за стави",
    categorySlug: "klouby",
    facts: detectProductFacts("TestBrand — capsules", "klouby"),
    feedCleaned: "Test feed",
  }),
};
const userPrompt = buildUserPromptBG(sampleSrc, "Test feed", "TestBrand — capsules", 42, "supplement");
if (!/Česká republika|български|доставк/i.test(userPrompt)) {
  console.log("FAIL buildUserPromptBG sample: missing CZ market markers");
  issues += 1;
}
for (const re of DE_BAD) {
  if (re.test(userPrompt)) {
    console.log(`FAIL buildUserPromptBG sample: ${re}`);
    issues += 1;
  }
}
for (const re of RO_BAD) {
  if (re.test(userPrompt)) {
    console.log(`FAIL buildUserPromptBG sample: ${re}`);
    issues += 1;
  }
}

if (issues) {
  console.log(`\naudit-prompts-cz: ${issues} issue(s)`);
  process.exit(1);
}
console.log("audit-prompts-cz: OK");
