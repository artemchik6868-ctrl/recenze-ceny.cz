/**
 * Audit RO runtime AI prompts for DE/PL/SL leakage.
 * Run: npm run audit:prompts-ro
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  SYSTEM_PROMPT_RO,
  buildUserPromptRO,
  buildProductCopyBrief,
} from "../src/lib/ai-content.ro-prompts.ts";
import { detectProductFacts } from "../src/lib/product-facts.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = [
  "src/lib/ai-content.ro-prompts.ts",
  "src/lib/ai-content.examples.ro.ts",
  "src/lib/ai-content.ro-fallbacks.ts",
  "src/lib/product-facts.ro-labels.ts",
  "src/lib/title-translate.ro.ts",
  "src/lib/qa-validator.ts",
];

const DE_BAD = [
  /[äöüß]/i,
  /\bDu bist\b/i,
  /\bSchreibe\b/i,
  /\bSchreib\b/i,
  /\bDeutschland\b/i,
  /\bÖsterreich\b/i,
  /\bNahrungsergänzungsmittel\b/i,
  /\bZusammensetzung und Wirkungsweise\b/i,
  /\bGerät und Funktionsweise\b/i,
  /\bHäufig gestellte Fragen\b/i,
  /\bKapseln für die\b/i,
  /\bLieferung in der ganzen\b/i,
  /\bZweck und Produktform\b/i,
];

const PL_BAD = [
  /[ąćęłńóśźż]/i,
  /\bdostawa\b/i,
  /\bkapsułki\b/i,
  /\bw polsce\b/i,
  /\bKraków\b/i,
];

const SL_BAD = [
  /\bSlovenija\b/i,
  /\bLjubljana\b/i,
  /\bna voljo\b/i,
  /\bizdelek\b/i,
  /\bslovens/i,
];

/** Allowed in title-translate.ro.ts (input few-shots, not model instructions). */
const TITLE_TRANSLATE_ALLOW = new Set(["src/lib/title-translate.ro.ts"]);
/** Leak-detection regexes may contain foreign diacritics by design. */
const QA_VALIDATOR_ALLOW = new Set(["src/lib/qa-validator.ts"]);
/** Lowercase markers intentionally retain legacy DE spellings for leak detection. */
const PLACEHOLDER_MARKER_ALLOW = new Set(["src/lib/ai-content.ro-fallbacks.ts"]);

let issues = 0;

function checkPatterns(rel, text, patterns, label) {
  if (TITLE_TRANSLATE_ALLOW.has(rel) && label !== "PL") return;
  if (QA_VALIDATOR_ALLOW.has(rel)) return;
  if (PLACEHOLDER_MARKER_ALLOW.has(rel) && label === "DE") return;
  for (const re of patterns) {
    if (label === "DE" && rel === "src/lib/title-translate.ro.ts") {
      const outputSection = text.split("buildTitleTranslateSystemPrompt")[1] ?? "";
      if (!re.test(outputSection) && re.test(text)) continue;
    }
    const m = text.match(re);
    if (m) {
      console.log(`FAIL ${rel} [${label}]: ${m[0]}`);
      issues += 1;
    }
  }
}

for (const rel of TARGETS) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, "utf8");
  checkPatterns(rel, text, DE_BAD, "DE");
  checkPatterns(rel, text, PL_BAD, "PL");
  checkPatterns(rel, text, SL_BAD, "SL");
}

if (!/Česká republika|română/i.test(SYSTEM_PROMPT_RO)) {
  console.log("FAIL SYSTEM_PROMPT_RO: missing Česká republika/română");
  issues += 1;
}
if (/[äöüß]|Du bist|Schreibe natürliches/i.test(SYSTEM_PROMPT_RO)) {
  console.log("FAIL SYSTEM_PROMPT_RO: German leakage");
  issues += 1;
}

const sampleSrc = {
  title: "TestBrand — capsule",
  categorySlug: "klouby",
  facts: detectProductFacts("TestBrand — gel pentru articulații", "klouby"),
  displayTitle: "TestBrand — gel pentru articulații",
  feedCleaned: "Test feed",
  copyBrief: buildProductCopyBrief({
    rawTitle: "TestBrand — capsule",
    displayH1: "TestBrand — gel pentru articulații",
    categorySlug: "klouby",
    facts: detectProductFacts("TestBrand — capsule", "klouby"),
    feedCleaned: "Test feed",
  }),
};
const userPrompt = buildUserPromptRO(sampleSrc, "Test feed", "TestBrand — capsule", 42, "supplement");
if (!/Česká republika|română|livrare/i.test(userPrompt)) {
  console.log("FAIL buildUserPromptRO sample: missing CZ market markers");
  issues += 1;
}
for (const re of [...DE_BAD, ...PL_BAD, ...SL_BAD]) {
  if (re.test(userPrompt)) {
    console.log(`FAIL buildUserPromptRO sample: ${re}`);
    issues += 1;
  }
}

if (issues) {
  console.log(`\naudit-prompts-cz: ${issues} issue(s)`);
  process.exit(1);
}
console.log("audit-prompts-cz: OK");
