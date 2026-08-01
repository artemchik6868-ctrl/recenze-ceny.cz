/**
 * Mechanical infra branding for Czech fork (recenze-ceny.cz).
 * Run after copying offer-pulse-showcase-hu → offer-pulse-showcase-cz.
 * Run: node scripts/bootstrap-cz-infra.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set(["node_modules", ".output", ".git", "dist", "scripts/.cache"]);

const REPLACEMENTS = [
  ["velemenylab.workers.dev", "recenze-ceny.workers.dev"],
  ["www.velemenylab.com", "www.recenze-ceny.cz"],
  ["velemenylab.com", "recenze-ceny.cz"],
  ["info@velemenylab.com", "info@recenze-ceny.cz"],
  ["velemenylab-showcase", "recenze-ceny-showcase"],
  ["velemenylab-badge", "recenze-ceny-badge"],
  ["VelemenyLabImageBot", "RecenzeCenyImageBot"],
  ["velemenylab-sync", "recenze-ceny-sync"],
  ["velemenylab-discovery", "recenze-ceny-discovery"],
  ["velemenylab-test", "recenze-ceny-test"],
  ["\"velemenylab\"", "\"recenze-ceny\""],
  ["VelemenyLab", "Recenze Ceny"],
  ["sub1: \"velemenylab\"", "sub1: \"recenze-ceny\""],
  ["HU-INFRA-SETUP.md", "CZ-INFRA-SETUP.md"],
  ["HU market", "CZ market"],
  ["Hungarian storefront fork", "Czech storefront fork"],
  ["Hungarian storefront", "Czech storefront"],
  ["velemenylab-", "recenze-ceny-"],
  ["Andrássy út 60", "Václavské náměstí 1"],
  ["1062 Budapest", "110 00 Praha"],
  ["Budapest", "Praha"],
  ["1062", "110 00"],
  ["+36 1 428 5739", "+420 234 567 890"],
  ["+36 1 234 56 78", "+420 234 567 890"],
  ["tel:+3614285739", "tel:+420234567890"],
  ["tel:+3612345678", "tel:+420234567890"],
  ["facebook.com/velemenylab", "facebook.com/recenze-ceny"],
  ["MARKET_GEO = \"HU\"", "MARKET_GEO = \"CZ\""],
  ["MARKET_CURRENCY = \"HUF\"", "MARKET_CURRENCY = \"CZK\""],
  ["marketBadge: \"HU\"", "marketBadge: \"CZ\""],
  ["country: \"HU\"", "country: \"CZ\""],
  ["APEX_HOST = \"velemenylab.com\"", "APEX_HOST = \"recenze-ceny.cz\""],
  [
    "--domain velemenylab.com --domain www.velemenylab.com",
    "--domain recenze-ceny.cz --domain www.recenze-ceny.cz",
  ],
  ["discover:feeds\": \"node scripts/hu-feed-discovery.mjs\"", "discover:feeds\": \"node scripts/cz-feed-discovery.mjs\""],
  ["smoke:hu", "smoke:cz"],
  ["gen:hu-from-bg", "gen:cz-from-hu"],
  ["bootstrap:hu", "bootstrap:cz"],
  ["translate:content:hu", "translate:content:cz"],
  ["translate:reviews:hu", "translate:reviews:cz"],
  ["translate:ui:hu", "translate:ui:cz"],
  ["audit:hu", "audit:cz"],
  ["CZ_WORKERS_DEV_BASE", "CZ_WORKERS_DEV_BASE"],
  ["HU_WORKERS_DEV_BASE", "CZ_WORKERS_DEV_BASE"],
  ["HU sync base", "CZ sync base"],
  ["geo:no_hu", "geo:no_cz"],
  ["HU repo", "CZ repo"],
  ['ALLOWED = "velemenylab"', 'ALLOWED = "recenze-ceny"'],
  ["test:brand-clean-hu", "test:brand-clean-cz"],
  ["test:seo-meta-hu", "test:seo-meta-cz"],
  ["test:phone-hu", "test:phone-cz"],
  ["regen:locale-leaks-hu", "regen:locale-leaks-cz"],
  ["audit:product-content-hu", "audit:product-content-cz"],
  ["audit-locale-hu.mjs", "audit-locale-cz.mjs"],
  ["smoke-hu.mjs", "smoke-cz.mjs"],
  ["ops-health-hu.mjs", "ops-health-cz.mjs"],
  ["PhoneInputHU", "PhoneInputCS"],
  ["formatPhoneE164HU", "formatPhoneE164CS"],
  ["isValidPhoneHUDigits", "isValidPhoneCSDigits"],
  ["parsePhoneHU", "parsePhoneCS"],
  ["normalizePhoneHUDigits", "normalizePhoneCSDigits"],
  ["phoneNationalHU", "phoneNationalCS"],
  ["HU_PHONE", "CZ_PHONE"],
  ["HU_COUNTRY_CODE", "CZ_COUNTRY_CODE"],
  ["formatPhoneHUDisplay", "formatPhoneCSDisplay"],
  ["HU_PHONE_RE", "CZ_PHONE_RE"],
  ["HU_PHONE_E164_RE", "CZ_PHONE_E164_RE"],
  ["HU_PHONE_ERROR_HU", "CZ_PHONE_ERROR_CS"],
  ["HU_MOBILE_RE", "CZ_MOBILE_RE"],
  ["HU_LANDLINE_RE", "CZ_LANDLINE_RE"],
  ["setup-hu-supabase.mjs", "setup-cz-supabase.mjs"],
  ["setup:supabase\": \"node scripts/setup-hu-supabase.mjs\"", "setup:supabase\": \"node scripts/setup-cz-supabase.mjs\""],
  ["v1-hu-initial", "v1-cz-initial"],
  ["pickHungarianCities", "pickCzechCities"],
  ["HU_CITY_POOL", "CZ_CITY_POOL"],
  ["Magyar Orvosi Kamara", "Česká lékařská komora"],
  ["hu-HU", "cs-CZ"],
  ["Hungarian-only storefront", "Czech-only storefront"],
  ["hu_HU", "cs_CZ"],
  ["lang: \"hu\"", "lang: \"cs\""],
  ["Type Lang = \"hu\"", "Type Lang = \"cs\""],
  ["LANGS: readonly Lang[] = [\"hu\"]", "LANGS: readonly Lang[] = [\"cs\"]"],
  ["generate-sample-hu", "generate-sample-cz"],
  ["audit-prompts-hu", "audit-prompts-cz"],
  ["test:prompts-hu", "test:prompts-cz"],
  ["hu-feed-discovery.mjs", "cz-feed-discovery.mjs"],
  ["HU ONLY", "CZ ONLY"],
  ["Hungary", "Czech Republic"],
  ["Magyarország", "Česká republika"],
  ["Magyarországon", "v České republice"],
  ["egész Magyarországon", "po celé České republice"],
  ["wnddgkriinvqmmiqanar", "ueuhriesbkeoivcndzmx"],
  ["localize:titles:hu", "localize:titles:cz"],
  ["audit:locale-hu", "audit:locale-cz"],
  ["patch-hu-imports.mjs", "patch-cz-imports.mjs"],
  ["patch-ai-content-hu.mjs", "patch-ai-content-cz.mjs"],
  ["mechanical-hu-phrases.mjs", "mechanical-cz-phrases.mjs"],
  ["gen-hu-from-bg.mjs", "gen-cz-from-hu.mjs"],
  ["bootstrap-hu-infra.mjs", "bootstrap-cz-infra.mjs"],
  ["translate-ui-hu", "translate-ui-cz"],
  ["translate-content-hu", "translate-content-cz"],
  ["translate-reviews-hu", "translate-reviews-cz"],
  ["hungarianize-hu", "czechize-cz"],
  ["safe-hungarianize-hu", "safe-czechize-cz"],
  ["locale-leak-hu", "locale-leak-cz"],
  ["hasNonHungarianProductContent", "hasNonCzechProductContent"],
  ["hasNonHungarianLocaleLeak", "hasNonCzechLocaleLeak"],
  ["hungarianizeProductFacts", "czechizeProductFacts"],
  ["hungarianizeTerm", "czechizeTerm"],
  ["inferProductRoleHu", "inferProductRoleCs"],
  ["getCategoryDescriptorHU", "getCategoryDescriptorCS"],
  ["getCategoryContentHU", "getCategoryContentCS"],
  ["buildHungarianOutputGuide", "buildCzechOutputGuide"],
  ["buildPainFirstVocabularyGuideHU", "buildPainFirstVocabularyGuideCS"],
  ["buildNicheContentHU", "buildNicheContentCS"],
  ["NEW_CATEGORY_NAMES_HU", "NEW_CATEGORY_NAMES_CS"],
  ["HU_PLACEHOLDER_MARKERS", "CS_PLACEHOLDER_MARKERS"],
  ["huPlaceholderHtml", "csPlaceholderHtml"],
  ["huSupplementCategoryFallback", "csSupplementCategoryFallback"],
  ["huGenericFallbackContent", "csGenericFallbackContent"],
  ["huPlaceholderFaq", "csPlaceholderFaq"],
  ["CATEGORY_HU_BODIES", "CATEGORY_CS_BODIES"],
  ["CATEGORY_HU_TEXTS", "CATEGORY_CS_TEXTS"],
  ["NICHE_TEMPLATES_HU", "NICHE_TEMPLATES_CS"],
  ["HuReviewBody", "CsReviewBody"],
  ["goodRoleHu", "goodRoleCs"],
  ["badRoleHu", "badRoleCs"],
  ["roleHu", "roleCs"],
  ["DELIVERY_HU", "DELIVERY_CS"],
  ["QUALITY_HU", "QUALITY_CS"],
  ["WATER_PHRASES_HU", "WATER_PHRASES_CS"],
  ["HU_BY_KIND", "CS_BY_KIND"],
  ["GENERIC_HU", "GENERIC_CS"],
  ["HU_META", "CS_META"],
  ["TRANSLATE_SYSTEM_HU", "TRANSLATE_SYSTEM_CS"],
  ["LEAD_ERRORS_HU", "LEAD_ERRORS_CS"],
  ["HuPromptSource", "CsPromptSource"],
  ["availableLanguage: [\"Hungarian\"]", "availableLanguage: [\"Czech\"]"],
  ["areaServed: \"HU\"", "areaServed: \"CZ\""],
  ["geo.region: \"HU\"", "geo.region: \"CZ\""],
  ["geo.placename: \"Hungary\"", "geo.placename: \"Czech Republic\""],
  ["INDEXNOW_HOST = \"velemenylab.com\"", "INDEXNOW_HOST = \"recenze-ceny.cz\""],
  ["terraleads-status-hu.json", "terraleads-status-cz.json"],
  ["audit-shelf-mismatches-hu", "audit-shelf-mismatches-cz"],
  ["+36", "+420"],
  ['return `${Math.round(amount).toLocaleString("hu-HU")} Ft`;', 'return `${Math.round(amount).toLocaleString("cs-CZ")} Kč`;'],
  ["HU storefront:", "CZ storefront:"],
  ["H–Szo · 9:00–20:00 (CET)", "Po–So · 9:00–20:00 (CET)"],
  ["/utmutato", "/pruvodce"],
  ["GUIDE_PATH = \"/utmutato\"", "GUIDE_PATH = \"/pruvodce\""],
  ["Dr. Kovács Péter", "MUDr. Jan Novák"],
  ["ops:health\": \"node scripts/ops-health-hu.mjs\"", "ops:health\": \"node scripts/ops-health-cz.mjs\""],
  ["finish-ai-content-hu.mjs", "finish-ai-content-cz.mjs"],
  ["hungarianize-vocab-run.mjs", "czechize-vocab-run.mjs"],
  ["hungarianize-pipeline-hu.mjs", "czechize-pipeline-cz.mjs"],
  ["audit-product-content-hu.mjs", "audit-product-content-cz.mjs"],
  ["audit-shelf-mismatches-hu.ts", "audit-shelf-mismatches-cz.ts"],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const rel = path.relative(ROOT, p);
    if (SKIP_DIRS.has(name) || rel.startsWith("scripts" + path.sep + ".cache")) continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx|mjs|jsonc?|md|txt|toml|example|yml|yaml)$/.test(name) || name === ".env.example")
      files.push(p);
  }
  return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
  if (
    file.includes("bootstrap-cz-infra.mjs") ||
    file.includes("bootstrap-hu-infra.mjs") ||
    file.includes("gen-cz-from-hu.mjs")
  )
    continue;
  let text = fs.readFileSync(file, "utf8");
  let next = text;
  for (const [from, to] of REPLACEMENTS) next = next.split(from).join(to);
  if (next !== text) {
    fs.writeFileSync(file, next, "utf8");
    changed += 1;
    console.log("patched", path.relative(ROOT, file));
  }
}

console.log(`bootstrap-cz-infra: ${changed} files patched`);
