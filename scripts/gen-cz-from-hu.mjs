/**
 * Generate *.cs.ts modules from *.hu.ts (Czech market bootstrap).
 * Run: node scripts/gen-cz-from-hu.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["node_modules", ".output", ".git"]);

const PHRASES = [
  ["buildPainFirstVocabularyGuideHU", "buildPainFirstVocabularyGuideCS"],
  ["buildNicheContentHU", "buildNicheContentCS"],
  ["NEW_CATEGORY_NAMES_HU", "NEW_CATEGORY_NAMES_CS"],
  ["buildHungarianOutputGuideFaqHU", "buildCzechOutputGuideFaqCS"],
  ["buildHungarianOutputGuideHU", "buildCzechOutputGuideCS"],
  ["buildInventionPolicyBlockHU", "buildInventionPolicyBlockCS"],
  ["buildShortFieldsGuideHU", "buildShortFieldsGuideCS"],
  ["buildCatalogShelfGuideHU", "buildCatalogShelfGuideCS"],
  ["buildNoPhotoCopyGuideHU", "buildNoPhotoCopyGuideCS"],
  ["buildNonMedicalBlockHU", "buildNonMedicalBlockCS"],
  ["buildStructureSpecCompactHU", "buildStructureSpecCompactCS"],
  ["buildStructureSpecHU", "buildStructureSpecCS"],
  ["buildDescHtmlToolHintHU", "buildDescHtmlToolHintCS"],
  ["buildToolSchemaHU", "buildToolSchemaCS"],
  ["buildFaqToolSchemaHU", "buildFaqToolSchemaCS"],
  ["buildFaqUserPromptHU", "buildFaqUserPromptCS"],
  ["buildUserPromptHU", "buildUserPromptCS"],
  ["buildProductIntentGuideHU", "buildProductIntentGuideCS"],
  ["buildProductRoleGuideHU", "buildProductRoleGuideCS"],
  ["buildShelfDisambiguationGuideHU", "buildShelfDisambiguationGuideCS"],
  ["buildFeedTitleCleanGuideHU", "buildFeedTitleCleanGuideCS"],
  ["buildReviewVoiceGuideHU", "buildReviewVoiceGuideCS"],
  ["buildReviewThemeGuideHU", "buildReviewThemeGuideCS"],
  ["buildShelfClassificationGuideHU", "buildShelfClassificationGuideCS"],
  ["buildDescriptorStyleGuideHU", "buildDescriptorStyleGuideCS"],
  ["inferProductRoleHu", "inferProductRoleCs"],
  ["hungarianizeProductFacts", "czechizeProductFacts"],
  ["hungarianizeTerm", "czechizeTerm"],
  ["WATER_PHRASES_HU", "WATER_PHRASES_CS"],
  ["HU_BY_KIND", "CS_BY_KIND"],
  ["GENERIC_HU", "GENERIC_CS"],
  ["HU_META", "CS_META"],
  ["pickHungarianCities", "pickCzechCities"],
  ["HU_CITY_POOL", "CZ_CITY_POOL"],
  ["HuPromptSource", "CsPromptSource"],
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
  ["getCategoryDescriptorHU", "getCategoryDescriptorCS"],
  [".hu.ts", ".cs.ts"],
  [".hu\"", ".cs\""],
  [".hu'", ".cs'"],
  ["category-descriptors.hu", "category-descriptors.cs"],
  ["niche-content.hu", "niche-content.cs"],
  ["content.hu", "content.cs"],
  ["product-intent.hu", "product-intent.cs"],
  ["product-role.hu", "product-role.cs"],
  ["problem-vocabulary.hu", "problem-vocabulary.cs"],
  ["potency-vocabulary.hu", "potency-vocabulary.cs"],
  ["feed-title-clean.hu", "feed-title-clean.cs"],
  ["review-themes.hu", "review-themes.cs"],
  ["review-voice.hu", "review-voice.cs"],
  ["product-facts.hu-labels", "product-facts.cs-labels"],
  ["review-templates-cat.hu", "review-templates-cat.cs"],
  ["review-templates-niche.hu", "review-templates-niche.cs"],
  ["review-templates-slug.hu", "review-templates-slug.cs"],
  ["review-templates-theme.hu", "review-templates-theme.cs"],
  ["ai-content.hu-prompts", "ai-content.cs-prompts"],
  ["ai-content.hu-fallbacks", "ai-content.cs-fallbacks"],
  ["ai-content.examples.hu", "ai-content.examples.cs"],
  ["shelf-classification.examples.hu", "shelf-classification.examples.cs"],
  ["locale-leak-hu", "locale-leak-cz"],
  ["ai-content-pipeline.hu", "ai-content-pipeline.cs"],
  ["title-translate.hu", "title-translate.cs"],
  ["seo-intent.hu", "seo-intent.cs"],
  ["nutra-lane-archetypes.hu", "nutra-lane-archetypes.cs"],
  ["hemorrhoid-vocabulary.hu", "hemorrhoid-vocabulary.cs"],
  ["shelf-topic.hu", "shelf-topic.cs"],
  ["shelf-disambiguation.hu", "shelf-disambiguation.cs"],
  ["lead-errors.hu", "lead-errors.cs"],
  ["phone.hu", "phone.cs"],
  ["i18n.hu", "i18n.cs"],
  ["legal.hu", "legal.cs"],
  ["Hungarian storefront", "Czech storefront"],
  ["Hungary market", "Czech Republic market"],
  ["Hungarian UI", "Czech UI"],
  ["Hungarian category", "Czech category"],
  ["Hungarian review", "Czech review"],
  ["Hungarian prompt", "Czech prompt"],
  ["Hungarian fallback", "Czech fallback"],
  ["Hungarian content", "Czech content"],
  ["Hungarian labels", "Czech labels"],
  ["Magyar", "Český"],
  ["magyar", "český"],
  ["MAGYAR", "ČESKÝ"],
  ["magyarul", "česky"],
  ["magyar nyelven", "českým jazykem"],
  ["Magyarország", "Česká republika"],
  ["Magyarországon", "v České republice"],
  ["Egész Magyarország", "Celá Česká republika"],
  ["Magyarországra válogatva", "Vybráno pro Českou republiku"],
  ["Szállítás egész Magyarországon", "Doručení po celé České republice"],
  ["Utánvétes fizetés", "Platba na dobírku"],
  ["Expressz futár", "Expresní kurýr"],
  ["Kezdőlap", "Domů"],
  ["Kategóriák", "Kategorie"],
  ["Rólunk", "O nás"],
  ["Szállítás", "Doručení"],
  ["Segítség", "Nápověda"],
  ["Kapcsolat", "Kontakt"],
  ["Ellenőrzött egészségügyi termékek", "Ověřené zdravotní produkty"],
  ["VelemenyLab", "Recenze Ceny"],
  ["Dr. Kovács Péter", "MUDr. Jan Novák"],
  ["Budapest", "Praha"],
  ["Debrecen", "Brno"],
  ["Szeged", "Ostrava"],
  ["Pécs", "Plzeň"],
  ["Győr", "Liberec"],
  ["Miskolc", "Olomouc"],
  ["Székesfehérvár", "České Budějovice"],
  ["Nyíregyháza", "Hradec Králové"],
  ["Kecskemét", "Pardubice"],
  ["HUF", "CZK"],
  [" Ft", " Kč"],
  ["hu-HU", "cs-CZ"],
  ["hasNonHungarianProductContent", "hasNonCzechProductContent"],
  ["hasNonHungarianLocaleLeak", "hasNonCzechLocaleLeak"],
  ["LEAD_ERRORS_HU", "LEAD_ERRORS_CS"],
  ["TRANSLATE_SYSTEM_HU", "TRANSLATE_SYSTEM_CS"],
  ["getCategoryContentHU", "getCategoryContentCS"],
  ["buildNicheContentHU", "buildNicheContentCS"],
  ["velemenylab.com", "recenze-ceny.cz"],
  ["+36", "+420"],
  ["/utmutato", "/pruvodce"],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith(".hu.ts") || /-hu\.ts$/.test(name) || /\.hu-/.test(name)) files.push(p);
  }
  return files;
}

let copied = 0;
for (const src of walk(path.join(ROOT, "src"))) {
  const dst = src
    .replace(/\.hu\.ts$/, ".cs.ts")
    .replace(/-hu\.ts$/, "-cs.ts")
    .replace(/\.hu-/g, ".cs-")
    .replace(/-hu-/g, "-cs-");
  if (src === dst) continue;
  let text = fs.readFileSync(src, "utf8");
  let next = text;
  for (const [from, to] of PHRASES) next = next.split(from).join(to);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, next, "utf8");
  copied += 1;
  console.log("generated", path.relative(ROOT, dst));
}

// locale-leak-hu.ts → locale-leak-cz.ts
const leakSrc = path.join(ROOT, "src/lib/locale-leak-hu.ts");
const leakDst = path.join(ROOT, "src/lib/locale-leak-cz.ts");
if (fs.existsSync(leakSrc)) {
  let text = fs.readFileSync(leakSrc, "utf8");
  let next = text;
  for (const [from, to] of PHRASES) next = next.split(from).join(to);
  next = next.replace(/hasNonHungarianLocaleLeak/g, "hasNonCzechLocaleLeak");
  next = next.replace(/hasNonHungarianProductContent/g, "hasNonCzechProductContent");
  fs.writeFileSync(leakDst, next, "utf8");
  console.log("generated", path.relative(ROOT, leakDst));
  copied += 1;
}

console.log(`gen-cz-from-hu: ${copied} files`);
