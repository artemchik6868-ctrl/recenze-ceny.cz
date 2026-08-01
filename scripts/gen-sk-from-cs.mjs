/**
 * Generate *.sk.ts modules from *.cs.ts (Slovak market bootstrap).
 * Run: node scripts/gen-sk-from-cs.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["node_modules", ".output", ".git"]);

const PHRASES = [
  ["buildPainFirstVocabularyGuideCS", "buildPainFirstVocabularyGuideSK"],
  ["buildNicheContentCS", "buildNicheContentSK"],
  ["NEW_CATEGORY_NAMES_CS", "NEW_CATEGORY_NAMES_SK"],
  ["buildCzechOutputGuideFaqCS", "buildSlovakOutputGuideFaqSK"],
  ["buildCzechOutputGuideCS", "buildSlovakOutputGuideSK"],
  ["buildInventionPolicyBlockCS", "buildInventionPolicyBlockSK"],
  ["buildShortFieldsGuideCS", "buildShortFieldsGuideSK"],
  ["buildCatalogShelfGuideCS", "buildCatalogShelfGuideSK"],
  ["buildNoPhotoCopyGuideCS", "buildNoPhotoCopyGuideSK"],
  ["buildNonMedicalBlockCS", "buildNonMedicalBlockSK"],
  ["buildStructureSpecCompactCS", "buildStructureSpecCompactSK"],
  ["buildStructureSpecCS", "buildStructureSpecSK"],
  ["buildDescHtmlToolHintCS", "buildDescHtmlToolHintSK"],
  ["buildToolSchemaCS", "buildToolSchemaSK"],
  ["buildFaqToolSchemaCS", "buildFaqToolSchemaSK"],
  ["buildFaqUserPromptCS", "buildFaqUserPromptSK"],
  ["buildUserPromptCS", "buildUserPromptSK"],
  ["buildProductIntentGuideCS", "buildProductIntentGuideSK"],
  ["buildProductRoleGuideCS", "buildProductRoleGuideSK"],
  ["buildShelfDisambiguationGuideCS", "buildShelfDisambiguationGuideSK"],
  ["buildFeedTitleCleanGuideCS", "buildFeedTitleCleanGuideSK"],
  ["buildReviewVoiceGuideCS", "buildReviewVoiceGuideSK"],
  ["buildReviewThemeGuideCS", "buildReviewThemeGuideSK"],
  ["buildShelfClassificationGuideCS", "buildShelfClassificationGuideSK"],
  ["buildDescriptorStyleGuideCS", "buildDescriptorStyleGuideSK"],
  ["inferProductRoleCs", "inferProductRoleSk"],
  ["czechizeProductFacts", "slovakizeProductFacts"],
  ["czechizeTerm", "slovakizeTerm"],
  ["WATER_PHRASES_CS", "WATER_PHRASES_SK"],
  ["CS_BY_KIND", "SK_BY_KIND"],
  ["GENERIC_CS", "GENERIC_SK"],
  ["CS_META", "SK_META"],
  ["pickCzechCities", "pickSlovakCities"],
  ["CZ_CITY_POOL", "SK_CITY_POOL"],
  ["CsPromptSource", "SkPromptSource"],
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
  ["getCategoryDescriptorCS", "getCategoryDescriptorSK"],
  [".cs.ts", ".sk.ts"],
  [".cs\"", ".sk\""],
  [".cs'", ".sk'"],
  ["category-descriptors.cs", "category-descriptors.sk"],
  ["niche-content.cs", "niche-content.sk"],
  ["content.cs", "content.sk"],
  ["product-intent.cs", "product-intent.sk"],
  ["product-role.cs", "product-role.sk"],
  ["problem-vocabulary.cs", "problem-vocabulary.sk"],
  ["potency-vocabulary.cs", "potency-vocabulary.sk"],
  ["feed-title-clean.cs", "feed-title-clean.sk"],
  ["review-themes.cs", "review-themes.sk"],
  ["review-voice.cs", "review-voice.sk"],
  ["product-facts.cs-labels", "product-facts.sk-labels"],
  ["review-templates-cat.cs", "review-templates-cat.sk"],
  ["review-templates-niche.cs", "review-templates-niche.sk"],
  ["review-templates-slug.cs", "review-templates-slug.sk"],
  ["review-templates-theme.cs", "review-templates-theme.sk"],
  ["ai-content.cs-prompts", "ai-content.sk-prompts"],
  ["ai-content.cs-fallbacks", "ai-content.sk-fallbacks"],
  ["ai-content.examples.cs", "ai-content.examples.sk"],
  ["shelf-classification.examples.cs", "shelf-classification.examples.sk"],
  ["locale-leak-cz", "locale-leak-sk"],
  ["ai-content-pipeline.cs", "ai-content-pipeline.sk"],
  ["title-translate.cs", "title-translate.sk"],
  ["seo-intent.cs", "seo-intent.sk"],
  ["nutra-lane-archetypes.cs", "nutra-lane-archetypes.sk"],
  ["hemorrhoid-vocabulary.cs", "hemorrhoid-vocabulary.sk"],
  ["shelf-topic.cs", "shelf-topic.sk"],
  ["shelf-disambiguation.cs", "shelf-disambiguation.sk"],
  ["lead-errors.cs", "lead-errors.sk"],
  ["phone.cs", "phone.sk"],
  ["i18n.cs", "i18n.sk"],
  ["legal.cs", "legal.sk"],
  ["Czech storefront", "Slovak storefront"],
  ["Czech Republic market", "Slovakia market"],
  ["Czech UI", "Slovak UI"],
  ["Czech category", "Slovak category"],
  ["Czech review", "Slovak review"],
  ["Czech prompt", "Slovak prompt"],
  ["Czech fallback", "Slovak fallback"],
  ["Czech content", "Slovak content"],
  ["Czech labels", "Slovak labels"],
  ["Český", "Slovenský"],
  ["český", "slovenský"],
  ["ČESKÝ", "SLOVENSKÝ"],
  ["česky", "slovensky"],
  ["českým jazykem", "slovenským jazykom"],
  ["Česká republika", "Slovensko"],
  ["v České republice", "na Slovensku"],
  ["Celá Česká republika", "Celé Slovensko"],
  ["Vybráno pro Českou republiku", "Vybrané pre Slovensko"],
  ["Doručení po celé České republice", "Doručenie po celom Slovensku"],
  ["Platba na dobírku", "Platba na dobierku"],
  ["Expresní kurýr", "Expresný kuriér"],
  ["Domů", "Domov"],
  ["Kategorie", "Kategórie"],
  ["O nás", "O nás"],
  ["Doručení", "Doručenie"],
  ["Nápověda", "Pomocník"],
  ["Kontakt", "Kontakt"],
  ["Ověřené zdravotní produkty", "Overené zdravotné produkty"],
  ["Recenze Ceny", "SK Recenzie"],
  ["MUDr. Jan Novák", "MUDr. Peter Kováč"],
  ["Praha", "Bratislava"],
  ["Brno", "Košice"],
  ["Ostrava", "Prešov"],
  ["Plzeň", "Žilina"],
  ["Liberec", "Nitra"],
  ["Olomouc", "Banská Bystrica"],
  ["České Budějovice", "Trnava"],
  ["Hradec Králové", "Trenčín"],
  ["Pardubice", "Martin"],
  ["CZK", "EUR"],
  [" Kč", " €"],
  ["cs-CZ", "sk-SK"],
  ["hasNonCzechProductContent", "hasNonSlovakProductContent"],
  ["hasNonCzechLocaleLeak", "hasNonSlovakLocaleLeak"],
  ["LEAD_ERRORS_CS", "LEAD_ERRORS_SK"],
  ["TRANSLATE_SYSTEM_CS", "TRANSLATE_SYSTEM_SK"],
  ["getCategoryContentCS", "getCategoryContentSK"],
  ["recenze-ceny.cz", "skrecenzie.sk"],
  ["+420", "+421"],
  ["/pruvodce", "/sprievodca"],
  ["CZ_COUNTRY_CODE", "SK_COUNTRY_CODE"],
  ["CZ_PHONE", "SK_PHONE"],
  ["formatPhoneE164CS", "formatPhoneE164SK"],
  ["parsePhoneCS", "parsePhoneSK"],
  ["CZ_PHONE_ERROR_CS", "SK_PHONE_ERROR_SK"],
  ["CZ_PHONE_E164_RE", "SK_PHONE_E164_RE"],
  ["CZ_PHONE_RE", "SK_PHONE_RE"],
  ["isValidPhoneCSDigits", "isValidPhoneSKDigits"],
  ["normalizePhoneCSDigits", "normalizePhoneSKDigits"],
  ["formatPhoneCSDisplay", "formatPhoneSKDisplay"],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith(".cs.ts") || /-cs\.ts$/.test(name) || /\.cs-/.test(name)) files.push(p);
  }
  return files;
}

let copied = 0;
for (const src of walk(path.join(ROOT, "src"))) {
  const dst = src
    .replace(/\.cs\.ts$/, ".sk.ts")
    .replace(/-cs\.ts$/, "-sk.ts")
    .replace(/\.cs-/g, ".sk-")
    .replace(/-cs-/g, "-sk-");
  if (src === dst) continue;
  let text = fs.readFileSync(src, "utf8");
  let next = text;
  for (const [from, to] of PHRASES) next = next.split(from).join(to);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, next, "utf8");
  copied += 1;
  console.log("generated", path.relative(ROOT, dst));
}

// locale-leak-cz.ts → locale-leak-sk.ts
const leakSrc = path.join(ROOT, "src/lib/locale-leak-cz.ts");
const leakDst = path.join(ROOT, "src/lib/locale-leak-sk.ts");
if (fs.existsSync(leakSrc)) {
  let text = fs.readFileSync(leakSrc, "utf8");
  let next = text;
  for (const [from, to] of PHRASES) next = next.split(from).join(to);
  next = next.replace(/hasNonCzechLocaleLeak/g, "hasNonSlovakLocaleLeak");
  next = next.replace(/hasNonCzechProductContent/g, "hasNonSlovakProductContent");
  fs.writeFileSync(leakDst, next, "utf8");
  console.log("generated", path.relative(ROOT, leakDst));
  copied += 1;
}

console.log(`gen-sk-from-cs: ${copied} files`);
