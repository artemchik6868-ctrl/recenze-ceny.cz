/** Czech prompt builders for the CZ storefront (stored in product_content *_uk columns). */

import type { ProductFacts } from "./product-facts";
import type { CategoryDescriptor } from "./category-descriptors.cs";
import { getCategoryDescriptor } from "./category-descriptors.cs";
import { buildFactsBlockBg, czechizeProductFacts } from "./product-facts.cs-labels";
import { getNicheType } from "./niche-types";
import { deliveryH2For } from "./pdp-variants";
import { buildShelfClassificationGuideCS } from "./shelf-classification.examples.cs";
import { inferProductIntentSlug, isApplianceFeedCue, isMedicalMisbucketSlug } from "./product-intent.cs";
import { ALLOWED_SHELF_SLUGS } from "./catalog-shelf";
import {
  cleanFeedTitleWithDescriptor,
  splitBrandAndTail,
  stripAffiliateSkuTokens,
  extractLockedLatinBrand,
} from "./brand-clean";
import { inferProductRoleCs, buildProductRoleGuideCS } from "./product-role.cs";
import { problemRoleForShelf, isBroadPartnerBucket, isSpecificMedicalSlug } from "./problem-vocabulary.cs";
import { buildShelfTopicGuideBG } from "./shelf-topic.cs";
import { buildProductIntentGuideCS } from "./product-intent.cs";
import { buildFeedTitleCleanGuideCS, feedTitleToolExample, FEED_TITLE_FEW_SHOTS } from "./feed-title-clean.cs";
import {
  buildApplianceHtmlExampleBlock,
  buildContentFocusExamplesBlock,
  buildDescriptorStyleGuideCS,
  buildDisplayTitleExamplesBlock,
  COMPOSITION_THIN_FEED_GUIDE,
  buildFaqExampleBlock,
  buildFaqExampleBlockForFocus,
  buildFormFewShotsBlock,
  buildOralFormHtmlExampleBlock,
  buildShortFieldsExampleBlock,
  buildSupplementHtmlExampleBlock,
  buildWeightDropsFaqExampleBlock,
  isWeightDropsBrief,
  isJointSprayBrief,
  isJointTopicalBrief,
  isFungusCreamBrief,
  isFungusOralBrief,
  isNeuropathyBrief,
  isPapillomaGelBrief,
  isValgusSprayBrief,
  isDiabetesIntentBrief,
  resolveFormExemplarLane,
  buildJointHondroFamilyBlockBG,
  buildJointSprayFaqExampleBlock,
  buildFungusCreamFaqExampleBlock,
  buildPapillomaGelFaqExampleBlock,
  buildValgusSprayFaqExampleBlock,
  buildDiabetesOnDigestiveFaqExampleBlock,
  matchesAntiparasiticTitleHint,
  buildShelfGoldenBlockBG,
  buildShelfGoldenFaqBlockBG,
  pickGoldenBundle,
} from "./ai-content.examples.cs";
import {
  buildSeoIntentPromptBlock,
  buildFaqPaaHintBlock,
  pickH2Variant,
} from "./seo-intent.cs";
import { buildNutraLaneArchetypesBlock } from "./nutra-lane-archetypes.cs";

export type PromptNicheMode = "supplement" | "appliance";

const CYRILLIC_SNIPPET_RE = /[\u0400-\u04FF]/;

export type ProductCopyBrief = {
  cleanBrand: string;
  productLabel: string;
  productRole: string;
  shelfContext: string;
  categorySlug: string;
  /** @deprecated use shelfContext */
  categoryRole: string;
  formLabel: string;
  formKind: string;
  feedSnippet: string;
  displayH1: string;
  rawTitle: string;
  feedHasCyrillic: boolean;
  feedIsThin: boolean;
  feedCleaned?: string;
  /** Soft-routing lane for form few-shots (role beats noisy formKind). */
  formExemplarLane?: string;
  imagePartnerOnly?: boolean;
};

export type ItPromptSource = {
  title: string;
  categorySlug: string;
  facts: ProductFacts;
  displayTitle?: string;
  feedCleaned?: string;
  copyBrief?: ProductCopyBrief;
};

