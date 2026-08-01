/** Compact Czech review-generation prompts for content pipeline + smoke. */

import type { ReviewSlotSpec } from "./review-slots-gen";

export type ReviewGenProduct = {
  displayTitle: string;
  brand: string;
  categorySlug: string;
  audience: "men" | "women" | "any";
  formKind: string;
  context: string;
};

export type StoredReview = {
  gender: "m" | "f";
  rating: 3 | 4 | 5;
  daysAgo: number;
  age: number;
  text: string;
};

export const REVIEW_GEN_SYSTEM_CS = `Jsi copywriter zákaznických recenzí pro český e-shop Recenze Ceny.
Piš česky (cs-CZ). Odpověz jen validním JSON bez markdownu.

Pro každý slot napiš text recenze v 1. osobě.
- gender m → mužský rod (spokojen, objednal, užíval…)
- gender f → ženský rod (spokojená, objednala, užívala…)
- rating 5 → spokojený tón
- rating 4 → pozitivní tón + jedna konkrétní výhrada
- rating 3 → smíšený tón: něco funguje, něco zklamalo
Tón textu sedí s ratingem.
Piš jako zákazník z ČR uvedeného věku: konkrétní detail ze života, 2–4 věty.
Gender, rating, daysAgo a age ve výstupu zkopíruj ze slotů.`;

export function buildReviewGenUserCs(
  product: ReviewGenProduct,
  slots: ReviewSlotSpec[],
): string {
  const slotLines = slots
    .map(
      (s, i) =>
        `${i + 1}) gender=${s.gender} rating=${s.rating} daysAgo=${s.daysAgo} age=${s.age}`,
    )
    .join("\n");

  return `PRODUKT:
- název: ${product.displayTitle}
- značka: ${product.brand}
- kategorie: ${product.categorySlug}
- audience: ${product.audience}
- forma: ${product.formKind}
- kontext: ${product.context}

SLOTY:
${slotLines}

{"reviews":[{"gender":"m"|"f","rating":3|4|5,"daysAgo":number,"age":number,"text":"..."}]}`;
}

export function alignStoredReviews(
  slots: ReviewSlotSpec[],
  raw: Array<Partial<StoredReview>>,
): StoredReview[] {
  return slots.map((slot, i) => ({
    gender: slot.gender,
    rating: slot.rating,
    daysAgo: slot.daysAgo,
    age: slot.age,
    text: (raw[i]?.text ?? "").trim() || "(chybí text)",
  }));
}
