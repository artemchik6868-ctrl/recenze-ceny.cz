/**
 * Patch ai-content.server.ts for Hungarian imports.
 * Run: node scripts/patch-ai-content-cz.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(ROOT, "src/lib/ai-content.server.ts");
let t = fs.readFileSync(file, "utf8");

const pairs = [
  ["category-descriptors.bg", "category-descriptors.hu"],
  ["getCategoryDescriptorCS", "getCategoryDescriptorCS"],
  ["product-intent.bg", "product-intent.hu"],
  ["product-role.bg", "product-role.hu"],
  ["problem-vocabulary.bg", "problem-vocabulary.hu"],
  ["inferProductRoleCs", "inferProductRoleCs"],
  ["ai-content.bg-prompts", "ai-content.hu-prompts"],
  ["ai-content.bg-fallbacks", "ai-content.hu-fallbacks"],
  ["buildToolSchemaBG", "buildToolSchemaHU"],
  ["buildFaqToolSchemaBG", "buildFaqToolSchemaHU"],
  ["buildFaqUserPromptBG", "buildFaqUserPromptHU"],
  ["buildUserPromptBG", "buildUserPromptHU"],
  ["pickCzechCities", "pickCzechCities"],
  ["csPlaceholderHtml", "csPlaceholderHtml"],
  ["csSupplementCategoryFallback", "csSupplementCategoryFallback"],
  ["csGenericFallbackContent", "csGenericFallbackContent"],
  ["CS_PLACEHOLDER_MARKERS", "CS_PLACEHOLDER_MARKERS"],
  ["TRANSLATE_SYSTEM_CS", "TRANSLATE_SYSTEM_CS"],
  ["v1-cz-initial", "v1-cz-initial"],
  ["product-facts.bg-labels", "product-facts.hu-labels"],
  ["czechizeProductFacts", "czechizeProductFacts"],
  ["ai-content.examples.bg", "ai-content.examples.hu"],
  ["ai-content-pipeline.bg", "ai-content-pipeline.hu"],
  ["locale-leak-cz", "locale-leak-cz"],
];

for (const [from, to] of pairs) t = t.split(from).join(to);

fs.writeFileSync(file, t, "utf8");
console.log("patched ai-content.server.ts");
