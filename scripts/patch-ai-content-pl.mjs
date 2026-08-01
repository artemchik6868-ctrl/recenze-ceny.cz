/**
 * Patch ai-content.server.ts for Polish imports.
 * Run: node scripts/patch-ai-content-pl.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(ROOT, "src/lib/ai-content.server.ts");
let t = fs.readFileSync(file, "utf8");

const pairs = [
  ["category-descriptors.sl", "category-descriptors.pl"],
  ["getCategoryDescriptorSL", "getCategoryDescriptorPL"],
  ["product-intent.sl", "product-intent.pl"],
  ["product-role.sl", "product-role.pl"],
  ["inferProductRoleSl", "inferProductRolePl"],
  ["ai-content.sl-prompts", "ai-content.pl-prompts"],
  ["ai-content.sl-fallbacks", "ai-content.pl-fallbacks"],
  ["buildToolSchemaSL", "buildToolSchemaPL"],
  ["buildFaqToolSchemaSL", "buildFaqToolSchemaPL"],
  ["buildFaqUserPromptSL", "buildFaqUserPromptPL"],
  ["buildUserPromptSL", "buildUserPromptPL"],
  ["pickSlovenianCities", "pickPolishCities"],
  ["slPlaceholderHtml", "plPlaceholderHtml"],
  ["slSupplementCategoryFallback", "plSupplementCategoryFallback"],
  ["slGenericFallbackContent", "plGenericFallbackContent"],
  ["SL_PLACEHOLDER_MARKERS", "PL_PLACEHOLDER_MARKERS"],
  ["TRANSLATE_SYSTEM_SL", "TRANSLATE_SYSTEM_PL"],
  ["v1-sl-initial", "v1-pl-initial"],
  ["v slovenski jezik", "na język polski"],
  ["slovensko (2-6", "polski (2-6"],
  ["Slovenija", "Polska"],
  ["slovensko", "polski"],
  ["product-facts.sl-labels", "product-facts.pl-labels"],
  ["slovenianizeProductFacts", "polishizeProductFacts"],
];

for (const [from, to] of pairs) t = t.split(from).join(to);

fs.writeFileSync(file, t, "utf8");
console.log("patched ai-content.server.ts");
