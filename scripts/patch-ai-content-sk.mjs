/**
 * Patch ai-content.server.ts for Slovak imports.
 * Run: node scripts/patch-ai-content-sk.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(ROOT, "src/lib/ai-content.server.ts");
let t = fs.readFileSync(file, "utf8");

const pairs = [
  ["category-descriptors.cs", "category-descriptors.sk"],
  ["getCategoryDescriptorSK", "getCategoryDescriptorSK"],
  ["product-intent.cs", "product-intent.sk"],
  ["product-role.cs", "product-role.sk"],
  ["problem-vocabulary.cs", "problem-vocabulary.sk"],
  ["inferProductRoleSk", "inferProductRoleSk"],
  ["ai-content.cs-prompts", "ai-content.sk-prompts"],
  ["ai-content.cs-fallbacks", "ai-content.sk-fallbacks"],
  ["buildToolSchemaCS", "buildToolSchemaSK"],
  ["buildFaqToolSchemaCS", "buildFaqToolSchemaSK"],
  ["buildFaqUserPromptCS", "buildFaqUserPromptSK"],
  ["buildUserPromptCS", "buildUserPromptSK"],
  ["pickSlovakCities", "pickSlovakCities"],
  ["skPlaceholderHtml", "skPlaceholderHtml"],
  ["skSupplementCategoryFallback", "skSupplementCategoryFallback"],
  ["skGenericFallbackContent", "skGenericFallbackContent"],
  ["SK_PLACEHOLDER_MARKERS", "SK_PLACEHOLDER_MARKERS"],
  ["TRANSLATE_SYSTEM_SK", "TRANSLATE_SYSTEM_SK"],
  ["v1-sk-initial", "v1-sk-initial"],
  ["product-facts.cs-labels", "product-facts.sk-labels"],
  ["slovakizeProductFacts", "slovakizeProductFacts"],
  ["ai-content.examples.cs", "ai-content.examples.sk"],
  ["ai-content-pipeline.cs", "ai-content-pipeline.sk"],
  ["locale-leak-sk", "locale-leak-sk"],
  ["buildProductCopyBrief", "buildProductCopyBrief"],
  ["ai-content.cs-prompts", "ai-content.sk-prompts"],
  ["ai-content.examples.cs", "ai-content.examples.sk"],
];

for (const [from, to] of pairs) t = t.split(from).join(to);

fs.writeFileSync(file, t, "utf8");
console.log("patched ai-content.server.ts");
