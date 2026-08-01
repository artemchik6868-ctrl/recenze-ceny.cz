/**
 * Replace .sl imports with .pl across src (Poland fork).
 * Run: node scripts/patch-pl-imports.mjs
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
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".sl.ts")) files.push(p);
  }
  return files;
}

const pairs = [
  ["from \"./content.sl\"", "from \"./content.pl\""],
  ["from './content.sl'", "from './content.pl'"],
  ["from \"./product-intent.sl\"", "from \"./product-intent.pl\""],
  ["from \"./product-role.sl\"", "from \"./product-role.pl\""],
  ["from \"@/lib/phone.sl\"", "from \"@/lib/phone.pl\""],
  ["PhoneInputSI", "PhoneInputPL"],
  ["./phone.sl", "./phone.pl"],
  ["inferProductRoleSl", "inferProductRolePl"],
  ["lang === \"sl\"", "lang === \"pl\""],
  ["lang: \"sl\"", "lang: \"pl\""],
  ["\"sl-SI\"", "\"cs-CZ\""],
  ["sl_SI", "cs_CZ"],
  ["inLanguage: \"sl-SI\"", "inLanguage: \"cs-CZ\""],
  ["hreflang=\"sl-SI\"", "hreflang=\"cs-CZ\""],
  ["v Sloveniji", "w Polsce"],
  ["geo.region: \"SI\"", "geo.region: \"PL\""],
  ["geo.placename: \"Slovenia\"", "geo.placename: \"Poland\""],
  ["areaServed: \"SI\"", "areaServed: \"PL\""],
  ["availableLanguage: [\"Slovenian\"]", "availableLanguage: [\"Polish\"]"],
  ["POOL_SL", "POOL_PL"],
  ["formatPhoneE164SI", "formatPhoneE164PL"],
  ["isValidPhoneSIDigits", "isValidPhonePLDigits"],
  ["parsePhoneSI", "parsePhonePL"],
  ["SI_PHONE_ERROR_SL", "PL_PHONE_ERROR_PL"],
  ["SI_PHONE_RE", "PL_PHONE_RE"],
  ["pickSlovenianCities", "pickPolishCities"],
  ["slovenianizeProductFacts", "polishizeProductFacts"],
  [".sl\"", ".pl\""],
  [".sl'", ".pl'"],
  ["content.sl", "content.pl"],
  ["i18n.sl", "i18n.pl"],
  ["legal.sl", "legal.pl"],
  ["niche-content.sl", "niche-content.pl"],
  ["category-descriptors.sl", "category-descriptors.pl"],
  ["product-intent.sl", "product-intent.pl"],
  ["product-role.sl", "product-role.pl"],
  ["review-themes.sl", "review-themes.pl"],
  ["review-voice.sl", "review-voice.pl"],
  ["feed-title-clean.sl", "feed-title-clean.pl"],
  ["shelf-disambiguation.sl", "shelf-disambiguation.pl"],
  ["product-facts.sl-labels", "product-facts.pl-labels"],
  ["ai-content.sl-prompts", "ai-content.pl-prompts"],
  ["ai-content.sl-fallbacks", "ai-content.pl-fallbacks"],
  ["ai-content.examples.sl", "ai-content.examples.pl"],
  ["review-templates-cat.sl", "review-templates-cat.pl"],
  ["review-templates-niche.sl", "review-templates-niche.pl"],
  ["review-templates-slug.sl", "review-templates-slug.pl"],
  ["review-templates-theme.sl", "review-templates-theme.pl"],
  ["shelf-classification.examples.sl", "shelf-classification.examples.pl"],
  ["Type Lang = \"sl\"", "Type Lang = \"pl\""],
  ["LANGS: readonly Lang[] = [\"sl\"]", "LANGS: readonly Lang[] = [\"pl\"]"],
  ["sl: \"sl-SI\"", "pl: \"cs-CZ\""],
  ["sl: \"sl\"", "pl: \"pl\""],
  ["Slovenian-only", "Polish-only"],
  ["Czech storefront", "Czech storefront"],
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
console.log(`patch-pl-imports: ${n} files`);
