/**
 * Replace .pl imports with .de across src (Germany fork).
 * Run: node scripts/patch-de-imports.mjs
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
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".pl.ts")) files.push(p);
  }
  return files;
}

const pairs = [
  ["from \"./content.pl\"", "from \"./content.de\""],
  ["from './content.pl'", "from './content.de'"],
  ["from \"./product-intent.pl\"", "from \"./product-intent.de\""],
  ["from \"./product-role.pl\"", "from \"./product-role.de\""],
  ["from \"@/lib/phone.pl\"", "from \"@/lib/phone.hu\""],
  ["PhoneInputPL", "PhoneInputCS"],
  ["./phone.pl", "./phone.hu"],
  ["inferProductRolePl", "inferProductRoleDe"],
  ["lang === \"pl\"", "lang === \"de\""],
  ["lang: \"pl\"", "lang: \"de\""],
  ["\"cs-CZ\"", "\"cs-CZ\""],
  ["cs_CZ", "cs_CZ"],
  ["inLanguage: \"cs-CZ\"", "inLanguage: \"cs-CZ\""],
  ["hreflang=\"cs-CZ\"", "hreflang=\"cs-CZ\""],
  ["w Polsce", "in Deutschland"],
  ["geo.region: \"PL\"", "geo.region: \"DE\""],
  ["geo.placename: \"Poland\"", "geo.placename: \"Germany\""],
  ["areaServed: \"PL\"", "areaServed: \"DE\""],
  ["availableLanguage: [\"Polish\"]", "availableLanguage: [\"German\"]"],
  ["POOL_PL", "POOL_DE"],
  ["formatPhoneE164PL", "formatPhoneE164CS"],
  ["isValidPhonePLDigits", "isValidPhoneCSDigits"],
  ["parsePhonePL", "parsePhoneCS"],
  ["PL_PHONE_ERROR_PL", "CZ_PHONE_ERROR_DE"],
  ["PL_PHONE_RE", "CZ_PHONE_RE"],
  ["pickPolishCities", "pickGermanCities"],
  ["polishizeProductFacts", "germanizeProductFacts"],
  [".pl\"", ".de\""],
  [".pl'", ".de'"],
  ["content.pl", "content.de"],
  ["i18n.pl", "i18n.de"],
  ["legal.pl", "legal.de"],
  ["niche-content.pl", "niche-content.de"],
  ["category-descriptors.pl", "category-descriptors.de"],
  ["product-intent.pl", "product-intent.de"],
  ["product-role.pl", "product-role.de"],
  ["review-themes.pl", "review-themes.de"],
  ["review-voice.pl", "review-voice.de"],
  ["feed-title-clean.pl", "feed-title-clean.de"],
  ["shelf-disambiguation.pl", "shelf-disambiguation.de"],
  ["product-facts.pl-labels", "product-facts.de-labels"],
  ["ai-content.pl-prompts", "ai-content.de-prompts"],
  ["ai-content.pl-fallbacks", "ai-content.de-fallbacks"],
  ["ai-content.examples.pl", "ai-content.examples.de"],
  ["review-templates-cat.pl", "review-templates-cat.de"],
  ["review-templates-niche.pl", "review-templates-niche.de"],
  ["review-templates-slug.pl", "review-templates-slug.de"],
  ["review-templates-theme.pl", "review-templates-theme.de"],
  ["shelf-classification.examples.pl", "shelf-classification.examples.de"],
  ["Type Lang = \"pl\"", "Type Lang = \"de\""],
  ["LANGS: readonly Lang[] = [\"pl\"]", "LANGS: readonly Lang[] = [\"de\"]"],
  ["pl: \"cs-CZ\"", "de: \"cs-CZ\""],
  ["pl: \"pl\"", "de: \"de\""],
  ["Polish-only", "German-only"],
  ["Recenze Ceny", "Recenze Ceny"],
  ["recenze-ceny.cz", "recenze-ceny.cz"],
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
console.log(`patch-de-imports: ${n} files`);
