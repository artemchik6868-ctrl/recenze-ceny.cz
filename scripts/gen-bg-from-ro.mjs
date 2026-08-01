/**
 * Generate *.bg.ts modules from *.ro.ts (Czech Republic market bootstrap).
 * Run: node scripts/gen-cz-from-hu.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["node_modules", ".output", ".git"]);

const PHRASES = [
  ["buildPainFirstVocabularyGuideRO", "buildPainFirstVocabularyGuideCS"],
  ["buildNicheContentRO", "buildNicheContentCS"],
  ["NEW_CATEGORY_NAMES_RO", "NEW_CATEGORY_NAMES_CS"],
  ["buildRomanianOutputGuideFaqRO", "buildCzech RepublicnOutputGuideFaqBG"],
  ["buildRomanianOutputGuideRO", "buildCzech RepublicnOutputGuideBG"],
  ["buildInventionPolicyBlockRO", "buildInventionPolicyBlockBG"],
  ["buildShortFieldsGuideRO", "buildShortFieldsGuideBG"],
  ["buildCatalogShelfGuideRO", "buildCatalogShelfGuideBG"],
  ["buildNoPhotoCopyGuideRO", "buildNoPhotoCopyGuideBG"],
  ["buildNonMedicalBlockRO", "buildNonMedicalBlockBG"],
  ["buildStructureSpecCompactRO", "buildStructureSpecCompactBG"],
  ["buildStructureSpecRO", "buildStructureSpecBG"],
  ["buildDescHtmlToolHintRO", "buildDescHtmlToolHintBG"],
  ["buildToolSchemaRO", "buildToolSchemaBG"],
  ["buildFaqToolSchemaRO", "buildFaqToolSchemaBG"],
  ["buildFaqUserPromptRO", "buildFaqUserPromptBG"],
  ["buildUserPromptRO", "buildUserPromptBG"],
  ["buildProductIntentGuideRO", "buildProductIntentGuideBG"],
  ["buildProductRoleGuideRO", "buildProductRoleGuideBG"],
  ["buildShelfDisambiguationGuideRO", "buildShelfDisambiguationGuideBG"],
  ["buildFeedTitleCleanGuideRO", "buildFeedTitleCleanGuideBG"],
  ["buildReviewVoiceGuideRO", "buildReviewVoiceGuideBG"],
  ["buildReviewThemeGuideRO", "buildReviewThemeGuideBG"],
  ["buildShelfClassificationGuideRO", "buildShelfClassificationGuideBG"],
  ["buildDescriptorStyleGuideRO", "buildDescriptorStyleGuideBG"],
  ["inferProductRoleRo", "inferProductRoleCs"],
  ["romanianizeProductFacts", "czechizeProductFacts"],
  ["romanianizeTerm", "czechizeTerm"],
  ["WATER_PHRASES_RO", "WATER_PHRASES_CS"],
  ["RO_BY_KIND", "CS_BY_KIND"],
  ["GENERIC_RO", "GENERIC_CS"],
  ["RO_META", "CS_META"],
  ["pickRomanianCities", "pickCzechCities"],
  ["RO_CITY_POOL", "CZ_CITY_POOL"],
  ["RoPromptSource", "CsPromptSource"],
  ["RO_PLACEHOLDER_MARKERS", "CS_PLACEHOLDER_MARKERS"],
  ["roPlaceholderHtml", "csPlaceholderHtml"],
  ["roSupplementCategoryFallback", "csSupplementCategoryFallback"],
  ["roGenericFallbackContent", "csGenericFallbackContent"],
  ["roPlaceholderFaq", "csPlaceholderFaq"],
  ["CATEGORY_RO_BODIES", "CATEGORY_CS_BODIES"],
  ["CATEGORY_RO_TEXTS", "CATEGORY_CS_TEXTS"],
  ["NICHE_TEMPLATES_RO", "NICHE_TEMPLATES_CS"],
  ["RoReviewBody", "CsReviewBody"],
  ["goodRoleRo", "goodRoleCs"],
  ["badRoleRo", "badRoleCs"],
  ["roleRo", "roleCs"],
  ["DELIVERY_RO", "DELIVERY_CS"],
  ["QUALITY_RO", "QUALITY_CS"],
  ["getCategoryDescriptorRO", "getCategoryDescriptorCS"],
  [".ro.ts", ".bg.ts"],
  [".ro\"", ".bg\""],
  [".ro'", ".bg'"],
  ["category-descriptors.ro", "category-descriptors.bg"],
  ["niche-content.ro", "niche-content.bg"],
  ["content.ro", "content.bg"],
  ["product-intent.ro", "product-intent.bg"],
  ["product-role.ro", "product-role.bg"],
  ["problem-vocabulary.ro", "problem-vocabulary.bg"],
  ["potency-vocabulary.ro", "potency-vocabulary.bg"],
  ["feed-title-clean.ro", "feed-title-clean.bg"],
  ["review-themes.ro", "review-themes.bg"],
  ["review-voice.ro", "review-voice.bg"],
  ["product-facts.ro-labels", "product-facts.bg-labels"],
  ["review-templates-cat.ro", "review-templates-cat.bg"],
  ["review-templates-niche.ro", "review-templates-niche.bg"],
  ["review-templates-slug.ro", "review-templates-slug.bg"],
  ["review-templates-theme.ro", "review-templates-theme.bg"],
  ["ai-content.ro-prompts", "ai-content.bg-prompts"],
  ["ai-content.ro-fallbacks", "ai-content.bg-fallbacks"],
  ["ai-content.examples.ro", "ai-content.examples.bg"],
  ["shelf-classification.examples.ro", "shelf-classification.examples.bg"],
  ["locale-leak-ro", "locale-leak-cz"],
  ["ai-content-pipeline.ro", "ai-content-pipeline.bg"],
  ["title-translate.ro", "title-translate.bg"],
  ["seo-intent.ro", "seo-intent.bg"],
  ["nutra-lane-archetypes.ro", "nutra-lane-archetypes.bg"],
  ["hemorrhoid-vocabulary.ro", "hemorrhoid-vocabulary.bg"],
  ["shelf-topic.ro", "shelf-topic.bg"],
  ["shelf-disambiguation.ro", "shelf-disambiguation.bg"],
  ["lead-errors.ro", "lead-errors.bg"],
  ["phone.ro", "phone.hu"],
  ["i18n.ro", "i18n.bg"],
  ["legal.ro", "legal.ro"],
  ["Romanian storefront", "Czech storefront"],
  ["Romania market", "Czech Republic market"],
  ["Romanian UI", "Czech Republicn UI"],
  ["Romanian category", "Czech Republicn category"],
  ["Romanian review", "Czech Republicn review"],
  ["Romanian prompt", "Czech Republicn prompt"],
  ["Romanian fallback", "Czech Republicn fallback"],
  ["Romanian content", "Czech Republicn content"],
  ["Romanian labels", "Czech Republicn labels"],
  ["Română", "Български"],
  ["română", "български"],
  ["ROMÂNĂ", "БЪЛГАРСКИ"],
  ["în română", "на български"],
  ["în limba română", "на български език"],
  ["Român", "Българин"],
  ["România", "Česká republika"],
  ["României", "Česká republika"],
  ["în România", "в Česká republika"],
  ["în toată România", "в цяла Česká republika"],
  ["Toată România", "Цяла Česká republika"],
  ["Selectat pentru România", "Избрано за Česká republika"],
  ["Livrare în toată România", "Доставка в цяла Česká republika"],
  ["Plata la livrare", "Плащане при доставка"],
  ["Curier rapid", "Експресен куриер"],
  ["Acasă", "Начало"],
  ["Categorii", "Категории"],
  ["Despre noi", "За нас"],
  ["Livrare", "Доставка"],
  ["Ajutor", "Помощ"],
  ["Contact", "Контакт"],
  ["Produse de sănătate verificate", "Проверени здравни продукти"],
  ["Recenzii Produse", "Recenze Ceny"],
  ["Dr. Andrei Popescu", "Д-р Иван Петров"],
  ["București", "Praha"],
  ["Cluj-Napoca", "Пловдив"],
  ["Timișoara", "Варна"],
  ["Iași", "Бургас"],
  ["Constanța", "Русе"],
  ["Craiova", "Стара Загора"],
  ["Brașov", "Плевен"],
  ["Galați", "Шумен"],
  ["Oradea", "Перник"],
  ["RON", "BGN"],
  [" lei", " лв."],
  ["ro-RO", "cs-CZ"],
  ["hasNonRomanianProductContent", "hasNonCzech RepublicnProductContent"],
  ["hasNonRomanianLocaleLeak", "hasNonCzech RepublicnLocaleLeak"],
  ["LEAD_ERRORS_RO", "LEAD_ERRORS_CS"],
  ["TRANSLATE_SYSTEM_RO", "TRANSLATE_SYSTEM_CS"],
  ["getCategoryContentRO", "getCategoryContentCS"],
  ["buildNicheContentRO", "buildNicheContentCS"],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith(".ro.ts") || /-ro\.ts$/.test(name) || /\.ro-/.test(name)) files.push(p);
  }
  return files;
}

let copied = 0;
for (const src of walk(path.join(ROOT, "src"))) {
  const dst = src
    .replace(/\.ro\.ts$/, ".bg.ts")
    .replace(/-ro\.ts$/, "-bg.ts")
    .replace(/\.ro-/g, ".bg-")
    .replace(/-ro-/g, "-bg-");
  if (src === dst) continue;
  let text = fs.readFileSync(src, "utf8");
  let next = text;
  for (const [from, to] of PHRASES) next = next.split(from).join(to);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, next, "utf8");
  copied += 1;
  console.log("generated", path.relative(ROOT, dst));
}
console.log(`gen-bg-from-ro: ${copied} files`);
