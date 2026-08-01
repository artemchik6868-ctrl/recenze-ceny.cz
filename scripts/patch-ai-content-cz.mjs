/**
 * Patch ai-content.server.ts for Czech imports.
 * Run: node scripts/patch-ai-content-cz.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(ROOT, "src/lib/ai-content.server.ts");
let t = fs.readFileSync(file, "utf8");

const pairs = [
  ["category-descriptors.hu", "category-descriptors.cs"],
  ["getCategoryDescriptorCS", "getCategoryDescriptorCS"],
  ["product-intent.hu", "product-intent.cs"],
  ["product-role.hu", "product-role.cs"],
  ["problem-vocabulary.hu", "problem-vocabulary.cs"],
  ["inferProductRoleCs", "inferProductRoleCs"],
  ["ai-content.hu-prompts", "ai-content.cs-prompts"],
  ["ai-content.hu-fallbacks", "ai-content.cs-fallbacks"],
  ["buildToolSchemaHU", "buildToolSchemaCS"],
  ["buildFaqToolSchemaHU", "buildFaqToolSchemaCS"],
  ["buildFaqUserPromptHU", "buildFaqUserPromptCS"],
  ["buildUserPromptHU", "buildUserPromptCS"],
  ["pickCzechCities", "pickCzechCities"],
  ["csPlaceholderHtml", "csPlaceholderHtml"],
  ["csSupplementCategoryFallback", "csSupplementCategoryFallback"],
  ["csGenericFallbackContent", "csGenericFallbackContent"],
  ["CS_PLACEHOLDER_MARKERS", "CS_PLACEHOLDER_MARKERS"],
  ["TRANSLATE_SYSTEM_CS", "TRANSLATE_SYSTEM_CS"],
  ["v1-cz-initial", "v1-cz-initial"],
  ["product-facts.hu-labels", "product-facts.cs-labels"],
  ["czechizeProductFacts", "czechizeProductFacts"],
  ["ai-content.examples.hu", "ai-content.examples.cs"],
  ["ai-content-pipeline.hu", "ai-content-pipeline.cs"],
  ["locale-leak-cz", "locale-leak-cz"],
];

for (const [from, to] of pairs) t = t.split(from).join(to);

fs.writeFileSync(file, t, "utf8");
console.log("patched ai-content.server.ts");
