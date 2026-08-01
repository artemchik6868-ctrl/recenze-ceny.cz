/**
 * Replace .ro imports with .bg across src (Czech Republic fork).
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
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".ro.ts") && !name.endsWith(".bg.ts")) files.push(p);
  }
  return files;
}

const pairs = [
  ["from \"./content.ro\"", "from \"./content.bg\""],
  ["from './content.ro'", "from './content.bg'"],
  ["from \"./product-intent.ro\"", "from \"./product-intent.bg\""],
  ["from \"./product-role.ro\"", "from \"./product-role.bg\""],
  ["from \"@/lib/phone.hu\"", "from \"@/lib/phone.hu\""],
  ["PhoneInputCS", "PhoneInputCS"],
  ["./phone.hu", "./phone.hu"],
  ["inferProductRoleCs", "inferProductRoleCs"],
  ["lang === \"ro\"", "lang === \"bg\""],
  ["lang: \"ro\"", "lang: \"bg\""],
  ["\"cs-CZ\"", "\"cs-CZ\""],
  ["cs_CZ", "cs_CZ"],
  ["inLanguage: \"cs-CZ\"", "inLanguage: \"cs-CZ\""],
  ["hreflang=\"cs-CZ\"", "hreflang=\"cs-CZ\""],
  ["geo.region: \"RO\"", "geo.region: \"BG\""],
  ["geo.placename: \"Czech Republic\"", "geo.placename: \"Czech Republic\""],
  ["areaServed: \"RO\"", "areaServed: \"BG\""],
  ["availableLanguage: [\"Czech Republicn\"]", "availableLanguage: [\"Czech Republicn\"]"],
  ["formatPhoneE164CS", "formatPhoneE164CS"],
  ["isValidPhoneCSDigits", "isValidPhoneCSDigits"],
  ["parsePhoneCS", "parsePhoneCS"],
  ["CZ_PHONE_ERROR_RO", "CZ_PHONE_ERROR_BG"],
  ["CZ_PHONE_RE", "CZ_PHONE_RE"],
  ["pickCzechCities", "pickCzechCities"],
  ["germanizeProductFacts", "czechizeProductFacts"],
  ["czechizeProductFacts", "czechizeProductFacts"],
  [".ro\"", ".bg\""],
  [".ro'", ".bg'"],
  ["content.ro", "content.bg"],
  ["i18n.ro", "i18n.bg"],
  ["legal.ro", "legal.bg"],
  ["niche-content.ro", "niche-content.bg"],
  ["category-descriptors.ro", "category-descriptors.bg"],
  ["product-intent.ro", "product-intent.bg"],
  ["product-role.ro", "product-role.bg"],
  ["review-themes.ro", "review-themes.bg"],
  ["review-voice.ro", "review-voice.bg"],
  ["feed-title-clean.ro", "feed-title-clean.bg"],
  ["shelf-disambiguation.ro", "shelf-disambiguation.bg"],
  ["product-facts.ro-labels", "product-facts.bg-labels"],
  ["ai-content.ro-prompts", "ai-content.bg-prompts"],
  ["ai-content.ro-fallbacks", "ai-content.bg-fallbacks"],
  ["ai-content.examples.ro", "ai-content.examples.bg"],
  ["ai-content-pipeline.ro", "ai-content-pipeline.bg"],
  ["title-translate.ro", "title-translate.bg"],
  ["seo-intent.ro", "seo-intent.bg"],
  ["review-templates-cat.ro", "review-templates-cat.bg"],
  ["review-templates-niche.ro", "review-templates-niche.bg"],
  ["review-templates-slug.ro", "review-templates-slug.bg"],
  ["review-templates-theme.ro", "review-templates-theme.bg"],
  ["shelf-classification.examples.ro", "shelf-classification.examples.bg"],
  ["problem-vocabulary.ro", "problem-vocabulary.bg"],
  ["potency-vocabulary.ro", "potency-vocabulary.bg"],
  ["lead-errors.ro", "lead-errors.bg"],
  ["locale-leak-cz", "locale-leak-cz"],
  ["Type Lang = \"ro\"", "Type Lang = \"bg\""],
  ["LANGS: readonly Lang[] = [\"ro\"]", "LANGS: readonly Lang[] = [\"bg\"]"],
  ["ro: \"cs-CZ\"", "bg: \"cs-CZ\""],
  ["ro: \"ro\"", "bg: \"bg\""],
  ["Czech Republicn-only", "Czech Republicn-only"],
  ["getCategoryContentCS", "getCategoryContentCS"],
  ["buildNicheContentCS", "buildNicheContentCS"],
  ["T from \"./i18n.ro\"", "T from \"./i18n.bg\""],
  ["from \"./i18n.ro\"", "from \"./i18n.bg\""],
  ["from \"./legal.ro\"", "from \"./legal.bg\""],
  ["lang=\"ro\"", "lang=\"bg\""],
  ["getI18n(\"ro\")", "getI18n(\"bg\")"],
  ["I18N = { ro:", "I18N = { bg:"],
  ["export type Lang = \"ro\"", "export type Lang = \"bg\""],
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

// Patch i18n.ts and lang.ts explicitly
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

console.log(`patch-bg-imports: ${n} files`);
