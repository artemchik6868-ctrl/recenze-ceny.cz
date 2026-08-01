/**
 * Patch ai-content.server.ts for Slovenian imports.
 * Run: node scripts/patch-ai-content-sl.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(ROOT, "src/lib/ai-content.server.ts");
let t = fs.readFileSync(file, "utf8");

const pairs = [
  ["category-descriptors.es", "category-descriptors.sl"],
  ["getCategoryDescriptorES", "getCategoryDescriptorSL"],
  ["product-intent.es", "product-intent.sl"],
  ["product-role.es", "product-role.sl"],
  ["inferProductRoleEs", "inferProductRoleSl"],
  ["ai-content.es-prompts", "ai-content.sl-prompts"],
  ["ai-content.es-fallbacks", "ai-content.sl-fallbacks"],
  ["buildToolSchemaES", "buildToolSchemaSL"],
  ["buildFaqToolSchemaES", "buildFaqToolSchemaSL"],
  ["buildFaqUserPromptES", "buildFaqUserPromptSL"],
  ["buildUserPromptES", "buildUserPromptSL"],
  ["pickSpanishCities", "pickSlovenianCities"],
  ["esPlaceholderHtml", "slPlaceholderHtml"],
  ["esSupplementCategoryFallback", "slSupplementCategoryFallback"],
  ["esGenericFallbackContent", "slGenericFallbackContent"],
  ["ES_PLACEHOLDER_MARKERS", "SL_PLACEHOLDER_MARKERS"],
  ["TRANSLATE_SYSTEM_ES", "TRANSLATE_SYSTEM_SL"],
  ["v1-es-initial", "v1-sl-initial"],
  ["al español", "v slovenski jezik"],
  ["español (2-6", "slovensko (2-6"],
  ["España", "Slovenija"],
  ["español", "slovensko"],
];

for (const [from, to] of pairs) t = t.split(from).join(to);

fs.writeFileSync(file, t, "utf8");
console.log("patched ai-content.server.ts");
