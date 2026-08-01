/**
 * Audit HU runtime AI prompts for DE/PL/RO/Cyrillic leakage.
 * Run: npm run audit:prompts-hu
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  SYSTEM_PROMPT_BG,
  buildUserPromptHU,
  buildProductCopyBrief,
} from "../src/lib/ai-content.hu-prompts.ts";
import { detectProductFacts } from "../src/lib/product-facts.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = [
  "src/lib/ai-content.hu-prompts.ts",
  "src/lib/ai-content.examples.hu.ts",
  "src/lib/ai-content.hu-fallbacks.ts",
  "src/lib/ai-content-pipeline.hu.ts",
  "src/lib/product-facts.hu-labels.ts",
  "src/lib/shelf-topic.hu.ts",
  "src/lib/shelf-disambiguation.hu.ts",
  "src/lib/shelf-classification.examples.hu.ts",
  "src/lib/product-role.hu.ts",
  "src/lib/nutra-lane-archetypes.hu.ts",
  "src/lib/seo-intent.hu.ts",
  "src/lib/title-translate.hu.ts",
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
  /\bEști\b/i,
  /\bRăspunde\b/i,
  /\bFolosește\b/i,
  /\bFoloseste\b/i,
  /\bcumpără\b/i,
  /\bcumpara\b/i,
  /\blivrare curier\b/i,
  /\bCluj-Napoca\b/i,
  /\bCreează\b/i,
  /\bScrie despre\b/i,
  /\bApelează\b/i,
];

/** Cyrillic allowed only in feed-input few-shots / regex matchers — not prompt output copy. */
const CYRILLIC_ALLOW = new Set([
  "src/lib/ai-content-pipeline.hu.ts",
  "src/lib/title-translate.hu.ts",
  "src/lib/feed-title-clean.hu.ts",
  "src/lib/product-intent.hu.ts",
  "src/lib/product-role.hu.ts",
  "src/lib/problem-vocabulary.hu.ts",
  "src/lib/shelf-disambiguation.hu.ts",
  "src/lib/nutra-lane-archetypes.hu.ts",
  "src/lib/shelf-classification.examples.hu.ts",
  "src/lib/ai-content.examples.hu.ts",
  "src/lib/ai-content.hu-prompts.ts",
  "src/lib/product-facts.hu-labels.ts",
  "src/lib/qa-validator.ts",
]);

let issues = 0;

const HU_TARGETS = new Set([
  "src/lib/ai-content.hu-prompts.ts",
  "src/lib/ai-content.examples.hu.ts",
  "src/lib/ai-content.hu-fallbacks.ts",
  "src/lib/ai-content-pipeline.hu.ts",
  "src/lib/product-facts.hu-labels.ts",
  "src/lib/shelf-disambiguation.hu.ts",
  "src/lib/shelf-classification.examples.hu.ts",
  "src/lib/product-role.hu.ts",
  "src/lib/nutra-lane-archetypes.hu.ts",
  "src/lib/seo-intent.hu.ts",
  "src/lib/title-translate.hu.ts",
  "src/lib/shelf-topic.hu.ts",
]);

const CYRILLIC_BAD = /[\u0400-\u04FF]/;

function checkPatterns(rel, text, patterns, label) {
  for (const re of patterns) {
    if (
      label === "DE" &&
      (rel.endsWith(".hu.ts") ||
        HU_TARGETS.has(rel) ||
        rel === "src/lib/title-translate.hu.ts" ||
        rel === "src/lib/product-role.hu.ts" ||
        rel === "src/lib/qa-validator.ts") &&
      (re.source === "[äöüß]" || re.source === "[äöüß]i")
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
  if (!CYRILLIC_ALLOW.has(rel) && CYRILLIC_BAD.test(text)) {
    console.log(`FAIL ${rel} — Cyrillic in prompt/vocabulary file`);
    issues += 1;
  }
}

if (!/Česká republika|magyar|Hungarian/i.test(SYSTEM_PROMPT_BG)) {
  console.log("FAIL SYSTEM_PROMPT_BG: missing Czech Republic markers");
  issues += 1;
}
if (/Du bist|Schreibe natürliches/i.test(SYSTEM_PROMPT_BG)) {
  console.log("FAIL SYSTEM_PROMPT_BG: German leakage");
  issues += 1;
}
if (CYRILLIC_BAD.test(SYSTEM_PROMPT_BG)) {
  console.log("FAIL SYSTEM_PROMPT_BG: Cyrillic leakage");
  issues += 1;
}

const sampleSrc = {
  title: "TestBrand — capsules",
  categorySlug: "klouby",
  facts: detectProductFacts("TestBrand — gel za sklepe", "klouby"),
  displayTitle: "TestBrand — ízületi gél",
  feedCleaned: "Test feed",
  copyBrief: buildProductCopyBrief({
    rawTitle: "TestBrand — capsules",
    displayH1: "TestBrand — ízületi gél",
    categorySlug: "klouby",
    facts: detectProductFacts("TestBrand — capsules", "klouby"),
    feedCleaned: "Test feed",
  }),
};
const userPrompt = buildUserPromptHU(sampleSrc, "Test feed", "TestBrand — capsules", 42, "supplement");
if (!/Česká republika|magyar|Hungarian|szállít/i.test(userPrompt)) {
  console.log("FAIL buildUserPromptHU sample: missing CZ market markers");
  issues += 1;
}
for (const re of DE_BAD) {
  if (re.source === "[äöüß]" || re.source === "[äöüß]i") continue;
  if (re.test(userPrompt)) {
    console.log(`FAIL buildUserPromptHU sample: ${re}`);
    issues += 1;
  }
}
for (const re of RO_BAD) {
  if (re.test(userPrompt)) {
    console.log(`FAIL buildUserPromptHU sample: ${re}`);
    issues += 1;
  }
}
if (CYRILLIC_BAD.test(userPrompt)) {
  console.log("FAIL buildUserPromptHU sample: Cyrillic leakage");
  issues += 1;
}

if (issues) {
  console.log(`\naudit-prompts-cz: ${issues} issue(s)`);
  process.exit(1);
}
console.log("audit-prompts-cz: OK");
