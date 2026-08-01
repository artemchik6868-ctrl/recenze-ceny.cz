/**
 * Audit CH runtime AI prompts for DE/AT market leakage.
 * Run: npm run audit:prompts-ch
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  SYSTEM_PROMPT_DE,
  buildUserPromptDE,
  buildProductCopyBrief,
} from "../src/lib/ai-content.de-prompts.ts";
import { detectProductFacts } from "../src/lib/product-facts.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = [
  "src/lib/ai-content.de-prompts.ts",
  "src/lib/ai-content.de-fallbacks.ts",
  "src/lib/ai-content.examples.de.ts",
  "src/lib/qa-validator.ts",
  "src/lib/pdp-html-variants.ts",
];

const BAD = [
  /\bDeutschland\b/,
  /\bÖsterreich\b/,
  /deutschlandweit/i,
  /deutsche Kunden/i,
  /\bin Deutschland\b/i,
  /Graz\|Linz\|Salzburg/,
  /München\|Hamburg\|Köln/,
];

let issues = 0;

for (const rel of TARGETS) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, "utf8");
  for (const re of BAD) {
    const m = text.match(re);
    if (m) {
      console.log(`FAIL ${rel}: ${m[0]}`);
      issues += 1;
    }
  }
}

if (!/Česká republika/.test(SYSTEM_PROMPT_DE)) {
  console.log("FAIL SYSTEM_PROMPT_DE: missing Česká republika");
  issues += 1;
}

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
if (!/Česká republika/.test(userPrompt)) {
  console.log("FAIL buildUserPromptDE sample: missing Česká republika");
  issues += 1;
}
for (const re of BAD) {
  if (re.test(userPrompt)) {
    console.log(`FAIL buildUserPromptDE sample: ${re}`);
    issues += 1;
  }
}

if (issues) {
  console.log(`\naudit-prompts-cz: ${issues} issue(s)`);
  process.exit(1);
}
console.log("audit-prompts-cz: OK");
