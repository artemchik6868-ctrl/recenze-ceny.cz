/**
 * Replace .de imports with .ro across src (Czech Republic fork).
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
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".de.ts")) files.push(p);
  }
  return files;
}

const pairs = [
  ["from \"./content.de\"", "from \"./content.ro\""],
  ["from './content.de'", "from './content.ro'"],
  ["from \"./product-intent.de\"", "from \"./product-intent.ro\""],
  ["from \"./product-role.de\"", "from \"./product-role.ro\""],
  ["from \"@/lib/phone.hu\"", "from \"@/lib/phone.hu\""],
  ["PhoneInputCS", "PhoneInputCS"],
  ["./phone.hu", "./phone.hu"],
  ["./phone.de", "./phone.hu"],
  ["inferProductRoleDe", "inferProductRoleCs"],
  ["lang === \"de\"", "lang === \"ro\""],
  ["lang: \"de\"", "lang: \"ro\""],
  ["\"cs-CZ\"", "\"cs-CZ\""],
  ["cs_CZ", "cs_CZ"],
  ["inLanguage: \"cs-CZ\"", "inLanguage: \"cs-CZ\""],
  ["hreflang=\"cs-CZ\"", "hreflang=\"cs-CZ\""],
  ["geo.region: \"CH\"", "geo.region: \"RO\""],
  ["geo.placename: \"Czech Republic\"", "geo.placename: \"Czech Republic\""],
  ["areaServed: \"CH\"", "areaServed: \"RO\""],
  ["availableLanguage: [\"German\"]", "availableLanguage: [\"Czech Republicn\"]"],
  ["formatPhoneE164CS", "formatPhoneE164CS"],
  ["isValidPhoneCSDigits", "isValidPhoneCSDigits"],
  ["parsePhoneCS", "parsePhoneCS"],
  ["CZ_PHONE_ERROR_DE", "CZ_PHONE_ERROR_RO"],
  ["CZ_PHONE_RE", "CZ_PHONE_RE"],
  ["pickCzechCities", "pickCzechCities"],
  ["germanizeProductFacts", "czechizeProductFacts"],
  [".de\"", ".ro\""],
  [".de'", ".ro'"],
  ["content.de", "content.ro"],
  ["i18n.de", "i18n.ro"],
  ["legal.de", "legal.ro"],
  ["niche-content.de", "niche-content.ro"],
  ["category-descriptors.de", "category-descriptors.ro"],
  ["product-intent.de", "product-intent.ro"],
  ["product-role.de", "product-role.ro"],
  ["review-themes.de", "review-themes.ro"],
  ["review-voice.de", "review-voice.ro"],
  ["feed-title-clean.de", "feed-title-clean.ro"],
  ["shelf-disambiguation.de", "shelf-disambiguation.ro"],
  ["product-facts.de-labels", "product-facts.ro-labels"],
  ["ai-content.de-prompts", "ai-content.ro-prompts"],
  ["ai-content.de-fallbacks", "ai-content.ro-fallbacks"],
  ["ai-content.examples.de", "ai-content.examples.ro"],
  ["review-templates-cat.de", "review-templates-cat.ro"],
  ["review-templates-niche.de", "review-templates-niche.ro"],
  ["review-templates-slug.de", "review-templates-slug.ro"],
  ["review-templates-theme.de", "review-templates-theme.ro"],
  ["shelf-classification.examples.de", "shelf-classification.examples.ro"],
  ["problem-vocabulary.de", "problem-vocabulary.ro"],
  ["potency-vocabulary.de", "potency-vocabulary.ro"],
  ["lead-errors.de", "lead-errors.ro"],
  ["locale-leak-de", "locale-leak-cz"],
  ["Type Lang = \"de\"", "Type Lang = \"ro\""],
  ["LANGS: readonly Lang[] = [\"de\"]", "LANGS: readonly Lang[] = [\"ro\"]"],
  ["de: \"cs-CZ\"", "ro: \"cs-CZ\""],
  ["de: \"de\"", "ro: \"ro\""],
  ["German-only", "Czech Republicn-only"],
  ["getCategoryContentDE", "getCategoryContentCS"],
  ["buildNicheContentDE", "buildNicheContentCS"],
  ["T from \"./i18n.de\"", "T from \"./i18n.ro\""],
  ["from \"./i18n.de\"", "from \"./i18n.ro\""],
  ["from \"./legal.de\"", "from \"./legal.ro\""],
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
console.log(`patch-ro-imports: ${n} files`);
