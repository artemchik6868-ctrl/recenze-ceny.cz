/**
 * Patch ai-content.server.ts for German imports.
 * Run: node scripts/patch-ai-content-de.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(ROOT, "src/lib/ai-content.server.ts");
let t = fs.readFileSync(file, "utf8");

const pairs = [
  ["category-descriptors.pl", "category-descriptors.de"],
  ["getCategoryDescriptorPL", "getCategoryDescriptorDE"],
  ["product-intent.pl", "product-intent.de"],
  ["product-role.pl", "product-role.de"],
  ["inferProductRolePl", "inferProductRoleDe"],
  ["ai-content.pl-prompts", "ai-content.de-prompts"],
  ["ai-content.pl-fallbacks", "ai-content.de-fallbacks"],
  ["buildToolSchemaPL", "buildToolSchemaDE"],
  ["buildFaqToolSchemaPL", "buildFaqToolSchemaDE"],
  ["buildFaqUserPromptPL", "buildFaqUserPromptDE"],
  ["buildUserPromptPL", "buildUserPromptDE"],
  ["pickPolishCities", "pickGermanCities"],
  ["plPlaceholderHtml", "dePlaceholderHtml"],
  ["plSupplementCategoryFallback", "deSupplementCategoryFallback"],
  ["plGenericFallbackContent", "deGenericFallbackContent"],
  ["PL_PLACEHOLDER_MARKERS", "DE_PLACEHOLDER_MARKERS"],
  ["TRANSLATE_SYSTEM_PL", "TRANSLATE_SYSTEM_DE"],
  ["v1-pl-initial", "v1-de-initial"],
  ["na język polski", "auf Deutsch"],
  ["polski (2-6", "deutsch (2-6"],
  ["Polska", "Deutschland"],
  ["polski", "deutsch"],
  ["product-facts.pl-labels", "product-facts.de-labels"],
  ["polishizeProductFacts", "germanizeProductFacts"],
  ["lang: \"pl\"", "lang: \"de\""],
  ["pickPolishCities", "pickGermanCities"],
];

for (const [from, to] of pairs) t = t.split(from).join(to);

fs.writeFileSync(file, t, "utf8");
console.log("patched ai-content.server.ts");
