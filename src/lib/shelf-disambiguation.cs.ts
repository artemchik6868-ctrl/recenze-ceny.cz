/** Shelf disambiguation (HU) — potency vs hemorrhoids and similar feed-bucket traps. */

import { SHELF_CLASSIFICATION_FEW_SHOTS } from "./shelf-classification.examples.cs";

export type ShelfDisambiguationFewShot = {
  feedTitle: string;
  goodShelf: string;
  goodRoleCs: string;
  badShelf: string;
  badRoleCs: string;
};

/** Generic title/bucket patterns (not per-SKU overrides). */
const POTENCY_SHELF_SHOTS: ShelfDisambiguationFewShot[] = [
  {
    feedTitle: "Erectone Active",
    goodShelf: "potence",
    goodRoleCs: "férfi potencia étrend-kiegészítő",
    badShelf: "hemoroidy",
    badRoleCs: "hemorroida elleni kapszulák",
  },
  {
    feedTitle: "Urogun Potency Treatment",
    goodShelf: "potence",
    goodRoleCs: "potencia és libidó étrend-kiegészítő",
    badShelf: "hemoroidy",
    badRoleCs: "hemorroida támogatás",
  },
  {
    feedTitle: "Erektobust Potency",
    goodShelf: "potence",
    goodRoleCs: "erekció étrend-kiegészítő",
    badShelf: "prostata",
    badRoleCs: "prosztata étrend-kiegészítő (ha a cím potenciáról szól)",
  },
  {
    feedTitle: "Proctonic Hemorrhoids Treatment",
    goodShelf: "hemoroidy",
    goodRoleCs: "hemorroida komfort étrend-kiegészítő",
    badShelf: "potence",
    badRoleCs: "potencia étrend-kiegészítő",
  },
  {
    feedTitle: "RectoSave",
    goodShelf: "hemoroidy",
    goodRoleCs: "hemorroida és érzékeny területek támogatása",
    badShelf: "potence",
    badRoleCs: "férfi potencia",
  },
  {
    feedTitle: "Hyperpotency capsule",
    goodShelf: "potence",
    goodRoleCs: "férfi potencia és libidó étrend-kiegészítő",
    badShelf: "krevni-tlak",
    badRoleCs: "vérnyomás étrend-kiegészítő",
  },
  {
    feedTitle: "Uromexil — capsule (CPA TL bucket: гипертония, description: potență)",
    goodShelf: "potence",
    goodRoleCs: "potencia kapszulák",
    badShelf: "krevni-tlak",
    badRoleCs: "vérnyomás étrend-kiegészítő",
  },
  {
    feedTitle: "Knee — knee brace / genunchier",
    goodShelf: "klouby",
    goodRoleCs: "térdtámasz / térdvédő",
    badShelf: "krevni-tlak",
    badRoleCs: "vérnyomás étrend-kiegészítő",
  },
  {
    feedTitle: "Motion Mat — massage mat",
    goodShelf: "domaci-vychytavky",
    goodRoleCs: "masszázs matrac",
    badShelf: "krevni-tlak",
    badRoleCs: "vérnyomás étrend-kiegészítő",
  },
];

export const SHELF_DISAMBIGUATION_FEW_SHOTS: ShelfDisambiguationFewShot[] = [
  ...SHELF_CLASSIFICATION_FEW_SHOTS,
  ...POTENCY_SHELF_SHOTS,
];

const SLUG_PRIORITY_SHOTS: Partial<Record<string, string[]>> = {
  "krevni-tlak": [
    "Uromexil",
    "Hyperpotency",
    "Knee — knee brace",
    "Motion Mat",
    "CardioBalance",
  ],
  "potence": [
    "Hyperpotency",
    "Uromexil",
    "Erectone",
    "CardioBalance",
    "Urogun",
  ],
  hemoroidy: ["Proctonic", "RectoSave", "Erectone", "Urogun"],
};

function scoreDisambiguationShot(shot: ShelfDisambiguationFewShot, categorySlug: string): number {
  let score = 0;
  if (shot.badShelf === categorySlug || shot.goodShelf === categorySlug) score += 3;
  const priorities = SLUG_PRIORITY_SHOTS[categorySlug] ?? [];
  for (const needle of priorities) {
    if (shot.feedTitle.includes(needle)) score += 2;
  }
  return score;
}

function pickDisambiguationExamples(categorySlug: string, limit = 5): ShelfDisambiguationFewShot[] {
  const ranked = SHELF_DISAMBIGUATION_FEW_SHOTS.map((s) => ({
    s,
    score: scoreDisambiguationShot(s, categorySlug),
  }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length >= 3) return ranked.slice(0, limit).map(({ s }) => s);

  const seen = new Set<string>();
  const out: ShelfDisambiguationFewShot[] = [];
  for (const { s } of ranked) {
    const key = s.feedTitle;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  for (const s of POTENCY_SHELF_SHOTS) {
    if (out.length >= limit) break;
    if (seen.has(s.feedTitle)) continue;
    seen.add(s.feedTitle);
    out.push(s);
  }
  return out.slice(0, limit);
}

export function buildShelfDisambiguationGuideCS(brief: {
  cleanBrand: string;
  rawTitle: string;
  categorySlug: string;
  productRole?: string;
}): string {
  const examples = pickDisambiguationExamples(brief.categorySlug, 5)
    .map(
      (s) =>
        `- «${s.feedTitle}» → kategória «${s.goodShelf}» («${s.goodRoleCs}»)\n` +
        `    HIBÁS: kategória «${s.badShelf}» («${s.badRoleCs}»)`,
    )
    .join("\n");

  const role = brief.productRole?.trim() || "terméktípus a feed címből";
  const dynamic =
    brief.rawTitle.trim()
      ? `\n«${brief.cleanBrand}» / «${brief.rawTitle.slice(0, 80)}»:\n` +
        `  Jelenlegi oldal kategória: «${brief.categorySlug}»\n` +
        `  Várt szerep: «${role}»\n` +
        `  Megjegyzés: «Erect-» / potencia / libidó nevek → potence-libido, NEM hemorrhoids. CPA TL «hipertónia» bucket ≠ automatikus vérnyomás — olvasd a leírást.`
      : "";

  return `=== KATEGÓRIA ELVÁLASZTÁS (potencia vs. hemorroidák és feed bucket-ek) ===
A feed címe határozza meg a helyes kategóriát. Hibás általános orvosi bucket-ek nem helyezhetik át a terméket rossz kategóriába.

Példák feed cím → kategória:
${examples}
${dynamic}
Szabály: potencia / erekció / férfi libidó → potence-libido; hemorroidák / proctonic / rectosave → hemorrhoids.`;
}
