/**
 * Replace .cs imports with .sk across src (Slovak fork).
 * Run: node scripts/patch-sk-imports.mjs
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
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".cs.ts") && !name.endsWith(".sk.ts")) files.push(p);
  }
  return files;
}

const pairs = [
  ["PhoneInputCS", "PhoneInputSK"],
  ["lang === \"cs\"", "lang === \"sk\""],
  ["lang: \"cs\"", "lang: \"sk\""],
  ["\"cs-CZ\"", "\"sk-SK\""],
  ["cs_CZ", "sk_SK"],
  ["inLanguage: \"cs-CZ\"", "inLanguage: \"sk-SK\""],
  ["hreflang=\"cs-CZ\"", "hreflang=\"sk-SK\""],
  ["geo.region: \"CZ\"", "geo.region: \"SK\""],
  ["geo.placename: \"Czech Republic\"", "geo.placename: \"Slovakia\""],
  ["areaServed: \"CZ\"", "areaServed: \"SK\""],
  ["availableLanguage: [\"Czech\"]", "availableLanguage: [\"Slovak\"]"],
  ["formatPhoneE164CS", "formatPhoneE164SK"],
  ["isValidPhoneCSDigits", "isValidPhoneSKDigits"],
  ["parsePhoneCS", "parsePhoneSK"],
  ["CZ_PHONE_ERROR_CS", "SK_PHONE_ERROR_SK"],
  ["CZ_PHONE_RE", "SK_PHONE_RE"],
  ["pickCzechCities", "pickSlovakCities"],
  ["slovakizeProductFacts", "slovakizeProductFacts"],
  [".cs\"", ".sk\""],
  [".cs'", ".sk'"],
  ["content.cs", "content.sk"],
  ["i18n.cs", "i18n.sk"],
  ["legal.cs", "legal.sk"],
  ["niche-content.cs", "niche-content.sk"],
  ["category-descriptors.cs", "category-descriptors.sk"],
  ["product-intent.cs", "product-intent.sk"],
  ["product-role.cs", "product-role.sk"],
  ["review-voice.cs", "review-voice.sk"],
  ["feed-title-clean.cs", "feed-title-clean.sk"],
  ["shelf-disambiguation.cs", "shelf-disambiguation.sk"],
  ["product-facts.cs-labels", "product-facts.sk-labels"],
  ["ai-content.cs-prompts", "ai-content.sk-prompts"],
  ["ai-content.cs-fallbacks", "ai-content.sk-fallbacks"],
  ["ai-content.examples.cs", "ai-content.examples.sk"],
  ["ai-content-pipeline.cs", "ai-content-pipeline.sk"],
  ["title-translate.cs", "title-translate.sk"],
  ["seo-intent.cs", "seo-intent.sk"],
  ["review-templates-cat.cs", "review-templates-cat.sk"],
  ["review-templates-niche.cs", "review-templates-niche.sk"],
  ["review-templates-slug.cs", "review-templates-slug.sk"],
  ["review-templates-theme.cs", "review-templates-theme.sk"],
  ["shelf-classification.examples.cs", "shelf-classification.examples.sk"],
  ["problem-vocabulary.cs", "problem-vocabulary.sk"],
  ["potency-vocabulary.cs", "potency-vocabulary.sk"],
  ["lead-errors.cs", "lead-errors.sk"],
  ["locale-leak-sk", "locale-leak-sk"],
  ["Type Lang = \"cs\"", "Type Lang = \"sk\""],
  ["LANGS: readonly Lang[] = [\"cs\"]", "LANGS: readonly Lang[] = [\"sk\"]"],
  ["cs: \"cs-CZ\"", "sk: \"sk-SK\""],
  ["cs: \"cs\"", "sk: \"sk\""],
  ["getCategoryContentSK", "getCategoryContentSK"],
  ["buildNicheContentSK", "buildNicheContentSK"],
  ["T from \"./i18n.cs\"", "T from \"./i18n.sk\""],
  ["from \"./i18n.cs\"", "from \"./i18n.sk\""],
  ["from \"./legal.cs\"", "from \"./legal.sk\""],
  ["lang=\"cs\"", "lang=\"sk\""],
  ["getI18n(\"cs\")", "getI18n(\"sk\")"],
  ["I18N = { cs:", "I18N = { sk:"],
  ["export type Lang = \"cs\"", "export type Lang = \"sk\""],
  ["./phone.cs", "./phone.sk"],
  ["inferProductRoleSk", "inferProductRoleSk"],
  ["Czech-only", "Slovak-only"],
  ["hasNonSlovakLocaleLeak", "hasNonSlovakLocaleLeak"],
  ["hasNonSlovakProductContent", "hasNonSlovakProductContent"],
  ["LEAD_ERRORS_CS", "LEAD_ERRORS_SK"],
  ["country: \"CZ\"", "country: \"SK\""],
  ["MARKET_GEO = \"CZ\"", "MARKET_GEO = \"SK\""],
  ["MARKET_CURRENCY = \"CZK\"", "MARKET_CURRENCY = \"EUR\""],
  ["/pruvodce", "/sprievodca"],
  ["GUIDE_PATH = \"/pruvodce\"", "GUIDE_PATH = \"/sprievodca\""],
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

for (const rel of ["src/lib/i18n.ts", "src/lib/lang.ts", "src/lib/legal.ts", "src/lib/category-descriptors.ts", "src/lib/market.ts", "src/lib/site.ts"]) {
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

console.log(`patch-sk-imports: ${n} files`);
