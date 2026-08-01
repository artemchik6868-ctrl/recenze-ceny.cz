/**
 * Patch ai-content.server.ts for Czech Republicn imports.
 * Run: node scripts/patch-ai-content-cz.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(ROOT, "src/lib/ai-content.server.ts");
let t = fs.readFileSync(file, "utf8");

const pairs = [
  ["category-descriptors.ro", "category-descriptors.bg"],
  ["getCategoryDescriptorCS", "getCategoryDescriptorCS"],
  ["product-intent.ro", "product-intent.bg"],
  ["product-role.ro", "product-role.bg"],
  ["problem-vocabulary.ro", "problem-vocabulary.bg"],
  ["inferProductRoleCs", "inferProductRoleCs"],
  ["ai-content.ro-prompts", "ai-content.bg-prompts"],
  ["ai-content.ro-fallbacks", "ai-content.bg-fallbacks"],
  ["buildToolSchemaRO", "buildToolSchemaBG"],
  ["buildFaqToolSchemaRO", "buildFaqToolSchemaBG"],
  ["buildFaqUserPromptRO", "buildFaqUserPromptBG"],
  ["buildUserPromptRO", "buildUserPromptBG"],
  ["pickCzechCities", "pickCzechCities"],
  ["csPlaceholderHtml", "csPlaceholderHtml"],
  ["csSupplementCategoryFallback", "csSupplementCategoryFallback"],
  ["csGenericFallbackContent", "csGenericFallbackContent"],
  ["CS_PLACEHOLDER_MARKERS", "CS_PLACEHOLDER_MARKERS"],
  ["TRANSLATE_SYSTEM_CS", "TRANSLATE_SYSTEM_CS"],
  ["v1-cz-initial", "v1-cz-initial"],
  ["product-facts.ro-labels", "product-facts.bg-labels"],
  ["czechizeProductFacts", "czechizeProductFacts"],
  ["ai-content.examples.ro", "ai-content.examples.bg"],
  ["ai-content-pipeline.ro", "ai-content-pipeline.bg"],
  ["locale-leak-cz", "locale-leak-cz"],
];

for (const [from, to] of pairs) t = t.split(from).join(to);

fs.writeFileSync(file, t, "utf8");
console.log("patched ai-content.server.ts");