export const CZ_CITY_POOL = [
  "Praha",
  "Brno",
  "Ostrava",
  "Plzeň",
  "Liberec",
  "Olomouc",
  "České Budějovice",
  "Hradec Králové",
  "Pardubice",
  "Ústí nad Labem",
  "Zlín",
  "Kladno",
];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickCzechCities(seed: number, count = 6): string[] {
  const pool = CZ_CITY_POOL.slice();
  const rnd = mulberry32(seed || 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

const TOPICAL_KINDS = new Set([
  "cream", "gel", "balm", "ointment", "spray", "serum", "shampoo", "patch", "cosmetic", "eye_care",
]);

export type ContentFocus = {
  pageSlug: string;
  focusSlug: string;
  mismatch: boolean;
  descriptor: CategoryDescriptor;
  pageDescriptor: CategoryDescriptor;
};

/** FAQ/category vocabulary follows feed role when it diverges from page SEO slug. */
export function resolveContentFocus(brief: ProductCopyBrief): ContentFocus {
  const pageSlug = brief.categorySlug;
  const pageDescriptor = getCategoryDescriptor(pageSlug)!;
  const feed = brief.feedCleaned?.trim() || undefined;
  const inferredFromTitle = inferProductIntentSlug(brief.rawTitle, brief.cleanBrand, feed);
  const inferredFromRole =
    !inferredFromTitle && brief.productRole
      ? inferProductIntentSlug(brief.productRole, brief.cleanBrand, feed)
      : null;
  const inferredFromH1 =
    !inferredFromTitle && !inferredFromRole && brief.displayH1
      ? inferProductIntentSlug(brief.displayH1, brief.cleanBrand, feed)
      : null;
  const inferredFromfeed =
    !inferredFromTitle && !inferredFromRole && !inferredFromH1 && feed
      ? inferProductIntentSlug("", brief.cleanBrand, feed)
      : null;
  const inferred = inferredFromTitle ?? inferredFromRole ?? inferredFromH1 ?? inferredFromfeed;

  let focusSlug = pageSlug;
  let mismatch = false;
  if (inferred && inferred !== pageSlug) {
    if (isSpecificMedicalSlug(pageSlug) && isBroadPartnerBucket(inferred)) {
      focusSlug = pageSlug;
      mismatch = false;
    } else {
      focusSlug = inferred;
      mismatch = true;
    }
  }

  const descriptor = getCategoryDescriptor(focusSlug)!;

  return { pageSlug, focusSlug, mismatch, descriptor, pageDescriptor };
}

const MISMATCH_AVOID_BY_PAGE: Partial<Record<string, string[]>> = {
  papilomy: ["bradavice", "kožní výrůstky", "kůže", "HPV"],
  "jatra": ["játra", "detoxikace jater", "Reishi (houba)", "čištění jater", "regenerace jater"],
  "detox": ["detox", "toxiny", "očista", "detoxikační program"],
  "domaci-potreby": ["úklid domácnosti", "povrchy", "čisticí stroj", "domácnost"],
  traveni: ["trávení", "trávicí trakt", "zažívání", "gastrointestinální", "žaludek a střeva"],
  "anti-aging": ["anti-aging", "omlazení", "vrásky", "péče proti stárnutí", "stárnutí pleti"],
  cystitida: ["zánět močového měchýře", "pálení při močení", "močové cesty", "časté močení"],
  "stres": ["nervový systém", "stres", "úzkost", "paměť", "koncentrace"],
  "dychaci-cesty": ["plíce", "dýchací cesty", "dýchání", "průdušky"],
  "hubnuti": ["hmotnost", "chuť k jídlu", "metabolismus", "hubnutí", "spalování tuků", "kontrola hmotnosti"],
};

const ORGAN_PAIN_ROLE_RE =
  /hemoroid|hemorolok|proctonic|rectosave|proctowell|protiglivi|proti\s+glivic|\bnoktal\b|glivic.*noht|antifung|\bnefro\b|kidney|ledvic|renal|pljuč|pljučnik|\blung(?:e|en)?\b|respir|dihal|deep\s*inhale|zfimuno|imunsk|immun|imunitet|gewicht|abiau|odchud|weight\s*loss|appetit|schlank|stoffwechsel|huj[šs]an|kajenj|smoking|alkohol|alcohol|rauch|sluh|hearing|слух|ух[оа]|tinnit|papillom|borodav|hpv|papilom|neuropat|neuropathy|neuropatie|spomin|memory|cognitive|memorie|концентра/i;

function buildPainFirstVocabularyGuideCS(brief: ProductCopyBrief): string {
  const lexiconGuide = buildShelfTopicGuideBG(brief.categorySlug, {
    formLabel: brief.formLabel,
    brand: brief.cleanBrand,
  });
  if (lexiconGuide) return lexiconGuide;

  const haystack = `${brief.productRole} ${brief.displayH1} ${brief.rawTitle} ${brief.feedCleaned ?? ""}`.toLowerCase();
  if (!ORGAN_PAIN_ROLE_RE.test(haystack)) return "";

  if (/hemoroid|hemorolok|proctonic|rectosave|proctowell/i.test(haystack)) {
    const topical = /creme|cream|krem|gel|topic|extern/i.test(haystack);
    return `=== ZÁKAZNICKÉ TÉMA (hemoroidy z feedu) ===
Piš jazykem vyhledávání: hemoroidy, kapsle proti hemoroidům.
${topical ? "Místní forma: krém/gel na hemoroidy, aplikace zvenčí." : "Ústní forma: kapsle proti hemoroidům."}`;
  }

  if (/kajenj|smoking|rauch|nicotin|kuren|raucher/i.test(haystack)) {
    return `=== SLOVNÍK PROBLÉMU (odvykání kouření, ne dýchací cesty) ===
Piš o odvykání kouření u feedu «${brief.productRole}», ne o plicích nebo dýchacích cestách.
DOBŘE: odvykání kouření, závislost na nikotinu, detoxikace, kapsle pro odvykání kouření
ŠPATNĚ: plíce, dýchací cesty, dýchání, průdušky, snazší dýchání (i když je partner bucket «dýchací cesty»)`;
  }

  if (/alkohol|alcohol|alkoholizm/i.test(haystack)) {
    return `=== SLOVNÍK PROBLÉMU (závislost na alkoholu, ne dýchací cesty) ===
Piš o závislosti na alkoholu u feedu «${brief.productRole}», ne o plicích nebo dýchacích cestách.
DOBŘE: závislost na alkoholu, detoxikace, kapsle pro snížení konzumace alkoholu
ŠPATNĚ: plíce, dýchací cesty, dýchání, průdušky, snazší dýchání (i když je partner bucket «dýchací cesty»)`;
  }

  if (/papillom|borodav|hpv|condilom|warz|verruga|папилл|папіл|papilom/i.test(haystack)) {
    return `=== SLOVNÍK PROBLÉMU (papilomy/bradavice, ne dýchací cesty) ===
Piš o papilomech, bradavicích a podpoře při HPV u feedu «${brief.productRole}», ne o plicích nebo dýchacích cestách.
DOBŘE: papilom, bradavice, HPV, kožní výrůstky, podpůrné kapsle
ŠPATNĚ: plíce, dýchací cesty, dýchání, průdušky (i když je partner bucket «dýchací cesty»)`;
  }

  if (/gewicht|abiau|odchud|weight\s*loss|shuj[šs]|huj[šs]an|schlank/i.test(haystack)) {
    return `=== SLOVNÍK PROBLÉMU (kontrola hmotnosti, ne dýchací cesty) ===
Piš o kontrole hmotnosti a hubnutí u feedu «${brief.productRole}», ne o plicích nebo dýchacích cestách.
DOBŘE: kontrola hmotnosti, hubnutí, chuť k jídlu, metabolismus, kapsle na kontrolu hmotnosti
ŠPATNĚ: plíce, dýchací cesty, dýchání, průdušky (i když je partner bucket «dýchací cesty»)`;
  }

  if (/sluh|hearing|слух|ух[оа]|tinnit|auz|larinorm/i.test(haystack)) {
    return `=== SLOVNÍK PROBLÉMU (sluch, ne dýchací cesty) ===
Piš o sluchu a citlivosti uší u feedu «${brief.productRole}», ne o plicích nebo dýchacích cestách.
DOBŘE: sluch, ucho, schopnost slyšet, komfort uší, podpora při tinnitu
ŠPATNĚ: plíce, dýchací cesty, dýchání, průdušky (i když je partner bucket «dýchací cesty»)`;
  }

  if (/protiglivi|glivic|noktal|antifung/i.test(haystack)) {
    const oralAntifung =
      isFungusOralBrief(brief) ||
      /kapsul|capsule|tablet|comprimat/i.test(haystack) ||
      ["capsules", "tablets"].includes(brief.formKind);
    if (oralAntifung) {
      return `=== SLOVNÍK PROBLÉMU (plíseň užívaná ústně, ne místní krém) ===
Piš o plísni nehtů a ústním užívání u feedu «${brief.productRole}», ne o krému nebo místním spreji.
DOBŘE: plíseň nehtů, kapsle proti plísni nehtů, ústní užívání s vodou
ŠPATNĚ: krém proti plísni, místní sprej, nanášení na nehet, gel na nehet`;
    }
    return `=== SLOVNÍK PROBLÉMU (plíseň, ne anti-aging) ===
Piš o plísni nehtů/kůže a místní aplikaci, ne o omlazení nebo vráskách.
DOBŘE: plíseň, plíseň nehtů, nanášení gelu, péče proti plísni
ŠPATNĚ: anti-aging, omlazení, péče proti stárnutí, vrásky`;
  }

  if (/nefro|kidney|ledvic|renal/i.test(haystack)) {
    return `=== SLOVNÍK PROBLÉMU (ledviny, ne zánět močového měchýře) ===
Piš o ledvinách a močových cestách u feedu «${brief.productRole}», ne o akutním zánětu močového měchýře.
DOBŘE: ledviny, močové cesty, komfort močových cest, podpora ledvin
ŠPATNĚ: zánět močového měchýře, pálení při močení (jiná nemoc)`;
  }

  if (/pljuč|pljučnik|\blung(?:e|en)?\b|respir|dihal|deep\s*inhale/i.test(haystack)) {
    return `=== SLOVNÍK PROBLÉMU (dýchací cesty, ne nervový systém) ===
Piš o plicích a dýchání z feedu, ne o stresu nebo tématu nervového systému.
DOBŘE: plíce, dýchací cesty, snazší dýchání, bylinný čaj na dýchací cesty
ŠPATNĚ: nervový systém, stres, úzkost, paměť, koncentrace`;
  }

  if (/zfimuno|imunsk|immun|imunitet/i.test(haystack)) {
    return `=== SLOVNÍK PROBLÉMU (imunitní systém, ne nervový systém) ===
Piš o imunitním systému, obranyschopnosti a vitaminech z feedu, ne o paměti nebo stresu.
DOBŘE: imunitní systém, obranyschopnost, únava, zinek, vitamin C/D
ŠPATNĚ: nervový systém, paměť, koncentrace, stres, úzkost`;
  }

  if (/neuropat|neuropathy|neuropatie|нейропат/i.test(haystack)) {
    return `=== SLOVNÍK PROBLÉMU (neuropatie, ne anti-stres) ===
Piš o neuropatii a nepohodlí periferních nervů u feedu «${brief.productRole}», ne o obecném stresu nebo úzkosti.
DOBŘE: neuropatie, periferní nervy, brnění, nervové nepohodlí, kapsle na neuropatii
ŠPATNĚ: doplněk proti stresu, úzkost, vnitřní klid, snižování stresu (jen kvůli bucketu nervous-system)`;
  }

  if (/spomin|memory|cognitive|memorie|концентра|memorsh/i.test(haystack)) {
    return `=== SLOVNÍK PROBLÉMU (paměť, ne anti-stres) ===
Piš o paměti a koncentraci u feedu «${brief.productRole}», ne o obecném stresu nebo úzkosti.
DOBŘE: paměť, koncentrace, mentální jasnost, kapsle na paměť a koncentraci
ŠPATNĚ: doplněk proti stresu, úzkost, vnitřní klid, snižování stresu (jen kvůli bucketu nervous-system)`;
  }

  if (
    /aug(?:en)?|eye|vision|seh|ocular|зрен|глаз|oko|lutein|sehverm/i.test(haystack) &&
    !/gewicht|abiau|odchud|weight\s*loss|fat\s*burn|schlank|huj[šs]an/i.test(haystack)
  ) {
    return `=== SLOVNÍK PROBLÉMU (oči, ne hmotnost) ===
Piš o zdraví očí a zraku u feedu «${brief.productRole}», ne o hubnutí nebo metabolismu.
DOBŘE: zdraví očí, zrak, lutein, únava z obrazovky, ústní kapsle na oči
ŠPATNĚ: kontrola hmotnosti, chuť k jídlu, metabolismus, hubnutí, spalování tuků (i když je kategorie stránky «weight-management»)`;
  }

  if (/gewicht|abiau|odchud|weight\s*loss|appetit|schlank|stoffwechsel|huj[šs]an/i.test(haystack)) {
    return `=== SLOVNÍK PROBLÉMU (hmotnost, ne dýchací cesty) ===
Piš o hmotnosti, chuti k jídlu a metabolismu u feedu «${brief.productRole}», ne o plicích nebo dýchacích cestách.
DOBŘE: hmotnost, chuť k jídlu, metabolismus, kapsle na kontrolu hmotnosti
ŠPATNĚ: plíce, dýchací cesty, dýchání, průdušky, snazší dýchání`;
  }

  return "";
}

function buildMismatchAvoidBlockBG(focus: ContentFocus, productRole?: string): string {
  if (!focus.mismatch) return "";
  const fromPage = [
    ...(focus.pageDescriptor.mustMention ?? []),
    ...(focus.pageDescriptor.primaryKeywords ?? []),
    focus.pageDescriptor.problem,
    focus.pageDescriptor.short,
    ...(MISMATCH_AVOID_BY_PAGE[focus.pageSlug] ?? []),
  ]
    .filter(Boolean)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
  const unique = [...new Set(fromPage)];
  if (!unique.length) return "";
  return `SEO SLOVNÍK KATEGORIE «${focus.pageSlug}» — NEPOUŽÍVEJ (ani v záporu «nezaměňuj s …»):
${unique.join(", ")}
Piš výhradně o roli «${productRole ?? focus.descriptor.problem}».`;
}

function isTopicalFormKind(formKind?: string): boolean {
  return formKind ? TOPICAL_KINDS.has(formKind) : false;
}

function buildFormRegimeExampleBG(formKind: string, formLabel: string, brief?: ProductCopyBrief): string {
  if (isTopicalFormKind(formKind)) {
    return `h2 «Použití» → ${formLabel || "Gel/krém"} nanášet 2–3× denně, vetřít až do vstřebání`;
  }
  if (brief && isWeightDropsBrief(brief)) {
    return "h2 «Užívání» → kapky ve vodě, 10–15 kapek 1–2× denně před jídlem";
  }
  if (formKind === "unknown" || !formKind) {
    return "h2 «Užívání» → zvol formu z feedu/landingu (kapky, kapsle nebo čaj); nemíchej schéma";
  }
  if (formKind === "drops") {
    return "h2 «Užívání» → kapky ve vodě 1–2× denně × 30 dní";
  }
  if (formKind === "tea") {
    return "h2 «Použití» → spařený šálek 1–2× denně × 30 dní";
  }
  return `h2 «Užívání» → ${formLabel || "produkt"} 1–2× denně × 30 dní`;
}

function buildFormFactologyBG(formKind: string, formLabel: string): string {
  if (isTopicalFormKind(formKind)) {
    return `- Konkrétně: frekvence aplikace, délka cyklu, oblast nanášení.
- schéma: ${formLabel || "Gel/krém"} nanášet 2–3× denně, vetřít; cyklus 2–4 týdny (ne «kapsle/den»).`;
  }
  return `- Konkrétně: délka cyklu, frekvence, forma produktu «${formLabel || "z briefu"}».
- schéma: typická denní dávka pro formu z briefu, cyklus ~30 dní (nemíchej čaj, kapky a kapsle).`;
}

export function buildContentFocusGuideBG(brief: ProductCopyBrief): string {
  const focus = resolveContentFocus(brief);
  const mismatchAvoid = buildMismatchAvoidBlockBG(focus, brief.productRole);
  const painFirst = buildPainFirstVocabularyGuideCS(brief);
  const mismatchNote = focus.mismatch
    ? `\nU tohoto produktu: role «${brief.productRole}» ≠ SEO kategorie «${focus.pageSlug}» (${focus.pageDescriptor.short}).
Piš o roli z feedu; v FAQ a úvodu NEPŘEBÍREJ téma kategorie stránky.
${mismatchAvoid ? `\n${mismatchAvoid}` : ""}`
    : isSpecificMedicalSlug(focus.pageSlug) && focus.focusSlug === focus.pageSlug
      ? `\nURL klastr «${focus.pageSlug}» (${focus.pageDescriptor.short}) = odkud návštěvník přišel z katalogu.
Konkrétní role produktu vychází z polí feed description a landing URL — ne automaticky z partner bucketu.
Pokud feed popisuje jiný problém než URL klastr, piš o problému z feedu (viz příklady níže).
Pokud se role «${brief.productRole}» a kategorie stránky shodují — použij v textu obojí.`
      : painFirst
        ? `\nPolice «${focus.pageSlug}» je správná, ale piš jazykem nemoci z feedu — ne obecnými popisnými eufemismy.`
        : `\nRole «${brief.productRole}» a SEO kategorie «${focus.pageSlug}» se shodují — zachovej v textu obojí.`;

  return `=== ZAMĚŘENÍ OBSAHU (role z feedu > SEO kategorie) ===
role produktu (z názvu ve feedu): «${brief.productRole}»
SEO kategorie stránky (URL/drobečky): «${focus.pageSlug}» — ${focus.pageDescriptor.short}
${mismatchNote}
${painFirst ? `\n${painFirst}` : ""}

Příklady (piš DOBŘE, ne ŠPATNĚ):
${buildContentFocusExamplesBlock()}`;
}

export function buildNutraLaneAwarenessBG(brief: ProductCopyBrief): string {
  const haystack = `${brief.rawTitle} ${brief.productRole} ${brief.feedCleaned ?? ""} ${brief.feedSnippet}`;
  const examples = buildNutraLaneArchetypesBlock(brief.categorySlug, haystack, 5);
  if (!examples) return "";

  return `=== ROLE PRODUKTU (feed > partner bucket) ===
Bucket CPA TL / Shakes (např. «Nutra: vysoký krevní tlak») = reklamní kanál, NE role produktu.
Čti pole feed description a landing URL — tam je, co zákazník kupuje.

Příklady (DOBŘE → ŠPATNĚ):
${examples}

Pravidlo: pokud description mluví o potenci, ale bucket je vysoký krevní tlak → piš o potenci.`;
}

const ORAL_FORM_KINDS = new Set([
  "capsules", "tablets", "drops", "tea", "syrup", "powder", "sachet", "ampoules",
]);

function isOralFormKind(formKind: string): boolean {
  return ORAL_FORM_KINDS.has(formKind);
}

function formClassFromText(text: string): "oral" | "topical" | "tea" | null {
  const lc = text.toLowerCase();
  if (/\bgel\b|gelenkgel|creme|salbe|spray|topic|extern|solu[țt]ie\s*antifung/i.test(lc)) return "topical";
  if (/\btee\b|plante|aufguss/i.test(lc)) return "tea";
  if (/\bkapseln\b|tabletten|picură|kapsel\b/i.test(lc)) return "oral";
  return null;
}

function formClassFromBrief(brief: ProductCopyBrief): "oral" | "topical" | "tea" | null {
  if (isTopicalFormKind(brief.formKind)) return "topical";
  if (brief.formKind === "tea") return "tea";
  if (isOralFormKind(brief.formKind)) return "oral";
  return null;
}

function buildFormConsistencyGuideBG(brief: ProductCopyBrief): string {
  const lane = brief.formExemplarLane ?? resolveFormExemplarLane({
    categorySlug: brief.categorySlug,
    formKind: brief.formKind,
    cleanBrand: brief.cleanBrand,
    rawTitle: brief.rawTitle,
    displayH1: brief.displayH1,
    productRole: brief.productRole,
    feedCleaned: brief.feedCleaned,
  });
  if (lane === "gel_joint" || lane === "gel_joint_hondro_bare") {
    const role = inferProductRoleCs(brief.rawTitle, brief.cleanBrand, brief.feedCleaned) || brief.productRole || "kloubní gel";
    return `=== POZNÁMKA K FORMĚ (kloubní gel) ===
U tohoto produktu: role «${role}» → h2 «Použití», nanášení a vtírání gelu — ne «užívání» nebo kapsle s vodou.`;
  }
  if (lane === "neuropathy_oral" || isNeuropathyBrief(brief)) {
    const role = inferProductRoleCs(brief.rawTitle, brief.cleanBrand, brief.feedCleaned) || brief.productRole || "kapsle na neuropatii";
    return `=== POZNÁMKA K FORMĚ (kapsle na neuropatii) ===
U tohoto produktu: role «${role}» → h2 «Užívání», kapsle s vodou — ne «doplněk na nervový systém» nebo obecný anti-stres.`;
  }
  if (lane === "capsules_fungus" || isFungusOralBrief(brief)) {
    const role = inferProductRoleCs(brief.rawTitle, brief.cleanBrand, brief.feedCleaned) || brief.productRole || "kapsle proti plísni nehtů";
    return `=== POZNÁMKA K FORMĚ (ústní kapsle proti plísni) ===
U tohoto produktu: role «${role}» → h2 «Užívání», kapsle s vodou — ne «Použití» na nehet nebo místní krém.`;
  }

  const inferred = inferProductRoleCs(brief.rawTitle, brief.cleanBrand, brief.feedCleaned) || brief.productRole;
  const roleClass = formClassFromText(inferred);
  const h1Class = formClassFromText(brief.displayH1);
  const briefClass = formClassFromBrief(brief);
  const effectiveClass = h1Class ?? briefClass;
  if (!roleClass || !effectiveClass || roleClass === effectiveClass) return "";

  const targetH1 = `${brief.cleanBrand} — ${inferred}`;
  const topical = roleClass === "topical";
  return `=== KONZISTENCE FORMY (H1 a description_html mají stejnou formu) ===
Cílové H1 (z role ve feedu): «${targetH1}»
H1 stránky (automatické): «${brief.displayH1}» — forma odporuje roli produktu.

DOBŘE: ${topical ? "h2 «Použití», nanášení a vtírání gelu/krému" : "h2 «Užívání», kapsle/tableta s vodou"}
ŠPATNĚ: ${topical ? "«kloubní gel» v textu + FAQ «polkne kapsli»" : "«kapsle» v H1 + «naneste gel» v textu"}

Piš description_html, FAQ a krátká pole konzistentně ve formě cílového H1 — nepřebírej odporující H1 stránky.`;
}

/** When SEO category stereotype conflicts with form/role from brief. */
export function buildFormVsCategoryGuideBG(brief: ProductCopyBrief): string {
  const applianceHaystack = `${brief.rawTitle} ${brief.productRole} ${brief.displayH1} ${brief.feedCleaned ?? ""}`;
  if (isApplianceFeedCue(applianceHaystack) && isMedicalMisbucketSlug(brief.categorySlug)) {
    const inferred =
      inferProductIntentSlug(brief.rawTitle, brief.cleanBrand, brief.feedCleaned) ?? "autodoplnky";
    return `=== ROLE Z FEEDU (doplněk/gadget, ne zdravotní stereotyp) ===
Kategorie «${brief.categorySlug}» je špatný partner bucket — feed popisuje produkt pro domácnost/auto/elektroniku, ne zdravotní doplněk.
Piš o skutečném použití z feedu, ne o sluchu, kloubech, plicích nebo jiných nemocech z bucketu.

DOBŘE (čistič auta): «Suchý čistič auta — doplněk pro čištění interiéru auta»
  → h2 «Účel a forma produktu», použití na sedadle/v interiéru
ŠPATNĚ: «Produkt na sluch», «kapsle na sluch», doplněk stravy, ústní užívání
  (nekopíruj stereotyp kategorie «${brief.categorySlug}» — správná police: «${inferred}»)`;
  }

  const inferred =
    inferProductIntentSlug(brief.rawTitle, brief.cleanBrand) ??
    inferProductIntentSlug(brief.productRole, brief.cleanBrand) ??
    inferProductIntentSlug(brief.displayH1, brief.cleanBrand);

  if (isTopicalFormKind(brief.formKind) && brief.categorySlug === "anti-aging" && inferred === "plisen-nehtu") {
    return `=== FORMA Z BRIEFU (gel proti plísni, ne anti-aging) ===
Kategorie «anti-aging» znamená omlazení, ale produkt «${brief.formLabel || "gel"}» je proti plísni.

DOBŘE (gel + plíseň): «${brief.cleanBrand} — gel proti plísni na nehty»
  → h2 «Použití», nanášení na nehet/kůži 2–3× denně
ŠPATNĚ: péče proti stárnutí, vrásky, anti-aging program, kapsle`;
  }

  if (isJointSprayBrief(brief)) {
    return `=== FORMA Z BRIEFU (kloubní sprej, ne ústní doplněk) ===
Kategorie «joint-care» se často zaměňuje s ústními kapslemi, ale Hondro Sol/Spray ve feedu = sprej pro vnější použití.

DOBŘE (sprej + klouby): «${brief.cleanBrand} — kloubní sprej»
  → h2 «Použití», sprej na klouby, 2–3× denně
ŠPATNĚ: doplněk stravy, polykání kapsle, «60 kapslí», ústní kúra s vodou`;
  }

  if (isJointTopicalBrief(brief)) {
    return `=== FORMA Z BRIEFU (kloubní gel, ne ústní doplněk) ===
Kategorie «joint-care» se často zaměňuje s ústními kapslemi, ale Hondrofrost/Hondroine/Fortuflex nebo «gel za sklepe» ve feedu = kloubní gel pro vnější použití.

DOBŘE (gel + klouby): «${brief.cleanBrand} — kloubní gel»
  → h2 «Použití», nanášení a vtírání gelu na koleno/záda/ruce
ŠPATNĚ: polykání kapsle, «60 kapslí», ústní kúra s vodou — jen kvůli bucketu joint-care nebo značce`;
  }

  if (isFungusCreamBrief(brief)) {
    return `=== FORMA Z BRIEFU (krém proti plísni nehtů, ne kapsle) ===
Kategorie «fungus» se často zaměňuje s ústními kapslemi, ale Promicil/krém/gel ve feedu = místní nanášení na nehet.

DOBŘE (krém + plíseň nehtů): «${brief.cleanBrand} — krém proti plísni nehtů»
  → h2 «Použití», krém na nehet a okolí
ŠPATNĚ: polykání kapsle, «60 kapslí», ústní užívání místo místního`;
  }

  if (isFungusOralBrief(brief)) {
    return `=== FORMA Z BRIEFU (ústní kapsle proti plísni, ne místní krém) ===
Kategorie «fungus» se často zaměňuje s místním krémem/gelem, ale pokud je forma z briefu «${brief.formLabel || "kapsle"}» — piš o ústním užívání.

DOBŘE (kapsle + plíseň nehtů): «${brief.cleanBrand} — kapsle proti plísni nehtů»
  → h2 «Užívání», kapsle s vodou, cyklus ~30 dní
ŠPATNĚ: krém proti plísni, místní sprej, nanášení na nehet, gel na nehet`;
  }

  if (isNeuropathyBrief(brief)) {
    return `=== FORMA Z BRIEFU (kapsle na neuropatii, ne obecný nervový systém) ===
Kategorie «nervous-system» obsahuje různé SKU — feed/landing neuropat/neurosh = neuropatie, ne anti-stres.

DOBŘE (kapsle + neuropatie): «${brief.cleanBrand} — kapsle na neuropatii»
  → h2 «Užívání», nepohodlí periferních nervů, brnění, kapsle s vodou
ŠPATNĚ: doplněk na nervový systém, doplněk proti stresu, paměť a koncentrace`;
  }

  if (isPapillomaGelBrief(brief)) {
    return `=== FORMA Z BRIEFU (gel proti papilomům, ne kapsle) ===
Kategorie «papillomas» se často zaměňuje s ústními kapslemi, ale Removio/gel ve feedu = místní nanášení na bradavici.

DOBŘE (gel + papilom): «${brief.cleanBrand} — gel proti papilomům»
  → h2 «Použití», gel přímo na bradavici
ŠPATNĚ: polykání kapsle, «60 kapslí», ústní kúra s vodou`;
  }

  if (isValgusSprayBrief(brief) || (brief.formKind === "spray" && (brief.categorySlug === "vboceny-palec" || inferred === "vboceny-palec"))) {
    return `=== FORMA Z BRIEFU (sprej na vbočený palec, ne korektor nebo kloubní produkt) ===
Kategorie «valgus» často znamená ortopedickou pomůcku, ale pokud je forma z briefu «Sprej» — piš o nanášení spreje na nohu.

DOBŘE (sprej + vbočený palec): «${brief.cleanBrand} — sprej na vbočený palec»
  → h2 «Použití», sprej dle návodu na oblast chodidla/palce
ŠPATNĚ: silikonová spona, korektor, nošení pomůcky, kloubní produkt, polykání kapsle`;
  }

  const teaLike =
    brief.formKind === "tea" ||
    (brief.formKind === "unknown" && /čaj/i.test(brief.productRole));
  if (teaLike && brief.categorySlug === "stres" && inferred === "dychaci-cesty") {
    return `=== FORMA Z BRIEFU (čaj na plíce, ne nervový systém) ===
Kategorie «nervous-system» znamená stres/paměť, ale produkt je bylinný čaj na plíce.

DOBŘE (čaj + plíce): «${brief.cleanBrand} — čaj na plíce a dýchací cesty»
  → h2 «Použití», spařený šálek 1–2× denně × 30 dní
ŠPATNĚ: nervový systém, stres, úzkost, paměť, koncentrace`;
  }

  const oral =
    isOralFormKind(brief.formKind) ||
    (brief.formKind === "unknown" && /kapsul|tablet|kapljic|čaj/i.test(brief.productRole));

  if (oral && brief.categorySlug === "zrak") {
    return `=== FORMA Z BRIEFU (ústní kapsle, ne vnější péče o oči) ===
Kategorie «vision-eye-care» se často zaměňuje s očními kapkami nebo vnější péčí, ale pokud je forma z briefu «${brief.formLabel || "kapsle"}» — piš o ústním užívání.

DOBŘE (kapsle + oči): «${brief.cleanBrand} — kapsle na oči»
  → h2 «Užívání», lutein/vitaminy, zapít vodou, cyklus ~30 dní
ŠPATNĚ: produkt na oči pro vnější použití, zlepšení zraku, oční kapky, brýle/čočky
  (jiná forma — nemíchej s kapslemi z briefu)`;
  }

  if (oral && brief.categorySlug === "prostata") {
    return `=== FORMA Z BRIEFU (ústní kapsle, ne místní krém) ===
Kategorie «prostate-health» se často zaměňuje s vnějším krémem nebo místní péčí, ale pokud je forma z briefu «${brief.formLabel || "kapsle"}» — piš o ústním užívání.

DOBŘE (kapsle + prostata): «${brief.cleanBrand} — kapsle na prostatu»
  → h2 «Užívání», Saw Palmetto/zinek, zapít vodou, cyklus ~30 dní
ŠPATNĚ: krém pro vnější použití, místní péče, intimní krém, vnější nanášení
  (jiná forma — nemíchej s kapslemi z briefu)`;
  }

  if (oral && brief.categorySlug === "anti-aging") {
    return `=== FORMA Z BRIEFU (ústní anti-aging doplněk, ne make-up) ===
Kategorie «anti-aging» se často zaměňuje s make-upem/kosmetikou, ale pokud je forma z briefu «${brief.formLabel || "kapsle"}» — piš o ústním užívání.

DOBŘE (kapsle + anti-aging): «${brief.cleanBrand} — ústní anti-aging doplněk stravy»
  → h2 «Užívání», kapsle s vodou, cyklus ~30 dní; vrásky, omlazení
ŠPATNĚ: make-up, krémový make-up, BB cushion, nanášení na obličej, líčení`;
  }

  if (oral && brief.categorySlug === "hemoroidy") {
    return `=== FORMA Z BRIEFU (ústní kapsle proti hemoroidům, ne místní krém) ===
Kategorie «hemorrhoids» se často zaměňuje s místním krémem/gelem, ale pokud je forma z briefu «${brief.formLabel || "kapsle"}» — piš o ústním užívání.

DOBŘE (kapsle + hemoroidy): «${brief.cleanBrand} — kapsle proti hemoroidům»
  → h2 «Užívání», kapsle s vodou, cyklus ~30 dní
ŠPATNĚ: krém proti hemoroidům, místní gel, vnější nanášení, místní vtírání`;
  }

  if (oral && brief.categorySlug === "traveni") {
    return `=== FORMA Z BRIEFU (doplněk na trávení, ne obecný wellness) ===
Kategorie «digestive» vyžaduje konkrétní slovník trávení — ne obecné wellness popisy.

DOBŘE (kapsle + trávení): «${brief.cleanBrand} — doplněk stravy na podporu trávení»
  → h2 «Užívání», trávení, trávicí komfort, žaludek a střeva
ŠPATNĚ: wellness produkt, obecná pohoda, celková pohoda, obecný wellness`;
  }

  const weightHaystack = `${brief.rawTitle} ${brief.productRole} ${brief.displayH1} ${brief.feedCleaned ?? ""} ${brief.cleanBrand}`;
  if (
    isWeightDropsBrief(brief) ||
    (brief.categorySlug === "hubnuti" &&
      (brief.formKind === "drops" ||
        brief.formKind === "unknown" ||
        /kapljic|picură|\bdrops\b|kapi\b/i.test(weightHaystack)))
  ) {
    return `=== FORMA Z BRIEFU (kapky na kontrolu hmotnosti, ne stereotyp kapslí) ===
Kategorie «weight-management» se často zaměňuje s ústními kapslemi, ale W-Loss/Abslim/kapljice ve feedu = kapky.

DOBŘE (kapky + hubnutí): «${brief.cleanBrand} — kapky na kontrolu hmotnosti»
  → h2 «Užívání», kapky do vody nebo na lžičku, pipeta, 1–2× denně
ŠPATNĚ: polykání kapsle, «60 kapslí», «dvakrát denně jedna kapsle», ignorování pipety
  (jiná forma — nemíchej s kapkami z briefu)`;
  }

  const parasiteHaystack = `${brief.rawTitle} ${brief.productRole} ${brief.displayH1} ${brief.feedCleaned ?? ""}`;
  if (oral && brief.categorySlug === "traveni" && matchesAntiparasiticTitleHint(parasiteHaystack)) {
    return `=== FORMA Z BRIEFU (ústní kapsle proti parazitům, ne doplněk na trávení) ===
Kategorie «digestive» často znamená trávicí trakt, ale pokud je název a role z feedu antiparazitární — piš o parazitech a očistě střev.

DOBŘE (kapsle + paraziti): «${brief.cleanBrand} — kapsle proti parazitům»
  → h2 «Užívání», pelyněk/černý ořech, zapít vodou, cyklus ~30 dní
ŠPATNĚ: doplněk na trávení, trávicí potíže jako hlavní téma, trávicí trakt, gastrointestinální`;
  }

  if (oral && brief.categorySlug === "traveni" && isDiabetesIntentBrief(brief)) {
    return `=== ZAMĚŘENÍ OBSAHU (krevní cukr/diabetes, ne trávicí trakt) ===
Kategorie «digestive» často znamená trávení, ale InsuLevel/Balansulin/krevní cukr ve feedu = podpora při diabetu.

DOBŘE (doplněk + krevní cukr): «${brief.cleanBrand} — doplněk stravy pro regulaci krevního cukru»
  → h2 «Užívání», glukóza/regulace cukru, zapít vodou, cyklus ~30 dní
ŠPATNĚ: doplněk na trávení, trávicí trakt, žaludek a střeva, gastrointestinální, střevní komfort`;
  }

  if (isTopicalFormKind(brief.formKind) && brief.categorySlug === "hemoroidy") {
    return `=== FORMA Z BRIEFU (místní krém/gel na hemoroidy) ===
Kategorie «hemorrhoids» se často zaměňuje s ústními kapslemi, ale pokud je forma z briefu «${brief.formLabel || "krém"}» — piš o vnějším nanášení.

DOBŘE (krém/gel + hemoroidy): «${brief.cleanBrand} — krém na hemoroidy»
  → h2 «Použití», tenká vrstva 2–3× denně`;
  }

  const topicalJoint =
    !isJointSprayBrief(brief) &&
    brief.categorySlug === "klouby" &&
    (isTopicalFormKind(brief.formKind) ||
      /gelenkgel|gelenkcreme|gel zur extern|externe anwendung|topic/i.test(
        `${brief.productRole} ${brief.displayH1} ${brief.formLabel}`,
      ));
  if (topicalJoint) {
    return `=== FORMA Z BRIEFU (místní gel/krém na klouby, ne ústní doplněk) ===
Kategorie «joint-care» se často zaměňuje s ústním doplňkem stravy, ale pokud je forma z briefu «${brief.formLabel || "gel"}» nebo kloubní gel — piš o vnějším nanášení.

DOBŘE (gel + klouby): «${brief.cleanBrand} — kloubní gel»
  → h2 «Použití», nanášení a vtírání gelu 2–3× denně
ŠPATNĚ: doplněk stravy, polykání kapsle, ústní kúra, «s vodou»`;
  }

  if (!oral) return "";

  const deviceStereotype =
    brief.categorySlug === "vboceny-palec" ||
    /ortoped|pripomoček|opornic|korektor.*stopal|silikon.*sponk/i.test(brief.shelfContext);
  if (!deviceStereotype) return "";

  return `=== FORMA Z BRIEFU (ne stereotyp kategorie) ===
Kategorie «${brief.categorySlug}» často znamená ortopedickou pomůcku, ale pokud je forma z briefu «${brief.formLabel || "kapsle"}» — piš o ústním užívání.

DOBŘE (kapsle + vbočený palec): «${brief.cleanBrand} — kapsle na podporu při vbočeném palci»
  → h2 «Užívání», složení, zapít vodou, cyklus ~30 dní
ŠPATNĚ: silikonová spona, zdravotnický silikon, nošení pomůcky na palci, ergonomická ortéza
  (jiná forma — nemíchej s kapslemi z briefu)`;
}

export function buildInventionPolicyBlockCS(
  mode: PromptNicheMode,
  feedHasContent: boolean,
  formLabel?: string,
): string {
  if (feedHasContent) {
    return mode === "appliance"
      ? `=== ZDROJ INFORMACÍ (bohatý feed) ===
Používej jen vlastnosti uvedené ve feedu. Nevymýšlej certifikace, watty ani materiály, které v textu nejsou.`
      : `=== ZDROJ INFORMACÍ (bohatý feed) ===
Používej jen složky a údaje uvedené ve feedu. Nevymýšlej klinické dávky, které feed nepotvrzuje.`;
  }
  if (mode === "appliance") {
    return `=== SLABÝ FEED — PŘÍKLADY ===
DOBŘE: «Přesné technické údaje nejsou uvedeny. U takových zařízení je běžné napájení USB nebo 220 V — zkontrolujte balení.»
ŠPATNĚ: «1500 W, certifikace CE» (vymyšlená čísla jako fakt)`;
  }
  const form = formLabel?.trim() || "produkt z briefu";
  return `=== SLABÝ FEED — PŘÍKLADY ===
DOBŘE: «Přesné složení není na produktovém listu uvedeno. U podobných ${form} bývá běžný rostlinný extrakt nebo vitamin — zkontrolujte etiketu při doručení.»
ŠPATNĚ: «Složka X 500 mg» (vymyšlená čísla jako fakt o tomto SKU)
Zvol jedinou formu z briefu («${form}») a udrž ji konzistentní v celém textu.`;
}

export function buildProductCopyBrief(input: {
  rawTitle: string;
  displayH1: string;
  categorySlug: string;
  facts: ProductFacts;
  feedCleaned: string;
  categoryRole?: string;
  productRole?: string;
}): ProductCopyBrief {
  const cleaned = cleanFeedTitleWithDescriptor(input.rawTitle) || input.rawTitle;
  const { brand } = splitBrandAndTail(cleaned);
  const cleanBrand =
    extractLockedLatinBrand(input.rawTitle) || stripAffiliateSkuTokens(brand) || brand.trim();
  const d = getCategoryDescriptor(input.categorySlug);
  const shelfContext = input.categoryRole ?? d?.long ?? d?.short ?? "";
  const dashParts = input.displayH1.split(/\s*[—–-]\s*/);
  const fromH1 = dashParts.length > 1 ? dashParts.slice(1).join(" ").trim() : "";
  const productRole =
    input.productRole?.trim() ||
    inferProductRoleCs(input.rawTitle, cleanBrand, input.feedCleaned) ||
    fromH1 ||
    problemRoleForShelf(input.categorySlug, input.facts.formLabelUk, input.facts.kind) ||
    shelfContext;
  const feedSnippet = stripAffiliateSkuTokens(input.feedCleaned.trim()).slice(0, 200);
  const formExemplarLane = resolveFormExemplarLane({
    categorySlug: input.categorySlug,
    formKind: input.facts.kind || "unknown",
    cleanBrand,
    rawTitle: cleaned,
    displayH1: input.displayH1.trim(),
    productRole,
    feedCleaned: input.feedCleaned,
  });
  return {
    cleanBrand,
    productLabel: productRole,
    productRole,
    shelfContext,
    categorySlug: input.categorySlug,
    categoryRole: shelfContext,
    formLabel: input.facts.formLabelUk || "",
    formKind: input.facts.kind || "unknown",
    feedSnippet,
    feedCleaned: input.feedCleaned,
    formExemplarLane,
    displayH1: input.displayH1.trim(),
    rawTitle: cleaned,
    feedHasCyrillic: CYRILLIC_SNIPPET_RE.test(feedSnippet),
    feedIsThin: feedSnippet.length < 40,
  };
}

export function buildShortFieldsGuideCS(brief: ProductCopyBrief, mode: PromptNicheMode): string {
  const roleHint =
    mode === "appliance"
      ? "Popiš skutečné použití (domácnost, kancelář, auto), ne obecné kategorie."
      : "Popiš formu produktu a konkrétní přínos, ne fráze typu «celková pohoda».";
  const inferredRole = inferProductRoleCs(brief.rawTitle, brief.cleanBrand, brief.feedCleaned);
  let targetH1Role =
    inferredRole ||
    brief.productRole ||
    problemRoleForShelf(brief.categorySlug, brief.formLabel, brief.formKind) ||
    brief.productLabel ||
    "konkrétní typ produktu";
  if (!inferredRole && brief.categorySlug === "hemoroidy" && brief.formLabel?.trim()) {
    targetH1Role = `${brief.formLabel.trim()} proti hemoroidům`;
  } else if (!inferredRole && brief.categorySlug === "chrapani" && brief.formLabel?.trim()) {
    targetH1Role = `${brief.formLabel.trim()} proti chrápání`;
  } else if (!inferredRole && brief.categorySlug === "hubnuti" && brief.formLabel?.trim()) {
    targetH1Role = `${brief.formLabel.trim()} na kontrolu hmotnosti`;
  } else if (!inferredRole && isWeightDropsBrief(brief)) {
    targetH1Role = "kapky na kontrolu hmotnosti";
  } else if (!inferredRole && isJointSprayBrief(brief)) {
    targetH1Role = "kloubní sprej";
  } else if (!inferredRole && isJointTopicalBrief(brief)) {
    targetH1Role = "kloubní gel";
  } else if (!inferredRole && isFungusCreamBrief(brief)) {
    targetH1Role = "krém proti plísni nehtů";
  } else if (!inferredRole && isFungusOralBrief(brief)) {
    targetH1Role = "kapsle proti plísni nehtů";
  } else if (!inferredRole && isNeuropathyBrief(brief)) {
    targetH1Role = "kapsle na neuropatii";
  } else if (!inferredRole && isPapillomaGelBrief(brief)) {
    targetH1Role = "gel proti papilomům";
  } else if (!inferredRole && isValgusSprayBrief(brief)) {
    targetH1Role = "sprej na vbočený palec";
  } else if (!inferredRole && isDiabetesIntentBrief(brief)) {
    targetH1Role = "doplněk stravy pro regulaci krevního cukru";
  } else if (!inferredRole && brief.categorySlug === "zrak" && brief.formLabel?.trim()) {
    targetH1Role = `${brief.formLabel.trim()} na oči`;
  } else if (!inferredRole && brief.categorySlug === "prostata" && brief.formLabel?.trim()) {
    targetH1Role = `${brief.formLabel.trim()} na prostatu`;
  }
  const targetH1 = `${brief.cleanBrand} — ${targetH1Role}`;
  const formConsistency = buildFormConsistencyGuideBG(brief);
  const feedTitleGuide = buildFeedTitleCleanGuideCS({
    cleanBrand: brief.cleanBrand,
    rawTitle: brief.rawTitle,
    productRole: brief.productRole,
  });
  const intimatecursz =
    brief.categorySlug === "hemoroidy" && brief.formLabel?.trim()
      ? `
=== KRÁTKÁ POLE — hemoroidy (jazyk vyhledávání) ===
- title: «${targetH1}»
- subtitle: podpora při hemoroidech / pohodlnější sezení
- meta_desc: «${brief.formLabel.trim()} na hemoroidy» (podle formy z briefu)`
      : "";
  const visioncursz =
    brief.categorySlug === "zrak" &&
    (isOralFormKind(brief.formKind) || brief.formKind === "unknown")
      ? `
=== KRÁTKÁ POLE — všechna tři pole (ústní kapsle na oči) ===
DOBŘE pro «${brief.cleanBrand}»:
- title: «${targetH1}»
- subtitle: ústní podpora zraku / únava z obrazovky
- meta_desc: doplněk v kapslích na podporu zdraví očí
ŠPATNĚ v jakémkoli poli: zlepšení zraku, oční kapky, vnější použití na oči`
      : "";
  const prostatecursz =
    brief.categorySlug === "prostata" &&
    (isOralFormKind(brief.formKind) || brief.formKind === "unknown")
      ? `
=== KRÁTKÁ POLE — všechna tři pole (ústní kapsle na prostatu) ===
DOBŘE pro «${brief.cleanBrand}»:
- title: «${targetH1}»
- subtitle: ústní podpora prostaty / noční močení
- meta_desc: doplněk v kapslích na podporu komfortu močových cest u mužů
ŠPATNĚ v jakémkoli poli: místní krém, vnější intimní péče`
      : "";
  const cystitiscursz =
    brief.categorySlug === "cystitida" &&
    (isOralFormKind(brief.formKind) || brief.formKind === "unknown")
      ? `
=== KRÁTKÁ POLE — všechna tři pole (ústní kapsle na zánět močového měchýře) ===
DOBŘE pro «${brief.cleanBrand}»:
- title: «${targetH1}»
- subtitle: podpora při zánětu močového měchýře / pálení při močení
- meta_desc: doplněk v kapslích při zánětu močového měchýře a nepohodlí močových cest
ŠPATNĚ v jakémkoli poli: celková pohoda, vitalita, imunitní systém, adaptogen`
      : "";
  const weightDropscursz =
    isWeightDropsBrief(brief)
      ? `
=== KRÁTKÁ POLE — všechna tři pole (kapky na kontrolu hmotnosti) ===
DOBŘE pro «${brief.cleanBrand}»:
- title: «${brief.cleanBrand} — kapky na kontrolu hmotnosti»
- subtitle: hubnutí / kontrola chuti k jídlu / podpora metabolismu
- meta_desc: kapky na kontrolu hmotnosti, užívané ve vodě podle produktového listu
ŠPATNĚ v jakémkoli poli: kapsle na kontrolu hmotnosti, «60 kapslí», «kapsle s vodou»`
      : "";
  const jointSpraycursz = isJointSprayBrief(brief)
    ? `
=== KRÁTKÁ POLE — všechna tři pole (kloubní sprej) ===
DOBŘE pro «${brief.cleanBrand}»:
- title: «${brief.cleanBrand} — kloubní sprej»
- subtitle: místní aplikace spreje pro kloubní komfort
- meta_desc: kloubní sprej pro vnější použití
ŠPATNĚ v jakémkoli poli: doplněk stravy, kapsle, «60 kapslí»`
    : "";
  const jointGelcursz = isJointTopicalBrief(brief)
    ? `
=== KRÁTKÁ POLE — všechna tři pole (kloubní gel) ===
DOBŘE pro «${brief.cleanBrand}»:
- title: «${brief.cleanBrand} — kloubní gel»
- subtitle: gel pro vnější použití pro kloubní komfort
- meta_desc: kloubní gel pro vnější nanášení na koleno, záda nebo ruce
ŠPATNĚ v jakémkoli poli: kloubní kapsle, «60 kapslí», ústní užívání s vodou`
    : "";
  const fungusCreamcursz = isFungusCreamBrief(brief)
    ? `
=== KRÁTKÁ POLE — všechna tři pole (krém proti plísni nehtů) ===
DOBŘE pro «${brief.cleanBrand}»:
- title: «${brief.cleanBrand} — krém proti plísni nehtů»
- subtitle: místní krém na nehet a okolí
- meta_desc: krém proti plísni nehtů, místní aplikace
ŠPATNĚ v jakémkoli poli: kapsle proti plísni nehtů, ústní užívání, «60 kapslí»`
    : "";
  const papillomaGelcursz = isPapillomaGelBrief(brief)
    ? `
=== KRÁTKÁ POLE — všechna tři pole (gel proti papilomům) ===
DOBŘE pro «${brief.cleanBrand}»:
- title: «${brief.cleanBrand} — gel proti papilomům»
- subtitle: nanášení gelu na bradavici/papilom
- meta_desc: gel proti papilomům, místní aplikace
ŠPATNĚ v jakémkoli poli: kapsle proti papilomům, «60 kapslí»`
    : "";
  const valgusSpraycursz = isValgusSprayBrief(brief)
    ? `
=== KRÁTKÁ POLE — všechna tři pole (sprej na vbočený palec) ===
DOBŘE pro «${brief.cleanBrand}»:
- title: «${brief.cleanBrand} — sprej na vbočený palec»
- subtitle: aplikace spreje na postiženou oblast chodidla/palce
- meta_desc: sprej na vbočený palec, místní aplikace
ŠPATNĚ v jakémkoli poli: kloubní produkt, kloubní komfort, kapsle`
    : "";
  const diabetescursz =
    brief.categorySlug === "traveni" && isDiabetesIntentBrief(brief)
      ? `
=== KRÁTKÁ POLE — všechna tři pole (krevní cukr, ne trávení) ===
DOBŘE pro «${brief.cleanBrand}»:
- title: «${brief.cleanBrand} — doplněk stravy pro regulaci krevního cukru»
- subtitle: podpora krevního cukru a glukózy
- meta_desc: doplněk pro regulaci krevního cukru, ústní užívání
ŠPATNĚ v jakémkoli poli: doplněk na trávení, žaludek a střeva, trávicí trakt`
      : "";
  const jointFormCursz =
    brief.categorySlug === "klouby" &&
    !isJointSprayBrief(brief) &&
    !isJointTopicalBrief(brief) &&
    (isOralFormKind(brief.formKind) || brief.formKind === "unknown")
      ? `
=== KRÁTKÁ POLE — forma podle feedu/landingu (joint-care) ===
DOBŘE pro «${brief.cleanBrand}»:
- title: «${brief.cleanBrand} — kloubní kapsle» (pokud feed kapsule/capsule)
- title: «${brief.cleanBrand} — kloubní gel» (pokud feed gel za sklepe)
- subtitle: podpora kloubní pohyblivosti / komfort při zátěži
ŠPATNĚ: kloubní gel jen kvůli značce (např. ArtiZynt) bez gelu ve feedu; míchání kapsle + gel ve stejném textu`
      : "";
  const hondroFamilyBlock = buildJointHondroFamilyBlockBG({
    cleanBrand: brief.cleanBrand,
    productRole: brief.productRole,
    categorySlug: brief.categorySlug,
  });
  const categoryContextRule = isApplianceFeedCue(
    `${brief.rawTitle} ${brief.productRole} ${brief.feedCleaned ?? ""}`,
  ) && isMedicalMisbucketSlug(brief.categorySlug)
    ? `kategorie katalogu «${brief.categorySlug}» je špatný partner bucket — popis z feedu (auto/gadget) má přednost; nepiš o «sluchu» ani jiné roli ze zdravotního bucketu.`
    : isSpecificMedicalSlug(brief.categorySlug)
    ? `kategorie katalogu «${brief.categorySlug}» = nákupní záměr návštěvníka (${brief.shelfContext}); piš jazykem této nemoci, i když značka ve feedu nemá popis.`
    : isBroadPartnerBucket(brief.categorySlug)
      ? `kategorie katalogu «${brief.categorySlug}» je partner bucket — role produktu z feedu/landingu má přednost před bucketem.`
      : `kategorie katalogu «${brief.categorySlug}» — ${brief.shelfContext}; text určuje forma a role z feedu.`;
  return `${feedTitleGuide}

${buildShortFieldsExampleBlock({
    categorySlug: brief.categorySlug,
    formKind: brief.formKind,
    cleanBrand: brief.cleanBrand,
    rawTitle: brief.rawTitle,
    displayH1: brief.displayH1,
    productRole: brief.productRole,
    feedCleaned: brief.feedCleaned,
  })}

=== KRÁTKÁ POLE PRO TENTO PRODUKT ===
Čistá značka: «${brief.cleanBrand}»
Komerční název z briefu se doslovně zkopíruje do polí title, subtitle, meta_desc, display_title a do těla (<strong>) — nezkracuj (např. «Smoke No More» ne «Smoke More»), nepřekládej, „neopravuj“.
Jedna pomlčka (—) v title/display_title: mezi značkou a popisem; v popisu jen mezery a předložky — ne «kapsle — na zánět močového měchýře» nebo «hmotnost — kontrola».
Cílové H1 (feed + forma): «${targetH1}»
H1 stránky (automatický návrh): «${brief.displayH1}»
role produktu (z feedu): ${brief.productRole || brief.productLabel}
${categoryContextRule}
forma: ${brief.formLabel || "—"}

Forma z briefu je rozhodující pro description_html — nepřebírej jinou formu ze šumu feedu.

${buildDescriptorStyleGuideCS({
  categorySlug: brief.categorySlug,
  formLabel: brief.formLabel,
  cleanBrand: brief.cleanBrand,
})}

${buildFormFewShotsBlock(brief.formKind, brief.categorySlug, `${brief.cleanBrand} ${brief.rawTitle}`, {
  cleanBrand: brief.cleanBrand,
  rawTitle: brief.rawTitle,
  displayH1: brief.displayH1,
  productRole: brief.productRole,
  feedCleaned: brief.feedCleaned,
})}

${formConsistency ? `${formConsistency}\n\n` : ""}${hondroFamilyBlock ? `${hondroFamilyBlock}\n\n` : ""}${intimatecursz}${visioncursz}${prostatecursz}${cystitiscursz}${weightDropscursz}${jointSpraycursz}${jointGelcursz}${fungusCreamcursz}${papillomaGelcursz}${valgusSpraycursz}${diabetescursz}${jointFormCursz}
DOBRÉ příklady pro tento produkt:
- title: «${targetH1}»
- subtitle: konkrétní přínos použití (bez značky, max. 80 znaků)
- meta_desc: věta se skutečným přínosem (bez značky, 120–155 znaků, krátká CTA)
- display_title: stejný popisný styl jako title (forma + problém)

Pravidlo: title, subtitle, meta_desc a display_title — jednotný popisný styl; ne eufemismus v jednom poli a konkrétní forma v jiném.

ŠPATNÉ příklady (nekopíruj):
- «Money Amulet — Fahrbrille» (název neoznačuje brýle)
- «ohřívač vody» místo pokojového / přenosného ohřívače
- «doplněk stravy» / «cyklus užívání» pro produkty, které nejsou doplňky
- «tautologický gel», «Cortitron — AT», «žvýkačka», když forma: kapsle
- popis bez «hemoroidy» na polici hemorrhoids — použij «kapsle proti hemoroidům»
- «produkt na sluch» u čističe auta / spotřebiče pro domácnost (špatný bucket sluch)

Pravidlo: role produktu vychází z názvu ve feedu («${brief.productRole}»); ${categoryContextRule}
${roleHint}

${buildDisplayTitleExamplesBlock()}`;
}

export function buildCatalogShelfGuideCS(brief: ProductCopyBrief): string {
  const inferred = inferProductIntentSlug(
    brief.rawTitle,
    brief.cleanBrand,
    brief.feedCleaned?.trim() || undefined,
  );
  const hasConflict =
    inferred != null && inferred !== brief.categorySlug;
  const applianceHaystack = `${brief.rawTitle} ${brief.productRole} ${brief.displayH1} ${brief.feedCleaned ?? ""}`;
  const applianceInMedical =
    isApplianceFeedCue(applianceHaystack) && isMedicalMisbucketSlug(brief.categorySlug);
  if (brief.categorySlug !== "other" && !hasConflict && !applianceInMedical) return "";

  const sampleslugs = ALLOWED_SHELF_SLUGS.slice(0, 48).join(", ");
  const conflictNote = hasConflict
    ? `\nKonflikt: popis z feedu → «${inferred}», kategorie stránky → «${brief.categorySlug}». Zvol «${inferred}», pokud je role z názvu jednoznačná.`
    : applianceInMedical
      ? `\nzdravotní bucket «${brief.categorySlug}» neodpovídá feedu (doplněk/auto/gadget). Zvol «auto», «auto-electronics» nebo «home-gadgets» — ne «hearing» ani jinou zdravotní polici.`
      : "";
  const classificationBlock = buildShelfClassificationGuideCS();

  return `=== KATALOGOVÁ KATEGORIE (podle role produktu, ne podle značky) ===
${brief.categorySlug === "other" ? "Automatický klasifikátor nenašel kategorii." : "Kategorie stránky nemusí nutně odpovídat popisu z feedu."}
Zvol shelf_slug podle feedu a názvu produktu — značka neurčuje kategorii.
Značka: «${brief.cleanBrand}» | role: ${brief.productLabel || brief.categoryRole}
feed: «${brief.feedSnippet.slice(0, 120)}»${conflictNote}

Pokud feed obsahuje partnerský popis (AdCombo categories[] + description), použij ho pro roli produktu — partner bucket je jen poznámka, ne konečná kategorie.

U doplňku «Automat» / «automatic» (automatická regulace krevního cukru, metabolismus) to NEZNAMENÁ kategorii «auto» — jen doplňky pro auto.
«detox» / detox / toxiny NEZNAMENÁ «auto» — nespojuj «auto» s detoxem; použij polici detox-cleanse.

PAST bucket «dýchací cesty» (Shakes a podobní partneři): Obecný bucket «respiratory / dýchací cesty» často obsahuje SKU z jiných nik. Čti **název landingu** a konec feedu — ne bucket a ne jen značku. Deep Inhale / lung tea → respiratory-health; proti hemoroidom → hemorrhoids; papilomi/papillomas → papillomas; alkohol/odvisnost → alcoholism; za sluh/hearing → hearing; shujšanje/abiau → weight-management; kajenje/smoking → smoking-cessation; epilator / wax / nail lamp → personal-grooming / beauty-tools; ceas / DIY-Clock / wall clock → accessories; proiector laser / Laser → home-gadgets; bandă LED / RGB LED / led strip → home-gadgets; lopată / BRANDCAMP / shovel → garden-tools; sigilant / sealant / găuri → home-gadgets; lampă senzor mișcare / solar wall lamp → home-climate. Značka Reishield/Cordyceps (jako Benaga) může být ve více nikách — čti tail/název landingu, značka ≠ kategorie. NIKDY nedávej kosmetický gadget do kategorie respiratory, pokud je název styling/epilace; NIKDY nedávej hodiny/laser/LED/lopatu/těsnění/lampu pod «dýchací cesty».

PAST «forma + police» (anti-aging, hemorrhoids, digestive): police «anti-aging» ≠ automaticky make-up — čti formKind. Kapsle/tableta/kapky → ústní anti-aging doplněk, NE make-up. police «hemorrhoids» + kapsle → kapsle proti hemoroidům, NE místní krém. «digestive» → «doplněk na trávení / trávicí komfort», NIKDY «wellness produkt» nebo «celková pohoda».

PAST bucket «hearing» / «sluch» / «vision-eye-care» (KMA a podobní): obecný bucket sluch často obsahuje gadgety a kosmetiku, ne doplněk na sluch. Čti **název produktu** — ne bucket. kulma na vlasy / curling iron / ondulator / bigudi → personal-grooming; trimmer barbă / beard trimmer → personal-grooming; colanți / liquid tights / leggings → clothing; albire dinți / whitening pen → personal-grooming; umidificator / AirCalm / aroma diffuser → home-climate; fond de ten / Venzen / BB cushion / mască LED / pudră sprâncene → anti-aging / beauty-tools / personal-grooming. NIKDY «kapsle na sluch» / «doplněk na sluch» u kosmetiky nebo spotřebičů pro domácnost.
PAST bucket «nervový systém» / «nervous-system» (Cpagetti, Shakes a podobní): obecný bucket «nervový systém» obsahuje SKU s různými rolemi — čti **landing URL** a název feedu, ne stereotyp «anti-stres». spomin / memory / memorsh / cognitive → «kapsle na paměť a koncentraci»; neuropat / neuropatie / neurosh → «kapsle na neuropatii»; stres / anxietate → doplněk proti stresu; nesomn / melatonin → spánek. Značka Reishield / Cordyceps / Glucadin / Benaga může mít více SKU — landing ≠ jediná role. NIKDY «doplněk proti stresu» s landingem memorsh/neurosh nebo feedem spomin/neuropat.
PAST bucket «blood-pressure»: genunchier / knee brace → joint-care, ne doplněk na krevní tlak.
PAST CPA TL nutra-lanes: «Nutra: vysoký krevní tlak» ≠ automaticky doplněk na krevní tlak. Jen značka (Uromexil, Pulsero) + potence/popis → potence-libido. «Nutra: potence» + kardiovaskulární popis → blood-pressure. Čti pole description a landing URL — bucket CPA TL je reklamní kanál, ne role produktu.
PAST bucket «immunity»: Vermixin / Cleorix / antiparazitar → parasites, ne obecná imunita. DM-Norm / InsuLevel / Balansulin / glucose / krevní cukr → diabetes-care, ne imunita.
PAST bucket «household» / «other» / «home-gadgets» (Shakes a podobní): obecné buckety «household / domácnost» a «other / wellness» často obsahují doplňky z jiných nik. Čti **landing URL** (subdoména) a název landingu — ne bucket a ne jen značku. Balancio + balancioloss → weight-management; Neoflorax/Benaga/Cordyceps + othersh → digestive (nebo jiná nika podle tailu landingu); Cordyceps + rejuvsh → anti-aging; Rhino Correct → beauty-tools; Benaga testosteron → potence-libido; hemoroid/papilomi/sluh/alkohol/abiau → odpovídající nika (jako u bucketu respiratory). Značka Cordyceps/Benaga/Reishield/Neoflorax/Balancio může mít více SKU — landing ≠ kategorie. NIKDY «wellness produkt» / «denní wellness doplněk» u doplňku se zdravotním landingem.
PAST «potence-libido» vs «penis-enlargement»: Gigant gel / enlargement gel → penis-enlargement, ne potence.

${classificationBlock}

Další příklady (název z feedu → shelf_slug):
- «EDGII Leggings IT» → clothing (tvarující oděv, ne doplněk)
- «ClearVisionHD Night Glasses» → optics (funkční brýle)
- «Mini USB Vacuum Cleaner» → home-gadgets (kompaktní spotřebič pro domácnost)
- «Handy Heater Portable» → home-climate (pokojový ohřívač)
- «Waeste Trainer Corset» → clothing (tvarující oděv)
- «Wall Climbing RC Car» → kids-toys
- Zdravotní feed (Cystitis / prostata / Potency / Hypertension) → odpovídající nika

Pokud je produkt doplněk, kosmetika nebo zařízení — použij odpovídající slug niky, NIKDY «other».
Povolené slugy (Tool-Enum): ${sampleslugs}`;
}

export function buildNoPhotoCopyGuideCS(brief: ProductCopyBrief): string {
  if (!brief.imagePartnerOnly) return "";
  return `=== STRÁNKA BEZ SPOLEHLIVÉ FOTKY PRODUKTU ===
Neodkazuj na «fotku», «obrázek», «viz výše», «klikni na obrázek».
Dobrý příklad: «${brief.cleanBrand} ${brief.productRole || brief.productLabel || "produkt pro domácnost"}. Níže najdeš složení, použití a FAQ.»
Špatný příklad: «Na fotce je vidět, že produkt má elegantní design…»
Důraz: tabulky, technické údaje, FAQ a návod k použití.`;
}

export function buildCzechOutputGuideBG(brief: ProductCopyBrief, mode: PromptNicheMode): string {
  const lines: string[] = [
    "=== ČESKÝ VÝSTUP (description_html + FAQ) ===",
    "Piš POUZE česky. Publikovaný text nesmí obsahovat směs cizích jazyků.",
    `Použij komerční název «${brief.cleanBrand}» doslovně — každé slovo značky, bez zkracování.`,
    "Nekopíruj tokeny z partnerského feedu: «low low», «HIGH», «FREE», «HOLD», kódy zemí (EU/DE/RO) — to nejsou popisy produktu.",
  ];

  if (brief.feedHasCyrillic) {
    lines.push(`
Smíšený feed (UA/RU) — vyber fakta a přepiš je do češtiny:
  feed: «${brief.cleanBrand} — prostata kapsle, 30 ks.»
  DOBRÝ VÝSLEDEK: «30 kapslí na prostatu»
  ŠPATNÝ VÝSLEDEK: «prostata kapsle» ve smíšeném jazyce nebo nepřeložený text feedu`);
  }

  if (mode === "appliance") {
    lines.push(`
Bohatá stránka vs. prázdná šablona:
  ŠPATNĚ: «lze objednat v České republice s doručením a dobírkou» bez technických údajů
  DOBŘE: h2 «Zařízení a funkce» → ul se 4–6 body (watty, režimy, materiály z názvu «${brief.cleanBrand}»)`);
  } else {
    const regimeEx = buildFormRegimeExampleBG(brief.formKind, brief.formLabel, brief);
    lines.push(`
Bohatá stránka vs. prázdná šablona:
  ŠPATNĚ: «lze objednat v České republice» bez složení nebo schématu užívání
  DOBŘE: h2 «Složení a mechanismus účinku» → ul se 4 složkami; ${regimeEx}`);
  }

  if (brief.feedIsThin) {
    lines.push(`
Slabý feed — doplň pravděpodobnými detaily z názvu «${brief.cleanBrand}» (role: «${brief.productRole}»), ne z kategorie katalogu:
  Přidej 4–6 konkrétních bodů do bloku technických údajů/složení. Nepiš «neurčené vlastnosti».
${COMPOSITION_THIN_FEED_GUIDE}`);
  }

  lines.push(
    `\n${buildContentFocusGuideBG(brief)}`,
  );

  const formVsCategory = buildFormVsCategoryGuideBG(brief);
  if (formVsCategory) lines.push(`\n${formVsCategory}`);

  const formConsistency = buildFormConsistencyGuideBG(brief);
  if (formConsistency) lines.push(`\n${formConsistency}`);

  const painFirst = buildPainFirstVocabularyGuideCS(brief);
  if (painFirst) lines.push(`\n${painFirst}`);

  lines.push(
    `\n${buildProductRoleGuideCS({
      cleanBrand: brief.cleanBrand,
      rawTitle: brief.rawTitle,
      productRole: brief.productRole,
      shelfSlug: brief.categorySlug,
    })}`,
    `\n${buildProductIntentGuideCS({
      cleanBrand: brief.cleanBrand,
      rawTitle: brief.rawTitle,
      categorySlug: brief.categorySlug,
      productRole: brief.productRole,
      feedCleaned: brief.feedCleaned,
    })}`,
  );

  const shelfGuide = buildCatalogShelfGuideCS(brief);
  if (shelfGuide) lines.push(`\n${shelfGuide}`);

  const noPhotoGuide = buildNoPhotoCopyGuideCS(brief);
  if (noPhotoGuide) lines.push(`\n${noPhotoGuide}`);

  lines.push(`
=== SOULAD KRÁTKÝCH POLÍ (title, subtitle, meta_desc, display_title) ===
Každé krátké pole používá stejný styl «forma + konkrétní problém» — bez různých eufemismů v jednotlivých polích.
Jen jedna «—» v title/display_title (mezi značkou a popisem); v popisu nepoužívej pomlčku — např. DOBŘE «kapsle na zánět močového měchýře», ŠPATNĚ «kapsle — na zánět močového měchýře».`);
  return lines.join("\n");
}

export function buildCzechOutputGuideFaqBG(brief: ProductCopyBrief): string {
  const focus = resolveContentFocus(brief);
  const mismatchAvoid = buildMismatchAvoidBlockBG(focus, brief.productRole);
  const scriptHint = brief.feedHasCyrillic
    ? `Odpovědi FAQ: přepiš fakta z UA/RU feedu do češtiny (např. «prostatitida» → «na prostatu»). Nikdy azbuka v textu.`
    : "Odpovědi FAQ: pouze česky, nikdy azbuka.";
  const regimeEx = buildFormRegimeExampleBG(brief.formKind, brief.formLabel, brief).replace(
    /^h2 «[^»]+» → /,
    `${brief.cleanBrand} `,
  );
  const mismatchBlock = mismatchAvoid ? `\n${mismatchAvoid}\n` : "";
  const painFirst = buildPainFirstVocabularyGuideCS(brief);
  const painBlock = painFirst ? `\n${painFirst}\n` : "";
  const faqExamples = focus.mismatch
    ? buildFaqExampleBlockForFocus(focus.focusSlug, focus.pageSlug, brief.formKind)
    : isWeightDropsBrief(brief)
      ? buildWeightDropsFaqExampleBlock()
      : isJointSprayBrief(brief)
        ? buildJointSprayFaqExampleBlock()
        : isFungusCreamBrief(brief)
          ? buildFungusCreamFaqExampleBlock()
          : isPapillomaGelBrief(brief)
            ? buildPapillomaGelFaqExampleBlock()
            : isValgusSprayBrief(brief)
              ? buildValgusSprayFaqExampleBlock()
              : brief.categorySlug === "cystitida" && focus.focusSlug === "cystitida"
                ? buildFaqExampleBlockForFocus("cystitida", "cystitida", brief.formKind)
                : brief.categorySlug === "traveni" && isDiabetesIntentBrief(brief)
                ? buildDiabetesOnDigestiveFaqExampleBlock()
                : brief.categorySlug === "vboceny-palec" && isOralFormKind(brief.formKind)
                  ? buildFaqExampleBlockForFocus("vboceny-palec", "vboceny-palec", brief.formKind)
                  : buildFaqExampleBlock();
  return `=== FAQ ČESKY ===
${scriptHint}
Špatný příklad: «Produkt lze objednat v České republice s doručením» (obecné, bez detailů)
Dobrý příklad: «${regimeEx}.»
${mismatchBlock}${painBlock}
=== PŘÍKLAD FAQ (styl a detailnost) ===
${faqExamples}`;
}

export function buildNonMedicalBlockCS(categorySlug: string): string {
  const niche = getNicheType(categorySlug);
  if (niche === "supplement" || niche === "device") return "";
  const label =
    categorySlug === "obleceni" || categorySlug === "boty" || categorySlug === "vyhrivane-obleceni"
      ? "oděv"
      : categorySlug === "hracky"
        ? "hračka"
        : "produkt pro domácnost nebo doplněk";
  return `================ PRODUKT NENÍ ZDRAVOTNICKÝ PROSTŘEDEK ================
Tento článek je ${label}. Piš o praktických funkcích, materiálech, pohodlí a bezpečném použití.
NEPOUŽÍVEJ: «doplněk stravy», «celková pohoda», «ortopedická pomůcka» (kromě skutečného korektoru), «cyklus užívání» nebo «dávkování».`;
}

function supplementH2List(deliveryH2: string, topical = false, variant?: string[]): string {
  const intakeH2 = topical
    ? "Použití: doporučené schéma (+ h3 Upozornění)"
    : "Užívání: doporučené schéma (+ h3 Upozornění)";
  const base = variant ?? [
    "Účel a forma produktu",
    "Složení a mechanismus účinku",
    intakeH2,
    "Proč právě tento produkt",
    deliveryH2,
    "Důležité před objednávkou",
  ];
  if (!variant && topical) {
    return base.join("; ");
  }
  if (variant) {
    const withDelivery = [...base];
    if (!withDelivery.some((h) => h.includes("Doručení") || h.includes("Objednávka") || h.includes("platba"))) {
      withDelivery.splice(Math.max(0, withDelivery.length - 1), 0, deliveryH2);
    }
    return withDelivery.join("; ");
  }
  return base.join("; ");
}

function applianceH2List(deliveryH2: string, variant?: string[]): string {
  const base = variant ?? [
    "Zařízení a funkce",
    "Použití (+ h3 Upozornění)",
    "Proč právě tento produkt",
    deliveryH2,
    "Důležité před objednávkou",
  ];
  if (variant) {
    const withDelivery = [...base];
    if (!withDelivery.some((h) => h.includes("Doručení") || h.includes("Objednávka") || h.includes("platba"))) {
      withDelivery.splice(Math.max(0, withDelivery.length - 1), 0, deliveryH2);
    }
    return withDelivery.join("; ");
  }
  return base.join("; ");
}

export function buildStructureSpecCS(
  mode: PromptNicheMode,
  _title: string,
  cities: string,
  deliveryH2: string,
  compact = false,
  formKind?: string,
  categorySlug?: string,
  copyBrief?: ProductCopyBrief,
  seed = 0,
): string {
  const blockCount = compact ? 4 : 6;
  const topical =
    (formKind ? TOPICAL_KINDS.has(formKind) : false) ||
    (copyBrief ? isJointTopicalBrief(copyBrief) || isJointSprayBrief(copyBrief) || isFungusCreamBrief(copyBrief) || isPapillomaGelBrief(copyBrief) || isValgusSprayBrief(copyBrief) : false);
  const h2Variant =
    categorySlug && seed
      ? pickH2Variant(categorySlug, seed, mode)
      : undefined;
  const h2List =
    mode === "appliance"
      ? applianceH2List(deliveryH2, h2Variant)
      : supplementH2List(deliveryH2, topical, h2Variant);
  const exampleBlock =
    mode === "appliance"
      ? buildApplianceHtmlExampleBlock()
      : buildOralFormHtmlExampleBlock(formKind ?? "unknown", categorySlug, _title, copyBrief
          ? {
              cleanBrand: copyBrief.cleanBrand,
              rawTitle: copyBrief.rawTitle,
              displayH1: copyBrief.displayH1,
              productRole: copyBrief.productRole,
              feedCleaned: copyBrief.feedCleaned,
            }
          : undefined);

  const compactNote = compact
    ? "Kompaktní režim: použij z příkladu jen první 4 h2 bloky (vynech bloky «Proč právě tento produkt» a «Důležité před objednávkou», pokud je málo místa).\n"
    : "";
  return `struktura description_html (${blockCount} h2 bloků, bez FAQ).
${compactNote}h2 nadpisy přirozenou češtinou, jako v ÚPLNÉM PŘÍKLADU: ${h2List}.
H1 stránky je již publikováno mimo description_html — NEOPAKUJ ho jako H1 ani jako první h2.
Města pro blok o doručení: ${cities}. Doručení a platba na dobírku v České republice. Uveď alespoň 4 města ze seznamu (např. Praha, Brno, Ostrava, Plzeň).

${exampleBlock}`;
}

export function buildStructureSpecCompactBG(
  mode: PromptNicheMode,
  title: string,
  cities: string,
  deliveryH2: string,
  formKind?: string,
  categorySlug?: string,
): string {
  return buildStructureSpecCS(mode, title, cities, deliveryH2, true, formKind, categorySlug);
}

export function buildDescHtmlToolHintCS(
  mode: PromptNicheMode,
  deliveryH2: string,
  compact = false,
  formKind?: string,
): string {
  const tags = mode === "appliance"
    ? "h2, h3, p, ul, li, strong, em"
    : "h2, h3, p, ul, li, table, tr, td, th, strong, em";
  const closeHint =
    " Vždy uzavři HTML tagy; pokud je málo místa, zkrať poslední odstavec, ale zakonči tagem </li></ul> nebo </p>.";
  const topical = formKind ? TOPICAL_KINDS.has(formKind) : false;
  const h2List =
    mode === "appliance"
      ? applianceH2List(deliveryH2)
      : supplementH2List(deliveryH2, topical);
  const blocks = compact ? 4 : 6;
  return `HTML česky (${blocks} h2 bloků, bez FAQ). Tagy: ${tags}. Bez HTML entit a odkazů. h2 jako v příkladu: ${h2List}. Neopakuj H1.${closeHint}`;
}

export function buildToolSchemaCS(
  mode: PromptNicheMode,
  deliveryH2: string,
  compact = false,
  includeShelfSlug = false,
) {
  const titleEx = feedTitleToolExample();
  const properties: Record<string, unknown> = {
    title: {
      type: "string",
      description:
        `SEO titulek (45–58 znaků). Čistá značka + konkrétní role z briefu. DOBŘE: «${titleEx.good}». ŠPATNĚ: «${titleEx.bad}».`,
    },
    subtitle: {
      type: "string",
      description:
        "Krátký podtitulek (max. 80 znaků) s konkrétním přínosem použití. Bez značky. Bez irelevantních obecných frází.",
    },
    meta_desc: {
      type: "string",
      description:
        `Věta o 120–155 znacích se skutečným přínosem, bez značky, s klíčovým slovem kategorie a krátkou CTA. DOBŘE: «${FEED_TITLE_FEW_SHOTS[0].goodMeta}». ŠPATNĚ, pokud obsahuje EU/ES/IT/SI/LOW/2.0.`,
    },
    display_title: {
      type: "string",
      description: `Čistý titulek stránky česky. Latinská značka zůstává beze změny, bez kódů z feedu (EU, ES, IT, SI, LOW, TOP, FREE, 2.0). DOBŘE: «${FEED_TITLE_FEW_SHOTS[0].cleanBrand} — konkrétní role». Max. 80 znaků.`,
    },
    description_html: { type: "string", description: buildDescHtmlToolHintCS(mode, deliveryH2, compact) },
  };
  if (includeShelfSlug) {
    properties.shelf_slug = {
      type: "string",
      enum: ALLOWED_SHELF_SLUGS,
      description:
        "Slug katalogové kategorie (SEO nika). Povinné, pokud je feed «other»: zvol skutečnou niku, nikdy «other».",
    };
  }
  const required = ["title", "subtitle", "meta_desc", "display_title", "description_html"];
  if (includeShelfSlug) required.push("shelf_slug");

  return {
    type: "function",
    function: {
      name: "save_product_content",
      description: "SEO text produktu česky",
      parameters: {
        type: "object",
        properties,
        required,
        additionalProperties: false,
      },
    },
  } as const;
}

export function buildFaqToolSchemaCS() {
  return {
    type: "function",
    function: {
      name: "save_product_faq",
      description: "5 unikátních otázek FAQ pro produktovou stránku",
      parameters: {
        type: "object",
        properties: {
          faq: {
            type: "array",
            minItems: 5,
            maxItems: 5,
            items: {
              type: "object",
              properties: {
                q: { type: "string" },
                a: {
                  type: "string",
                  description: "Odpověď 60–140 slov, konkrétní, bez HTML a AI klišé.",
                },
              },
              required: ["q", "a"],
              additionalProperties: false,
            },
          },
        },
        required: ["faq"],
        additionalProperties: false,
      },
    },
  } as const;
}

export function buildFaqUserPromptCS(src: ItPromptSource, mode: PromptNicheMode): string {
  const focus = src.copyBrief ? resolveContentFocus(src.copyBrief) : null;
  const d = focus?.descriptor ?? getCategoryDescriptor(src.categorySlug);
  const audience = d?.audience ?? "—";
  const problem = d?.problem ?? "—";
  const slFacts = czechizeProductFacts(src.facts);
  const formLabel = slFacts.formLabelUk;
  const factsBlock = buildFactsBlockBg(slFacts);
  const productName = (src.displayTitle ?? src.title).trim();
  const brandToken = productName.split(/\s*[—–-]\s*/)[0]?.trim() || productName;
  const feedSnippet = (src.feedCleaned ?? "").trim().slice(0, 220);
  const feedBlock = feedSnippet
    ? `Úryvek feedu (může být UA/RU — vyber fakta a piš pouze česky):\n"""\n${feedSnippet}\n"""`
    : "";
  const roleHint = src.copyBrief?.productRole
    ? `role produktu (z feedu): ${src.copyBrief.productRole}\n`
    : "";
  const categoryNote = focus?.mismatch
    ? `SEO kategorie: ${src.categorySlug}. FAQ o roli z feedu «${src.copyBrief?.productRole ?? problem}».\n`
    : "";
  const paaBlock = buildFaqPaaHintBlock(src.categorySlug);
  const goldenFaqBlock = buildShelfGoldenFaqBlockBG(src.categorySlug, src.facts.kind);

  const goodBad =
    mode === "appliance"
      ? `Dobrý příklad: «Na jakých površích funguje ${brandToken} — hladká stěna nebo tapeta?»
Slabý příklad: «Kdy jsou vidět první výsledky?» (příliš obecné)`
      : `Dobrý příklad: «Můžu užívat ${brandToken}, pokud už beru protizánětlivé léky?»
Slabý příklad: «Musím platit předem?» (už pokryto u doručení)`;

  const structure =
    mode === "appliance"
      ? `5 otázek: (1) co dělá ${brandToken}, (2) bezpečnost použití, (3) výsledek v čase, (4) doručení/platba CZ, (5) unikátní pro toto SKU.`
      : `5 otázek: (1) užívání/použití «${formLabel || "z briefu"}», (2) kombinace s léky, (3) kdy začne působit, (4) doručení/platba CZ, (5) unikátní pro ${brandToken}.`;

  return `Vytvoř 5 UNIKÁTNÍCH otázek a odpovědí FAQ — odpovídej na skutečné dotazy zákazníků.

Produkt (H1): ${productName}
Značka: ${brandToken}
Forma: ${formLabel || "—"}
${roleHint}${categoryNote}Role produktu: ${src.copyBrief?.productRole ?? problem}
Cílová skupina: ${audience}

${feedBlock}

${factsBlock}

${paaBlock ? `${paaBlock}\n\n` : ""}${goldenFaqBlock}

${goodBad}

${structure}

Pravidla: «${brandToken}» alespoň ve 3 otázkách. Úplné odpovědi (3–5 vět s čísly). bez HTML. Zavolej nástroj save_product_faq.`;
}

export function buildUserPromptCS(
  src: ItPromptSource,
  cleaned: string,
  h1: string,
  seed: number,
  mode: PromptNicheMode,
  _qaErrors?: string[],
  opts: { compactStructure?: boolean; deliveryH2?: string } = {},
): string {
  const title = (h1 && h1.trim()) || src.title;
  const cities = pickCzechCities(seed, 6).join(", ");
  const deliveryH2 = opts.deliveryH2 ?? deliveryH2For(src.categorySlug, seed);
  const feedHasContent = cleaned.trim().length >= 40;
  const feedBlock = cleaned.trim()
    ? `feed (může být UA/RU — vyber fakta o produktu a piš pouze česky; ignoruj pole webmaster/KPI):\n"""\n${cleaned}\n"""`
    : "Popis z feedu chybí — piš jen to, co jednoznačně vyplývá z názvu a bloku PRODUKTOVÁ FAKTA.";

  const factsBlock = buildFactsBlockBg(czechizeProductFacts(src.facts));
  const focus = src.copyBrief ? resolveContentFocus(src.copyBrief) : null;
  const pageDesc = getCategoryDescriptor(src.categorySlug);
  const categoryHint = pageDesc
    ? focus?.mismatch
      ? `Kategorie (SEO klastr): ${src.categorySlug} — ${pageDesc.short}. Piš o roli z feedu «${src.copyBrief!.productRole}».`
      : `Kategorie: ${src.categorySlug} — ${pageDesc.short}. Téma: ${pageDesc.problem}. Cílová skupina: zákazníci v České republice.`
    : "";

  const bundle = pickGoldenBundle({
    brief: src.copyBrief,
    categorySlug: src.categorySlug,
    formKind: src.facts.kind,
    mode,
    feedHasContent,
    feedIsThin: src.copyBrief?.feedIsThin ?? !feedHasContent,
  });

  const structureBlock = buildStructureSpecCS(
    mode,
    title,
    cities,
    deliveryH2,
    opts.compactStructure === true,
    src.facts.kind,
    src.categorySlug,
    src.copyBrief,
    seed,
  );
  const seoIntentBlock = buildSeoIntentPromptBlock(src.categorySlug, seed);

  const nutraLaneBlock = src.copyBrief ? buildNutraLaneAwarenessBG(src.copyBrief) : "";
  const contentFocusBlock = src.copyBrief ? buildContentFocusGuideBG(src.copyBrief) : "";

  const profilesHint =
    mode === "appliance"
      ? "Uveď 2–3 profily použití (domácnost, kancelář, zahrada) — konkrétní scénáře, ve třetí osobě."
      : "Uveď profil typického zákazníka a schéma užívání/použití — konkrétní scénáře, bez «vyzkoušel jsem produkt».";

  return `Napiš faktický obsah pro produktovou stránku v České republice.

H1 stránky (již publikováno — NEOPAKUJ jako první h2): «${title}»
${categoryHint}

${factsBlock}

${feedBlock}

${nutraLaneBlock ? `${nutraLaneBlock}\n\n` : ""}${contentFocusBlock ? `${contentFocusBlock}\n\n` : ""}${seoIntentBlock}

${bundle.thinFeedBlock ? `${bundle.thinFeedBlock}\n\n` : ""}${bundle.shortFieldsBlock ? `${bundle.shortFieldsBlock}\n\n` : ""}${profilesHint}

${bundle.exampleBlock}

Formát: čisté HTML (h2, h3, p, ul, li, strong, em). meta_desc: 120–155 znaků, informativní, bez značky, s diskrétní CTA.

${structureBlock}

Zavolej nástroj save_product_content.`;
}

/** System prompt for main product content generation (CZ storefront). */
export const SYSTEM_PROMPT_BG = `Jsi editor na webu recenze-ceny.cz — informační průvodce pro zákazníky v České republice.

PROČ: pomáháš skutečnému člověku pochopit produkt, způsob použití a co si ověřit před objednávkou — neplníš stránku klíčovými slovy.

ZDROJ: z podkladů dodavatele (feed + produktový list), přizpůsobeno pro trh Česká republika.

JAK: přirozená čeština, faktický a strukturovaný text. Zdrojem pravdy je feed a blok PRODUKTOVÁ FAKTA. Pokud je feed neúplný, řekni to upřímně a doplň jen kontextem kategorie (s označením).

Konkrétní produkt vychází z FEEDU, ne z kategorie stránky (slug = SEO klastr).

Piš jazykem českého vyhledávání — např. «kapsle proti hemoroidům», «kloubní gel», ne obecné eufemismy.

Dobrý příklad (hemoroidy): title «Proctowell — gel proti hemoroidům»; meta_desc s hemoroidy a formou z feedu.

U zdravotních produktů (YMYL): opatrný tón; h3 „Upozornění“ a „Důležité před objednávkou“ — doplněk stravy, ne lék; lékařská konzultace při těhotenství nebo léčbě.

Dobrý příklad (doplněk, úryvek):
title: «Hondrofrost — kloubní gel»
První odstavec: forma, cílová skupina, konkrétní použití.
h3 Upozornění: «Doplněk stravy, ne lék. Výsledky se mohou lišit.»
Důležité před objednávkou: «Informace pocházejí z podkladů dodavatele. Zkontrolujte etiketu při doručení.»

Dobrý příklad (spotřebič, úryvek):
h2 «Zařízení a funkce» → 4–6 pravděpodobných technických bodů z názvu.
Profily: domácnost, kancelář — konkrétní scénáře, ve třetí osobě.

Piš pouze česky. Značku ponech beze změny. Zmiň expresní kurýr v České republice a platbu na dobírku, kde je to relevantní.`;

/** System prompt for tail → Czech descriptor translation. */
export const TRANSLATE_SYSTEM_CS =
  "Přelož krátký popis produktu do češtiny (2–6 slov). Vrať pouze překlad, bez uvozovek a bez vysvětlení. Nesmí obsahovat cenu, měnu ani markery FREE/HOLD/EU/ES/IT/SI/AT/DE/LOW.\\n\\nDobré příklady:\\n- handy heater / portable heater / room heater → přenosný elektrický ohřívač\\n- room heater → pokojový ohřívač\\n- driving glasses / night vision → brýle pro noční řízení\\n- money amulet / fehu amulet → amulet pro štěstí\\n- cushion / pillow → polštář\\n- vision support caps / eye support capsules → kapsle pro podporu zraku\\n- gel za sklepe / joint gel → kloubní gel\\n- kapsule za sklepe / joint capsules → kloubní kapsle\\n- spray valgus / spray hallux → sprej na vbočený palec\\n- intimate comfort / hemorrhoids → kapsle proti hemoroidům (ústně) nebo krém proti hemoroidům (místně)\\n- kapsule za kajenje / smoking capsules → kapsle pro odvykání kouření\\n- neuropat / neuropathy → kapsle na neuropatii\\n- kapsule protiv glivic / antifung capsules → kapsle proti plísni nehtů\\n\\nŠpatné příklady (negeneruj):\\n- ohřívač vody místo přenosného ohřívače\\n- tautologický gel\\n- žvýkačka, když feed uvádí kapsli\\n- EU, ES, SI, AT, DE, Low, 2.0 jako popis";

/** System prompt for FAQ generation. */
export const FAQ_SYSTEM_BG =
  "Editor FAQ pro recenze-ceny.cz — konkrétní odpovědi na skutečné dotazy zákazníků v České republice. bez HTML. Pouze česky. Faktický tón, bez lékařských slibů. Úplné odpovědi (3–5 vět se scénáři), ne obecné formulky.";

/** QA retry hints when HTML was truncated by token limit. */
export const QA_HTML_TRUNCATION_HINTS_BG = [
  "HTML je useknuté: uzavři všechny tagy (</p>, </ul>, </li>); v případě potřeby zkrať poslední blok.",
  "Příklad správného uzavření: ...</li></ul><p>...</p>",
] as const;
