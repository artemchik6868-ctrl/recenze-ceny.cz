/**
 * Shelf topic lexicon (CZ) — problem-first buyer language from search queries.
 * Single source for LLM few-shots, descriptors, and product roles.
 */

import {
  HEMORRHOID_CATEGORY_NAME,
  HEMORRHOID_SLUG,
} from "./hemorrhoid-vocabulary.cs";
import {
  POTENCY_CATEGORY_NAME,
  POTENCY_DESCRIPTOR_SHORT,
  POTENCY_ROLE_DEFAULT,
  POTENCY_SLUG,
  potencyRoleForForm,
} from "./potency-vocabulary.cs";

export type ShelfTopicEntry = {
  slug: string;
  buyerTopic: string;
  hubName: string;
  searchPhrases: readonly string[];
  topicCues: readonly string[];
  goodDescriptors: readonly string[];
  formTemplates?: (form: string) => readonly string[];
};

function oralAgainst(form: string, problem: string): readonly string[] {
  return [`${form} proti ${problem}`, `produkt proti ${problem}`];
}

function oralFor(form: string, problem: string): readonly string[] {
  return [`${form} pro ${problem}`, `produkt pro ${problem}`];
}

export const SHELF_TOPIC_LEXICON: Record<string, ShelfTopicEntry> = {
  [HEMORRHOID_SLUG]: {
    slug: HEMORRHOID_SLUG,
    buyerTopic: "hemoroidy",
    hubName: HEMORRHOID_CATEGORY_NAME,
    searchPhrases: [
      "kapsle proti hemoroidům",
      "přírodní produkt proti hemoroidům",
      "gel proti hemoroidům",
      "krém proti hemoroidům",
    ],
    topicCues: ["hemoroidy", "anální diskomfort", "krveácení", "anální oblast"],
    goodDescriptors: [
      "kapsle proti hemoroidům",
      "gel proti hemoroidům",
      "krém proti hemoroidům",
      "přírodní produkt proti hemoroidům",
    ],
    formTemplates: (form) => oralAgainst(form, "hemoroidům"),
  },
  "chrapani": {
    slug: "chrapani",
    buyerTopic: "chrápání",
    hubName: "Spánek a chrápání",
    searchPhrases: [
      "kapsle proti chrápání",
      "produkt proti chrápání",
      "produkt proti chrápání",
    ],
    topicCues: ["chrápání", "spánek", "klidné noci"],
    goodDescriptors: ["kapsle proti chrápání", "produkt proti chrápání"],
    formTemplates: (form) => [`${form} proti chrápání`, "produkt proti chrápání"],
  },
  "hubnuti": {
    slug: "hubnuti",
    buyerTopic: "kontrola hmotnosti",
    hubName: "Kontrola hmotnosti",
    searchPhrases: [
      "kapky na hubnutí",
      "kapsle na hubnutí",
      "kontrola hmotnosti",
      "produkt na podporu hubnutí",
    ],
    topicCues: ["váha", "chuť k jídlu", "metabolismus"],
    goodDescriptors: [
      "kapky na kontrolu hmotnosti",
      "kapsle na kontrolu hmotnosti",
      "produkt na kontrolu hmotnosti",
    ],
    formTemplates: (form) => [`${form} na kontrolu hmotnosti`],
  },
  "zrak": {
    slug: "zrak",
    buyerTopic: "zrak",
    hubName: "Zrak",
    searchPhrases: ["kapsle pro oči", "doplněk stravy pro zrak", "lutein pro oči"],
    topicCues: ["oči", "zrak", "únava ze obrazovky"],
    goodDescriptors: [
      "kapsle pro oči",
      "kapsle na podporu zraku",
      "doplněk stravy pro zrak",
    ],
    formTemplates: (form) => [`${form} pro zdraví očí`, `${form} na podporu zraku`],
  },
  "prostata": {
    slug: "prostata",
    buyerTopic: "prostata",
    hubName: "Prostata",
    searchPhrases: [
      "kapsle na prostatu",
      "doplněk stravy na prostatu",
      "zánět prostaty",
    ],
    topicCues: ["prostata", "močení", "urinární diskomfort"],
    goodDescriptors: [
      "kapsle na prostatu",
      "doplněk stravy na prostatu",
      "produkt na prostatu",
    ],
    formTemplates: (form) => oralFor(form, "prostatu"),
  },
  [POTENCY_SLUG]: {
    slug: POTENCY_SLUG,
    buyerTopic: "potence",
    hubName: POTENCY_CATEGORY_NAME,
    searchPhrases: [
      "kapsle na potenci",
      "produkt na potenci",
      "kapky na potenci",
      "mužská potence",
    ],
    topicCues: ["potence", "libido", "erekce"],
    goodDescriptors: [
      "kapsle na potenci",
      "produkt na potenci",
      "kapky na potenci",
      POTENCY_ROLE_DEFAULT,
    ],
    formTemplates: (form) => [potencyRoleForForm(form)],
  },
  paraziti: {
    slug: "paraziti",
    buyerTopic: "paraziti",
    hubName: "Paraziti",
    searchPhrases: [
      "kapsle proti parazitům",
      "kapky proti parazitům",
      "produkt proti parazitům",
    ],
    topicCues: ["paraziti", "trávení", "střeva"],
    goodDescriptors: [
      "kapsle proti parazitům",
      "kapky proti parazitům",
    ],
    formTemplates: (form) => oralAgainst(form, "parazitům"),
  },
  cystitida: {
    slug: "cystitida",
    buyerTopic: "cystitida",
    hubName: "Cystitida",
    searchPhrases: [
      "kapsle při cystitidě",
      "produkt proti cystitidě",
      "močová infekce",
    ],
    topicCues: ["cystitida", "pálení při močení", "močové cesty"],
    goodDescriptors: [
      "kapsle při cystitidě",
      "podpora při cystitidě",
    ],
    formTemplates: (form) => oralFor(form, "cystitidu"),
  },
  "klouby": {
    slug: "klouby",
    buyerTopic: "klouby",
    hubName: "Klouby",
    searchPhrases: [
      "kloubní gel",
      "kloubní kapsle",
      "kloubní produkt",
    ],
    topicCues: ["klouby", "pohyblivost", "chrupavka"],
    goodDescriptors: ["kloubní gel", "kloubní kapsle"],
    formTemplates: (form) => [`${form} pro klouby`],
  },
};

