/**
 * Mechanical infra branding for Slovak fork (skrecenzie.sk).
 * Run after copying offer-pulse-showcase-cz → offer-pulse-showcase-sk.
 * Run: node scripts/bootstrap-sk-infra.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set(["node_modules", ".output", ".git", "dist", "scripts/.cache"]);

const REPLACEMENTS = [
  ["recenze-ceny.workers.dev", "skrecenzie.workers.dev"],
  ["www.recenze-ceny.cz", "www.skrecenzie.sk"],
  ["recenze-ceny.cz", "skrecenzie.sk"],
  ["info@recenze-ceny.cz", "info@skrecenzie.sk"],
  ["recenze-ceny-showcase", "skrecenzie-showcase"],
  ["recenze-ceny-badge", "skrecenzie-badge"],
  ["RecenzeCenyImageBot", "SkRecenzieImageBot"],
  ["recenze-ceny-sync", "skrecenzie-sync"],
  ["recenze-ceny-discovery", "skrecenzie-discovery"],
  ["recenze-ceny-test", "skrecenzie-test"],
  ["\"recenze-ceny\"", "\"skrecenzie\""],
  ["Recenze Ceny", "SK Recenzie"],
  ["sub1: \"recenze-ceny\"", "sub1: \"skrecenzie\""],
  ["CZ-INFRA-SETUP.md", "SK-INFRA-SETUP.md"],
  ["CZ market", "SK market"],
  ["Czech storefront fork", "Slovak storefront fork"],
  ["Czech storefront", "Slovak storefront"],
  ["recenze-ceny-", "skrecenzie-"],
  ["Václavské náměstí 1", "Hlavné námestie 1"],
  ["110 00 Praha", "811 01 Bratislava"],
  ["Praha", "Bratislava"],
  ["110 00", "811 01"],
  ["+420 602 847 193", "+421 901 234 567"],
  ["+420 234 567 890", "+421 901 234 567"],
  ["tel:+420602847193", "tel:+421901234567"],
  ["tel:+420234567890", "tel:+421901234567"],
  ["facebook.com/recenze-ceny", "facebook.com/skrecenzie"],
  ["MARKET_GEO = \"CZ\"", "MARKET_GEO = \"SK\""],
  ["MARKET_CURRENCY = \"CZK\"", "MARKET_CURRENCY = \"EUR\""],
  ["marketBadge: \"CZ\"", "marketBadge: \"SK\""],
  ["country: \"CZ\"", "country: \"SK\""],
  ["APEX_HOST = \"recenze-ceny.cz\"", "APEX_HOST = \"skrecenzie.sk\""],
  [
    "--domain recenze-ceny.cz --domain www.recenze-ceny.cz",
    "--domain skrecenzie.sk --domain www.skrecenzie.sk",
  ],
  ["discover:feeds\": \"node scripts/cz-feed-discovery.mjs\"", "discover:feeds\": \"node scripts/sk-feed-discovery.mjs\""],
  ["smoke:cz", "smoke:sk"],
  ["gen:cz-from-hu", "gen:sk-from-cs"],
  ["bootstrap:cz", "bootstrap:sk"],
  ["translate:content:cz", "translate:content:sk"],
  ["translate:reviews:cz", "translate:reviews:sk"],
  ["translate:ui:cz", "translate:ui:sk"],
  ["audit:cz", "audit:sk"],
  ["CZ_WORKERS_DEV_BASE", "SK_WORKERS_DEV_BASE"],
  ["CZ sync base", "SK sync base"],
  ["geo:no_cz", "geo:no_sk"],
  ["CZ repo", "SK repo"],
  ['ALLOWED = "recenze-ceny"', 'ALLOWED = "skrecenzie"'],
  ["test:brand-clean-cz", "test:brand-clean-sk"],
  ["test:seo-meta-cz", "test:seo-meta-sk"],
  ["test:phone-cz", "test:phone-sk"],
  ["regen:locale-leaks-cz", "regen:locale-leaks-sk"],
  ["audit:product-content-cz", "audit:product-content-sk"],
  ["audit-locale-cz.mjs", "audit-locale-sk.mjs"],
  ["smoke-cz.mjs", "smoke-sk.mjs"],
  ["ops-health-cz.mjs", "ops-health-sk.mjs"],
  ["PhoneInputCS", "PhoneInputSK"],
  ["formatPhoneE164CS", "formatPhoneE164SK"],
  ["isValidPhoneCSDigits", "isValidPhoneSKDigits"],
  ["parsePhoneCS", "parsePhoneSK"],
  ["normalizePhoneCSDigits", "normalizePhoneSKDigits"],
  ["phoneNationalCS", "phoneNationalSK"],
  ["CZ_PHONE", "SK_PHONE"],
  ["CZ_COUNTRY_CODE", "SK_COUNTRY_CODE"],
  ["formatPhoneCSDisplay", "formatPhoneSKDisplay"],
  ["CZ_PHONE_RE", "SK_PHONE_RE"],
  ["CZ_PHONE_E164_RE", "SK_PHONE_E164_RE"],
  ["CZ_PHONE_ERROR_CS", "SK_PHONE_ERROR_SK"],
  ["CZ_MOBILE_RE", "SK_MOBILE_RE"],
  ["CZ_LANDLINE_RE", "SK_LANDLINE_RE"],
  ["setup-cz-supabase.mjs", "setup-sk-supabase.mjs"],
  ["setup:supabase\": \"node scripts/setup-cz-supabase.mjs\"", "setup:supabase\": \"node scripts/setup-sk-supabase.mjs\""],
  ["v1-cz-initial", "v1-sk-initial"],
  ["pickCzechCities", "pickSlovakCities"],
  ["CZ_CITY_POOL", "SK_CITY_POOL"],
  ["Česká lékařská komora", "Slovenská lekárska komora"],
  ["cs-CZ", "sk-SK"],
  ["Czech-only storefront", "Slovak-only storefront"],
  ["cs_CZ", "sk_SK"],
  ["lang: \"cs\"", "lang: \"sk\""],
  ["Type Lang = \"cs\"", "Type Lang = \"sk\""],
  ["LANGS: readonly Lang[] = [\"cs\"]", "LANGS: readonly Lang[] = [\"sk\"]"],
  ["generate-sample-cz", "generate-sample-sk"],
  ["audit-prompts-cz", "audit-prompts-sk"],
  ["test:prompts-cz", "test:prompts-sk"],
  ["cz-feed-discovery.mjs", "sk-feed-discovery.mjs"],
  ["CZ ONLY", "SK ONLY"],
  ["Czech Republic", "Slovakia"],
  ["Česká republika", "Slovensko"],
  ["v České republice", "na Slovensku"],
  ["po celé České republice", "po celom Slovensku"],
  ["ueuhriesbkeoivcndzmx", "nakdzwufexdrahwrzriw"],
  ["localize:titles:cz", "localize:titles:sk"],
  ["audit:locale-cz", "audit:locale-sk"],
  ["patch-cz-imports.mjs", "patch-sk-imports.mjs"],
  ["patch-ai-content-cz.mjs", "patch-ai-content-sk.mjs"],
  ["mechanical-cz-phrases.mjs", "mechanical-sk-phrases.mjs"],
  ["gen-cz-from-hu.mjs", "gen-sk-from-cs.mjs"],
  ["bootstrap-cz-infra.mjs", "bootstrap-sk-infra.mjs"],
  ["translate-ui-cz", "translate-ui-sk"],
  ["translate-content-cz", "translate-content-sk"],
  ["translate-reviews-cz", "translate-reviews-sk"],
  ["czechize-cz", "slovakize-sk"],
  ["safe-czechize-cz", "safe-slovakize-sk"],
  ["locale-leak-cz", "locale-leak-sk"],
  ["hasNonCzechProductContent", "hasNonSlovakProductContent"],
  ["hasNonCzechLocaleLeak", "hasNonSlovakLocaleLeak"],
  ["czechizeProductFacts", "slovakizeProductFacts"],
  ["czechizeTerm", "slovakizeTerm"],
  ["inferProductRoleCs", "inferProductRoleSk"],
  ["getCategoryDescriptorCS", "getCategoryDescriptorSK"],
  ["getCategoryContentCS", "getCategoryContentSK"],
  ["buildCzechOutputGuide", "buildSlovakOutputGuide"],
  ["buildPainFirstVocabularyGuideCS", "buildPainFirstVocabularyGuideSK"],
  ["buildNicheContentCS", "buildNicheContentSK"],
  ["NEW_CATEGORY_NAMES_CS", "NEW_CATEGORY_NAMES_SK"],
  ["CS_PLACEHOLDER_MARKERS", "SK_PLACEHOLDER_MARKERS"],
  ["csPlaceholderHtml", "skPlaceholderHtml"],
  ["csSupplementCategoryFallback", "skSupplementCategoryFallback"],
  ["csGenericFallbackContent", "skGenericFallbackContent"],
  ["csPlaceholderFaq", "skPlaceholderFaq"],
  ["CATEGORY_CS_BODIES", "CATEGORY_SK_BODIES"],
  ["CATEGORY_CS_TEXTS", "CATEGORY_SK_TEXTS"],
  ["NICHE_TEMPLATES_CS", "NICHE_TEMPLATES_SK"],
  ["CsReviewBody", "SkReviewBody"],
  ["goodRoleCs", "goodRoleSk"],
  ["badRoleCs", "badRoleSk"],
  ["roleCs", "roleSk"],
  ["DELIVERY_CS", "DELIVERY_SK"],
  ["QUALITY_CS", "QUALITY_SK"],
  ["WATER_PHRASES_CS", "WATER_PHRASES_SK"],
  ["CS_BY_KIND", "SK_BY_KIND"],
  ["GENERIC_CS", "GENERIC_SK"],
  ["CS_META", "SK_META"],
  ["TRANSLATE_SYSTEM_CS", "TRANSLATE_SYSTEM_SK"],
  ["LEAD_ERRORS_CS", "LEAD_ERRORS_SK"],
  ["CsPromptSource", "SkPromptSource"],
  ["availableLanguage: [\"Czech\"]", "availableLanguage: [\"Slovak\"]"],
  ["areaServed: \"CZ\"", "areaServed: \"SK\""],
  ["geo.region: \"CZ\"", "geo.region: \"SK\""],
  ["geo.placename: \"Czech Republic\"", "geo.placename: \"Slovakia\""],
  ["INDEXNOW_HOST = \"recenze-ceny.cz\"", "INDEXNOW_HOST = \"skrecenzie.sk\""],
  ["audit-shelf-mismatches-cz", "audit-shelf-mismatches-sk"],
  ["+420", "+421"],
  ['return `${Math.round(amount).toLocaleString("cs-CZ")} Kč`;', 'return `${Math.round(amount).toLocaleString("sk-SK")} €`;'],
  ["CZ storefront:", "SK storefront:"],
  ["Po–So · 9:00–20:00 (CET)", "Po–So · 9:00–20:00 (CET)"],
  ["/pruvodce", "/sprievodca"],
  ["GUIDE_PATH = \"/pruvodce\"", "GUIDE_PATH = \"/sprievodca\""],
  ["MUDr. Jan Novák", "MUDr. Peter Kováč"],
  ["ops:health\": \"node scripts/ops-health-cz.mjs\"", "ops:health\": \"node scripts/ops-health-sk.mjs\""],
  ["finish-ai-content-cz.mjs", "finish-ai-content-sk.mjs"],
  ["czechize-vocab-run.mjs", "slovakize-vocab-run.mjs"],
  ["czechize-pipeline-cz.mjs", "slovakize-pipeline-sk.mjs"],
  ["audit-product-content-cz.mjs", "audit-product-content-sk.mjs"],
  ["audit-shelf-mismatches-cz.ts", "audit-shelf-mismatches-sk.ts"],
  ["buildToolSchemaCS", "buildToolSchemaSK"],
  ["buildFaqToolSchemaCS", "buildFaqToolSchemaSK"],
  ["buildCzechOutputGuideCS", "buildSlovakOutputGuideSK"],
  ["buildCzechOutputGuideFaqCS", "buildSlovakOutputGuideFaqSK"],
  ["buildCatalogShelfGuideCS", "buildCatalogShelfGuideSK"],
  ["buildDescriptorStyleGuideCS", "buildDescriptorStyleGuideSK"],
  ["buildFeedTitleCleanGuideCS", "buildFeedTitleCleanGuideSK"],
  ["buildInventionPolicyBlockCS", "buildInventionPolicyBlockSK"],
  ["buildNoPhotoCopyGuideCS", "buildNoPhotoCopyGuideSK"],
  ["buildNonMedicalBlockCS", "buildNonMedicalBlockSK"],
  ["buildProductIntentGuideCS", "buildProductIntentGuideSK"],
  ["buildProductRoleGuideCS", "buildProductRoleGuideSK"],
  ["buildReviewThemeGuideCS", "buildReviewThemeGuideSK"],
  ["buildReviewVoiceGuideCS", "buildReviewVoiceGuideSK"],
  ["buildShelfClassificationGuideCS", "buildShelfClassificationGuideSK"],
  ["buildShelfDisambiguationGuideCS", "buildShelfDisambiguationGuideSK"],
  ["buildShortFieldsGuideCS", "buildShortFieldsGuideSK"],
  ["buildStructureSpecCS", "buildStructureSpecSK"],
  ["buildStructureSpecCompactCS", "buildStructureSpecCompactSK"],
  ["buildDescHtmlToolHintCS", "buildDescHtmlToolHintSK"],
  ["buildFaqUserPromptCS", "buildFaqUserPromptSK"],
  ["buildUserPromptCS", "buildUserPromptSK"],
  ["test:pipeline-cs", "test:pipeline-sk"],
  ["country: \"CZ\"", "country: \"SK\""],
  ["lang = \"cs\"", "lang = \"sk\""],
  ["getLangFromPath", "getLangFromPath"],
  ["I18N = { cs:", "I18N = { sk:"],
  ["getI18n(\"cs\")", "getI18n(\"sk\")"],
  ["DEFAULT_LANG: Lang = \"cs\"", "DEFAULT_LANG: Lang = \"sk\""],
  ["Brno", "Košice"],
  ["Ostrava", "Prešov"],
  ["Plzeň", "Žilina"],
  ["Liberec", "Nitra"],
  ["Olomouc", "Banská Bystrica"],
  ["České Budějovice", "Trnava"],
  ["Hradec Králové", "Trenčín"],
  ["Pardubice", "Martin"],
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

// Rename pruvodce route → sprievodca
const routeRenames = [
  ["src/routes/pruvodce.$slug.tsx", "src/routes/sprievodca.$slug.tsx"],
];
for (const [from, to] of routeRenames) {
  const src = path.join(ROOT, from);
  const dst = path.join(ROOT, to);
  if (fs.existsSync(src) && !fs.existsSync(dst)) {
    let text = fs.readFileSync(src, "utf8");
    text = text.replace(/\/pruvodce/g, "/sprievodca");
    text = text.replace(/createFileRoute\("\/pruvodce/g, 'createFileRoute("/sprievodca');
    fs.writeFileSync(dst, text, "utf8");
    fs.unlinkSync(src);
    console.log("renamed", from, "→", to);
  }
}

let changed = 0;
for (const file of walk(ROOT)) {
  if (
    file.includes("bootstrap-sk-infra.mjs") ||
    file.includes("bootstrap-cz-infra.mjs") ||
    file.includes("gen-sk-from-cs.mjs")
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

console.log(`bootstrap-sk-infra: ${changed} files patched`);
