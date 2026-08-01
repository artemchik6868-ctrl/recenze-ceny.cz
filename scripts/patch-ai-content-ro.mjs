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
  ["category-descriptors.de", "category-descriptors.ro"],
  ["getCategoryDescriptorDE", "getCategoryDescriptorCS"],
  ["product-intent.de", "product-intent.ro"],
  ["product-role.de", "product-role.ro"],
  ["problem-vocabulary.de", "problem-vocabulary.ro"],
  ["inferProductRoleDe", "inferProductRoleCs"],
  ["ai-content.de-prompts", "ai-content.ro-prompts"],
  ["ai-content.de-fallbacks", "ai-content.ro-fallbacks"],
  ["buildToolSchemaDE", "buildToolSchemaRO"],
  ["buildFaqToolSchemaDE", "buildFaqToolSchemaRO"],
  ["buildFaqUserPromptDE", "buildFaqUserPromptRO"],
  ["buildUserPromptDE", "buildUserPromptRO"],
  ["pickCzechCities", "pickCzechCities"],
  ["dePlaceholderHtml", "csPlaceholderHtml"],
  ["deSupplementCategoryFallback", "csSupplementCategoryFallback"],
  ["deGenericFallbackContent", "csGenericFallbackContent"],
  ["DE_PLACEHOLDER_MARKERS", "CS_PLACEHOLDER_MARKERS"],
  ["TRANSLATE_SYSTEM_DE", "TRANSLATE_SYSTEM_CS"],
  ["v1-cz-initial", "v1-cz-initial"],
  ["v1-cz-initial", "v1-cz-initial"],
  ["ins Deutsche", "ins Rumänische"],
  ["auf Deutsch", "auf Rumänisch"],
  ["Deutsch (2-6", "Rumänisch (2-6"],
  ["Česká republika", "Česká republika"],
  ["Deutsch", "Română"],
  ["product-facts.de-labels", "product-facts.ro-labels"],
  ["germanizeProductFacts", "czechizeProductFacts"],
  ["ai-content.examples.de", "ai-content.examples.ro"],
];

for (const [from, to] of pairs) t = t.split(from).join(to);

fs.writeFileSync(file, t, "utf8");
console.log("patched ai-content.server.ts");