export function getShelfTopic(slug: string): ShelfTopicEntry | null {
  return SHELF_TOPIC_LEXICON[slug] ?? null;
}

export function buildShelfTopicGuideBG(
  slug: string,
  opts?: { formLabel?: string; brand?: string },
): string {
  const entry = getShelfTopic(slug);
  if (!entry) return "";

  const brand = opts?.brand?.trim();
  const form = opts?.formLabel?.trim();
  const searchLine = entry.searchPhrases.join(", ");
  const cueLine = entry.topicCues.join(", ");

  let productLines = entry.goodDescriptors.map((d) => `  • ${d}`).join("\n");
  if (form && entry.formTemplates) {
    const targets = entry.formTemplates(form);
    productLines = targets
      .map((t) => `  • ${brand ? `${brand} — ${t}` : t}`)
      .join("\n");
  } else if (brand) {
    productLines = entry.goodDescriptors
      .slice(0, 2)
      .map((d) => `  • ${brand} — ${d}`)
      .join("\n");
  }

  return (
    `=== TÉMA PRO KUPUJÍCÍ (jazyk českých vyhledávání) ===\n` +
    `Téma: ${entry.hubName}\n` +
    `Jak hledají: ${searchLine}\n` +
    `Užitečná slova: ${cueLine}\n` +
    `Příklady:\n${productLines}`
  );
}

/** @deprecated use buildShelfTopicGuideBG */
export const buildShelfTopicGuideRO = buildShelfTopicGuideBG;

/** Few-shot rows for descriptor style guide — positive only. */
export function shelfTopicFewShots(): Array<{ context: string; goodExamples: readonly string[] }> {
  return Object.values(SHELF_TOPIC_LEXICON).map((e) => ({
    context: `${e.slug} / ${e.buyerTopic}`,
    goodExamples: e.goodDescriptors,
  }));
}

/** Re-export potency constants for thin-wrapper consumers. */
export {
  POTENCY_SLUG,
  POTENCY_CATEGORY_NAME,
  POTENCY_DESCRIPTOR_SHORT,
  POTENCY_ROLE_DEFAULT,
  potencyRoleForForm,
};
