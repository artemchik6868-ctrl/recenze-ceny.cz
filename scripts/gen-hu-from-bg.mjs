/**
 * Generate *.hu.ts modules from *.bg.ts (Czech Republic market bootstrap).
 * Run: node scripts/gen-cz-from-hu.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["node_modules", ".output", ".git"]);

const PHRASES = [
  ["buildPainFirstVocabularyGuideBG", "buildPainFirstVocabularyGuideCS"],
  ["buildNicheContentBG", "buildNicheContentCS"],
  ["NEW_CATEGORY_NAMES_BG", "NEW_CATEGORY_NAMES_CS"],
  ["buildBulgarianOutputGuideFaqBG", "buildCzechOutputGuideFaqHU"],
  ["buildBulgarianOutputGuideBG", "buildCzechOutputGuideHU"],
  ["buildInventionPolicyBlockBG", "buildInventionPolicyBlockHU"],
  ["buildShortFieldsGuideBG", "buildShortFieldsGuideHU"],
  ["buildCatalogShelfGuideBG", "buildCatalogShelfGuideHU"],
  ["buildNoPhotoCopyGuideBG", "buildNoPhotoCopyGuideHU"],
  ["buildNonMedicalBlockBG", "buildNonMedicalBlockHU"],
  ["buildStructureSpecCompactBG", "buildStructureSpecCompactBG"],
  ["buildStructureSpecBG", "buildStructureSpecHU"],
  ["buildDescHtmlToolHintBG", "buildDescHtmlToolHintHU"],
  ["buildToolSchemaBG", "buildToolSchemaHU"],
  ["buildFaqToolSchemaBG", "buildFaqToolSchemaHU"],
  ["buildFaqUserPromptBG", "buildFaqUserPromptHU"],
  ["buildUserPromptBG", "buildUserPromptHU"],
  ["buildProductIntentGuideBG", "buildProductIntentGuideHU"],
  ["buildProductRoleGuideBG", "buildProductRoleGuideHU"],
  ["buildShelfDisambiguationGuideBG", "buildShelfDisambiguationGuideHU"],
  ["buildFeedTitleCleanGuideBG", "buildFeedTitleCleanGuideHU"],
  ["buildReviewVoiceGuideBG", "buildReviewVoiceGuideHU"],
  ["buildReviewThemeGuideBG", "buildReviewThemeGuideHU"],
  ["buildShelfClassificationGuideBG", "buildShelfClassificationGuideHU"],
  ["buildDescriptorStyleGuideBG", "buildDescriptorStyleGuideHU"],
  ["inferProductRoleBg", "inferProductRoleCs"],
  ["bulgarianizeProductFacts", "czechizeProductFacts"],
  ["bulgarianizeTerm", "czechizeTerm"],
  ["WATER_PHRASES_BG", "WATER_PHRASES_CS"],
  ["BG_BY_KIND", "CS_BY_KIND"],
  ["GENERIC_BG", "GENERIC_CS"],
  ["BG_META", "CS_META"],
  ["pickBulgarianCities", "pickCzechCities"],
  ["BG_CITY_POOL", "CZ_CITY_POOL"],
  ["BgPromptSource", "CsPromptSource"],
  ["BG_PLACEHOLDER_MARKERS", "CS_PLACEHOLDER_MARKERS"],
  ["bgPlaceholderHtml", "csPlaceholderHtml"],
  ["bgSupplementCategoryFallback", "csSupplementCategoryFallback"],
  ["bgGenericFallbackContent", "csGenericFallbackContent"],
  ["bgPlaceholderFaq", "csPlaceholderFaq"],
  ["CATEGORY_BG_BODIES", "CATEGORY_CS_BODIES"],
  ["CATEGORY_BG_TEXTS", "CATEGORY_CS_TEXTS"],
  ["NICHE_TEMPLATES_BG", "NICHE_TEMPLATES_CS"],
  ["BgReviewBody", "CsReviewBody"],
  ["goodRoleBg", "goodRoleCs"],
  ["badRoleBg", "badRoleCs"],
  ["roleBg", "roleCs"],
  ["DELIVERY_BG", "DELIVERY_CS"],
  ["QUALITY_BG", "QUALITY_CS"],
  ["getCategoryDescriptorBG", "getCategoryDescriptorCS"],
  [".bg.ts", ".hu.ts"],
  [".bg\"", ".hu\""],
  [".bg'", ".hu'"],
  ["category-descriptors.bg", "category-descriptors.hu"],
  ["niche-content.bg", "niche-content.hu"],
  ["content.bg", "content.hu"],
  ["product-intent.bg", "product-intent.hu"],
  ["product-role.bg", "product-role.hu"],
  ["problem-vocabulary.bg", "problem-vocabulary.hu"],
  ["potency-vocabulary.bg", "potency-vocabulary.hu"],
  ["feed-title-clean.bg", "feed-title-clean.hu"],
  ["review-themes.bg", "review-themes.hu"],
  ["review-voice.bg", "review-voice.hu"],
  ["product-facts.bg-labels", "product-facts.hu-labels"],
  ["review-templates-cat.bg", "review-templates-cat.hu"],
  ["review-templates-niche.bg", "review-templates-niche.hu"],
  ["review-templates-slug.bg", "review-templates-slug.hu"],
  ["review-templates-theme.bg", "review-templates-theme.hu"],
  ["ai-content.bg-prompts", "ai-content.hu-prompts"],
  ["ai-content.bg-fallbacks", "ai-content.hu-fallbacks"],
  ["ai-content.examples.bg", "ai-content.examples.hu"],
  ["shelf-classification.examples.bg", "shelf-classification.examples.hu"],
  ["locale-leak-bg", "locale-leak-cz"],
  ["ai-content-pipeline.bg", "ai-content-pipeline.hu"],
  ["title-translate.bg", "title-translate.hu"],
  ["seo-intent.bg", "seo-intent.hu"],
  ["nutra-lane-archetypes.bg", "nutra-lane-archetypes.hu"],
  ["hemorrhoid-vocabulary.bg", "hemorrhoid-vocabulary.hu"],
  ["shelf-topic.bg", "shelf-topic.hu"],
  ["shelf-disambiguation.bg", "shelf-disambiguation.hu"],
  ["lead-errors.bg", "lead-errors.hu"],
  ["phone.bg", "phone.hu"],
  ["i18n.bg", "i18n.hu"],
  ["legal.bg", "legal.hu"],
  ["Bulgarian storefront", "Czech storefront"],
  ["Bulgaria market", "Czech Republic market"],
  ["Bulgarian UI", "Hungarian UI"],
  ["Bulgarian category", "Hungarian category"],
  ["Bulgarian review", "Hungarian review"],
  ["Bulgarian prompt", "Hungarian prompt"],
  ["Bulgarian fallback", "Hungarian fallback"],
  ["Bulgarian content", "Hungarian content"],
  ["Bulgarian labels", "Hungarian labels"],
  ["Български", "Magyar"],
  ["български", "magyar"],
  ["БЪЛГАРСКИ", "MAGYAR"],
  ["на български", "magyarul"],
  ["на български език", "magyar nyelven"],
  ["Българин", "Magyar"],
  ["България", "Česká republika"],
  ["в България", "Česká republikaon"],
  ["в цяла България", "egész Česká republikaon"],
  ["Цяла България", "Egész Česká republika"],
  ["Избрано за България", "Česká republikara válogatva"],
  ["Доставка в цяла България", "Szállítás egész Česká republikaon"],
  ["Плащане при доставка", "Utánvétes fizetés"],
  ["Експресен куриер", "Expressz futár"],
  ["Начало", "Kezdőlap"],
  ["Категории", "Kategóriák"],
  ["За нас", "Rólunk"],
  ["Доставка", "Szállítás"],
  ["Помощ", "Segítség"],
  ["Контакт", "Kapcsolat"],
  ["Проверени здравни продукти", "Ellenőrzött egészségügyi termékek"],
  ["BG Otzivi", "Recenze Ceny"],
  ["Отзиви", "Recenze Ceny"],
  ["Д-р Иван Петров", "MUDr. Jan Novák"],
  ["София", "Praha"],
  ["Пловдив", "Debrecen"],
  ["Варна", "Szeged"],
  ["Бургас", "Pécs"],
  ["Русе", "Győr"],
  ["Стара Загора", "Miskolc"],
  ["Плевен", "Székesfehérvár"],
  ["Шумен", "Nyíregyháza"],
  ["Перник", "Kecskemét"],
  ["BGN", "HUF"],
  [" лв.", " Ft"],
  ["bg-BG", "cs-CZ"],
  ["hasNonBulgarianProductContent", "hasNonCzechProductContent"],
  ["hasNonBulgarianLocaleLeak", "hasNonCzechLocaleLeak"],
  ["LEAD_ERRORS_BG", "LEAD_ERRORS_CS"],
  ["TRANSLATE_SYSTEM_BG", "TRANSLATE_SYSTEM_CS"],
  ["getCategoryContentBG", "getCategoryContentCS"],
  ["buildNicheContentBG", "buildNicheContentCS"],
  ["bg-otzivi.com", "recenze-ceny.cz"],
  ["+359", "+420"],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith(".bg.ts") || /-bg\.ts$/.test(name) || /\.bg-/.test(name)) files.push(p);
  }
  return files;
}

let copied = 0;
for (const src of walk(path.join(ROOT, "src"))) {
  const dst = src
    .replace(/\.bg\.ts$/, ".hu.ts")
    .replace(/-bg\.ts$/, "-hu.ts")
    .replace(/\.bg-/g, ".hu-")
    .replace(/-bg-/g, "-hu-");
  if (src === dst) continue;
  let text = fs.readFileSync(src, "utf8");
  let next = text;
  for (const [from, to] of PHRASES) next = next.split(from).join(to);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, next, "utf8");
  copied += 1;
  console.log("generated", path.relative(ROOT, dst));
}
console.log(`gen-hu-from-bg: ${copied} files`);
