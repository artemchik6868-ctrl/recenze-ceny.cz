/**
 * Replace .bg imports with .hu across src (Czech Republic fork).
 * Run: node scripts/patch-cz-imports.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["node_modules", ".output", ".git"]);

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".bg.ts") && !name.endsWith(".hu.ts")) files.push(p);
  }
  return files;
}

const pairs = [
  ["PhoneInputCS", "PhoneInputCS"],
  ["lang === \"bg\"", "lang === \"hu\""],
  ["lang: \"bg\"", "lang: \"hu\""],
  ["\"cs-CZ\"", "\"cs-CZ\""],
  ["cs_CZ", "cs_CZ"],
  ["inLanguage: \"cs-CZ\"", "inLanguage: \"cs-CZ\""],
  ["hreflang=\"cs-CZ\"", "hreflang=\"cs-CZ\""],
  ["geo.region: \"BG\"", "geo.region: \"HU\""],
  ["geo.placename: \"Czech Republic\"", "geo.placename: \"Czech Republic\""],
  ["areaServed: \"BG\"", "areaServed: \"HU\""],
  ["availableLanguage: [\"Czech Republicn\"]", "availableLanguage: [\"Hungarian\"]"],
  ["formatPhoneE164CS", "formatPhoneE164CS"],
  ["isValidPhoneCSDigits", "isValidPhoneCSDigits"],
  ["parsePhoneCS", "parsePhoneCS"],
  ["CZ_PHONE_ERROR_BG", "CZ_PHONE_ERROR_HU"],
  ["CZ_PHONE_RE", "CZ_PHONE_RE"],
  ["pickCzechCities", "pickCzechCities"],
  ["czechizeProductFacts", "czechizeProductFacts"],
  [".bg\"", ".hu\""],
  [".bg'", ".hu'"],
  ["content.bg", "content.hu"],
  ["i18n.bg", "i18n.hu"],
  ["legal.bg", "legal.hu"],
  ["niche-content.bg", "niche-content.hu"],
  ["category-descriptors.bg", "category-descriptors.hu"],
  ["product-intent.bg", "product-intent.hu"],
  ["product-role.bg", "product-role.hu"],
  ["review-themes.bg", "review-themes.bg"],
  ["review-voice.bg", "review-voice.hu"],
  ["feed-title-clean.bg", "feed-title-clean.hu"],
  ["shelf-disambiguation.bg", "shelf-disambiguation.hu"],
  ["product-facts.bg-labels", "product-facts.hu-labels"],
  ["ai-content.bg-prompts", "ai-content.hu-prompts"],
  ["ai-content.bg-fallbacks", "ai-content.hu-fallbacks"],
  ["ai-content.examples.bg", "ai-content.examples.hu"],
  ["ai-content-pipeline.bg", "ai-content-pipeline.hu"],
  ["title-translate.bg", "title-translate.hu"],
  ["seo-intent.bg", "seo-intent.hu"],
  ["review-templates-cat.bg", "review-templates-cat.hu"],
  ["review-templates-niche.bg", "review-templates-niche.hu"],
  ["review-templates-slug.bg", "review-templates-slug.hu"],
  ["review-templates-theme.bg", "review-templates-theme.hu"],
  ["shelf-classification.examples.bg", "shelf-classification.examples.hu"],
  ["problem-vocabulary.bg", "problem-vocabulary.hu"],
  ["potency-vocabulary.bg", "potency-vocabulary.hu"],
  ["lead-errors.bg", "lead-errors.hu"],
  ["locale-leak-cz", "locale-leak-cz"],
  ["Type Lang = \"bg\"", "Type Lang = \"hu\""],
  ["LANGS: readonly Lang[] = [\"bg\"]", "LANGS: readonly Lang[] = [\"hu\"]"],
  ["bg: \"cs-CZ\"", "hu: \"cs-CZ\""],
  ["bg: \"bg\"", "hu: \"hu\""],
  ["getCategoryContentCS", "getCategoryContentCS"],
  ["buildNicheContentCS", "buildNicheContentCS"],
  ["T from \"./i18n.bg\"", "T from \"./i18n.hu\""],
  ["from \"./i18n.bg\"", "from \"./i18n.hu\""],
  ["from \"./legal.bg\"", "from \"./legal.hu\""],
  ["lang=\"bg\"", "lang=\"hu\""],
  ["getI18n(\"bg\")", "getI18n(\"hu\")"],
  ["I18N = { bg:", "I18N = { hu:"],
  ["export type Lang = \"bg\"", "export type Lang = \"hu\""],
  ["./phone.hu", "./phone.hu"],
  ["inferProductRoleCs", "inferProductRoleCs"],
  ["Hungarian-only", "Hungarian-only"],
];

let n = 0;
for (const file of walk(path.join(ROOT, "src"))) {
  let t = fs.readFileSync(file, "utf8");
  let next = t;
  for (const [a, b] of pairs) next = next.split(a).join(b);
  if (next !== t) {
    fs.writeFileSync(file, next, "utf8");
    n += 1;
    console.log(path.relative(ROOT, file));
  }
}

for (const rel of ["src/lib/i18n.ts", "src/lib/lang.ts", "src/lib/legal.ts", "src/lib/category-descriptors.ts"]) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  let t = fs.readFileSync(file, "utf8");
  let next = t;
  for (const [a, b] of pairs) next = next.split(a).join(b);
  if (next !== t) {
    fs.writeFileSync(file, next, "utf8");
    console.log(rel);
    n += 1;
  }
}

console.log(`patch-hu-imports: ${n} files`);
