/**
 * Audit CZ runtime AI prompts for DE/PL/HU/RO/Cyrillic leakage.
 * Run: npm run audit:prompts-cz
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  SYSTEM_PROMPT_BG,
  buildUserPromptCS,
  buildProductCopyBrief,
} from "../src/lib/ai-content.cs-prompts.ts";
import { detectProductFacts } from "../src/lib/product-facts.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = [
  "src/lib/ai-content.cs-prompts.ts",
  "src/lib/ai-content.examples.cs.ts",
  "src/lib/ai-content.cs-fallbacks.ts",
  "src/lib/ai-content-pipeline.cs.ts",
  "src/lib/product-facts.cs-labels.ts",
  "src/lib/shelf-topic.cs.ts",
  "src/lib/shelf-disambiguation.cs.ts",
  "src/lib/shelf-classification.examples.cs.ts",
  "src/lib/product-role.cs.ts",
  "src/lib/nutra-lane-archetypes.cs.ts",
  "src/lib/seo-intent.cs.ts",
  "src/lib/title-translate.cs.ts",
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
];

const HU_BAD = [
  /\bUtánvétes fizetés\b/i,
  /\bKategóriák\b/i,
  /\bKezdőlap\b/i,
];

/** Hungarian prose in active runtime prompt modules (not legacy example libraries). */
const HU_PROSE_BAD = [
  /\b[őű]/,
  /\b(kapszulák|Kapszulák|termék|Termék|szállítás|Tisztítsd|Fordítsd|Válassz|elleni|fogyókúrás|Ajánlott leíró|Feedben megerősített)\b/i,
  /\bdisplay_title_hu\b/,
  /\bformLabelHu\b/,
  /\bexpectedDescriptorHu\b/,
];

const HU_PROSE_RUNTIME = new Set([
  "src/lib/ai-content-pipeline.cs.ts",
  "src/lib/ai-content.cs-fallbacks.ts",
  "src/lib/title-translate.cs.ts",
  "src/lib/problem-vocabulary.cs.ts",
  "src/lib/potency-vocabulary.cs.ts",
  "src/lib/product-facts.cs-labels.ts",
]);

const CYRILLIC_ALLOW = new Set([
  "src/lib/ai-content-pipeline.cs.ts",
  "src/lib/title-translate.cs.ts",
  "src/lib/feed-title-clean.cs.ts",
  "src/lib/product-intent.cs.ts",
  "src/lib/product-role.cs.ts",
  "src/lib/problem-vocabulary.cs.ts",
  "src/lib/shelf-disambiguation.cs.ts",
  "src/lib/nutra-lane-archetypes.cs.ts",
  "src/lib/shelf-classification.examples.cs.ts",
  "src/lib/ai-content.examples.cs.ts",
  "src/lib/ai-content.cs-prompts.ts",
  "src/lib/product-facts.cs-labels.ts",
  "src/lib/qa-validator.ts",
]);

let issues = 0;

const CS_TARGETS = new Set(TARGETS.filter((t) => t.endsWith(".cs.ts") || t.includes(".cs-")));

const CYRILLIC_BAD = /[\u0400-\u04FF]/;

function checkPatterns(rel, text, patterns, label) {
  for (const re of patterns) {
    if (
      label === "DE" &&
      (rel.endsWith(".cs.ts") ||
        CS_TARGETS.has(rel) ||
        rel === "src/lib/title-translate.cs.ts" ||
        rel === "src/lib/product-role.cs.ts" ||
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
  checkPatterns(rel, text, HU_BAD, "HU");
  if (HU_PROSE_RUNTIME.has(rel)) {
    checkPatterns(rel, text, HU_PROSE_BAD, "HU-prose");
  }
  if (!CYRILLIC_ALLOW.has(rel) && CYRILLIC_BAD.test(text)) {
    console.log(`FAIL ${rel} — Cyrillic in prompt/vocabulary file`);
    issues += 1;
  }
}

if (!/Česk|česk|Czech/i.test(SYSTEM_PROMPT_BG)) {
  console.log("FAIL SYSTEM_PROMPT_BG: missing Czech markers");
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
  displayTitle: "TestBrand — kloubní gel",
  feedCleaned: "Test feed",
  copyBrief: buildProductCopyBrief({
    rawTitle: "TestBrand — capsules",
    displayH1: "TestBrand — kloubní gel",
    categorySlug: "klouby",
    facts: detectProductFacts("TestBrand — capsules", "klouby"),
    feedCleaned: "Test feed",
  }),
};
const userPrompt = buildUserPromptCS(sampleSrc, "Test feed", "TestBrand — capsules", 42, "supplement");
if (!/Česk|česk|Czech|doruč/i.test(userPrompt)) {
  console.log("FAIL buildUserPromptCS sample: missing CZ market markers");
  issues += 1;
}
for (const re of [...DE_BAD, ...RO_BAD, ...HU_BAD]) {
  if (re.source === "[äöüß]" || re.source === "[äöüß]i") continue;
  if (re.test(userPrompt)) {
    console.log(`FAIL buildUserPromptCS sample: ${re}`);
    issues += 1;
  }
}
if (CYRILLIC_BAD.test(userPrompt)) {
  console.log("FAIL buildUserPromptCS sample: Cyrillic leakage");
  issues += 1;
}

if (issues) {
  console.log(`\naudit-prompts-cz: ${issues} issue(s)`);
  process.exit(1);
}
console.log("audit-prompts-cz: OK");
