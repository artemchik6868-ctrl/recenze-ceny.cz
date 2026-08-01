/**
 * Replace .hu imports with .cs across src (Czech fork).
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
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".hu.ts") && !name.endsWith(".cs.ts")) files.push(p);
  }
  return files;
}

const pairs = [
  ["PhoneInputCS", "PhoneInputCS"],
  ["lang === \"hu\"", "lang === \"cs\""],
  ["lang: \"hu\"", "lang: \"cs\""],
  ["\"cs-CZ\"", "\"cs-CZ\""],
  ["cs_CZ", "cs_CZ"],
  ["inLanguage: \"cs-CZ\"", "inLanguage: \"cs-CZ\""],
  ["hreflang=\"cs-CZ\"", "hreflang=\"cs-CZ\""],
  ["geo.region: \"HU\"", "geo.region: \"CZ\""],
  ["geo.placename: \"Czech Republic\"", "geo.placename: \"Czech Republic\""],
  ["areaServed: \"HU\"", "areaServed: \"CZ\""],
  ["availableLanguage: [\"Hungarian\"]", "availableLanguage: [\"Czech\"]"],
  ["formatPhoneE164CS", "formatPhoneE164CS"],
  ["isValidPhoneCSDigits", "isValidPhoneCSDigits"],
  ["parsePhoneCS", "parsePhoneCS"],
  ["CZ_PHONE_ERROR_HU", "CZ_PHONE_ERROR_CS"],
  ["CZ_PHONE_RE", "CZ_PHONE_RE"],
  ["pickCzechCities", "pickCzechCities"],
  ["czechizeProductFacts", "czechizeProductFacts"],
  [".hu\"", ".cs\""],
  [".hu'", ".cs'"],
  ["content.hu", "content.cs"],
  ["i18n.hu", "i18n.cs"],
  ["legal.hu", "legal.cs"],
  ["niche-content.hu", "niche-content.cs"],
  ["category-descriptors.hu", "category-descriptors.cs"],
  ["product-intent.hu", "product-intent.cs"],
  ["product-role.hu", "product-role.cs"],
  ["review-voice.hu", "review-voice.cs"],
  ["feed-title-clean.hu", "feed-title-clean.cs"],
  ["shelf-disambiguation.hu", "shelf-disambiguation.cs"],
  ["product-facts.hu-labels", "product-facts.cs-labels"],
  ["ai-content.hu-prompts", "ai-content.cs-prompts"],
  ["ai-content.hu-fallbacks", "ai-content.cs-fallbacks"],
  ["ai-content.examples.hu", "ai-content.examples.cs"],
  ["ai-content-pipeline.hu", "ai-content-pipeline.cs"],
  ["title-translate.hu", "title-translate.cs"],
  ["seo-intent.hu", "seo-intent.cs"],
  ["review-templates-cat.hu", "review-templates-cat.cs"],
  ["review-templates-niche.hu", "review-templates-niche.cs"],
  ["review-templates-slug.hu", "review-templates-slug.cs"],
  ["review-templates-theme.hu", "review-templates-theme.cs"],
  ["shelf-classification.examples.hu", "shelf-classification.examples.cs"],
  ["problem-vocabulary.hu", "problem-vocabulary.cs"],
  ["potency-vocabulary.hu", "potency-vocabulary.cs"],
  ["lead-errors.hu", "lead-errors.cs"],
  ["locale-leak-cz", "locale-leak-cz"],
  ["Type Lang = \"hu\"", "Type Lang = \"cs\""],
  ["LANGS: readonly Lang[] = [\"hu\"]", "LANGS: readonly Lang[] = [\"cs\"]"],
  ["hu: \"cs-CZ\"", "cs: \"cs-CZ\""],
  ["hu: \"hu\"", "cs: \"cs\""],
  ["getCategoryContentCS", "getCategoryContentCS"],
  ["buildNicheContentCS", "buildNicheContentCS"],
  ["T from \"./i18n.hu\"", "T from \"./i18n.cs\""],
  ["from \"./i18n.hu\"", "from \"./i18n.cs\""],
  ["from \"./legal.hu\"", "from \"./legal.cs\""],
  ["lang=\"hu\"", "lang=\"cs\""],
  ["getI18n(\"hu\")", "getI18n(\"cs\")"],
  ["I18N = { hu:", "I18N = { cs:"],
  ["export type Lang = \"hu\"", "export type Lang = \"cs\""],
  ["./phone.hu", "./phone.cs"],
  ["inferProductRoleCs", "inferProductRoleCs"],
  ["Hungarian-only", "Czech-only"],
  ["hasNonCzechLocaleLeak", "hasNonCzechLocaleLeak"],
  ["hasNonCzechProductContent", "hasNonCzechProductContent"],
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

console.log(`patch-cz-imports: ${n} files`);
