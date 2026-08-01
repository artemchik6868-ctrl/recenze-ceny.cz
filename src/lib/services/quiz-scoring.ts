/**
 * Rule-based scoring for the weight-management supplement quiz.
 * Maps wizard answers → tags → keyword hits on offer text.
 */

import type { Offer } from "@/lib/types";
import { offerDisplayTitle } from "@/lib/offer-display";
import { isProductIndexable } from "@/lib/index-policy";

export type QuizGoal = "lose_weight" | "edema" | "appetite" | "metabolism";
export type QuizObstacle = "evening_stress" | "sedentary" | "fatigue" | "water_retention";
export type QuizExtra = "skin_hair" | "sleep" | "detox";
export type QuizActivity = "minimal" | "training";

export type QuizAnswers = {
  goal: QuizGoal;
  obstacle: QuizObstacle;
  extras: QuizExtra[];
  activity: QuizActivity;
};

export type QuizTag =
  | "appetite"
  | "edema"
  | "metabolism"
  | "stress"
  | "energy"
  | "skin"
  | "sleep"
  | "detox"
  | "activity"
  | "fiber";

const GOAL_TAGS: Record<QuizGoal, QuizTag[]> = {
  lose_weight: ["appetite", "metabolism", "fiber"],
  edema: ["edema", "detox"],
  appetite: ["appetite", "fiber"],
  metabolism: ["metabolism", "energy"],
};

const OBSTACLE_TAGS: Record<QuizObstacle, QuizTag[]> = {
  evening_stress: ["stress", "appetite"],
  sedentary: ["metabolism", "activity"],
  fatigue: ["energy", "metabolism"],
  water_retention: ["edema", "detox"],
};

const EXTRA_TAGS: Record<QuizExtra, QuizTag[]> = {
  skin_hair: ["skin"],
  sleep: ["sleep"],
  detox: ["detox"],
};

const ACTIVITY_TAGS: Record<QuizActivity, QuizTag[]> = {
  minimal: ["fiber", "appetite"],
  training: ["activity", "energy", "metabolism"],
};

/** Czech + Latin keyword bags per tag (title/subtitle matching). */
const TAG_KEYWORDS: Record<QuizTag, string[]> = {
  appetite: [
    "chuť",
    "hlad",
    "sytost",
    "apetit",
    "tlumič",
    "garcinie",
    "vláknina",
    "fiber",
    "appetite",
    "hunger",
  ],
  edema: ["otok", "otek", "odvodně", "voda", "lymf", "dren", "edema", "water", "reten"],
  metabolism: [
    "metabol",
    "spalovač",
    "tuk",
    "termogen",
    "karnitin",
    "carnitin",
    "green tea",
    "zelený čaj",
    "fat burn",
  ],
  stress: ["stres", "klid", "ashwagandha", "stress", "relax", "magnez", "magnes"],
  energy: ["energie", "unava", "únava", "vital", "kofein", "caffeine", "energy", "stimul"],
  skin: ["pleť", "plet", "vlasy", "kolagen", "skin", "hair", "beauty", "biotín", "biotin"],
  sleep: ["spánek", "spanek", "melatonin", "sleep", "noční", "nocni"],
  detox: ["detox", "očist", "ocist", "játra", "jatra", "čistění", "cisteni", "cleanse"],
  activity: ["sport", "výkon", "vykon", "tréning", "trenink", "workout", "l-karnitin"],
  fiber: ["vláknina", "vlaknina", "fiber", "psyllium", "glucomannan", "sytost"],
};

export function tagsFromAnswers(answers: QuizAnswers): QuizTag[] {
  const set = new Set<QuizTag>();
  for (const t of GOAL_TAGS[answers.goal]) set.add(t);
  for (const t of OBSTACLE_TAGS[answers.obstacle]) set.add(t);
  for (const extra of answers.extras) {
    for (const t of EXTRA_TAGS[extra]) set.add(t);
  }
  for (const t of ACTIVITY_TAGS[answers.activity]) set.add(t);
  return [...set];
}

function offerSearchBlob(offer: Offer): string {
  return [
    offer.title,
    offer.brand,
    offer.subtitle,
    offer.displayTitle,
    offer.formKind,
    offerDisplayTitle(offer),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function scoreOffer(offer: Offer, tags: QuizTag[]): number {
  const blob = offerSearchBlob(offer);
  let score = 0;
  for (const tag of tags) {
    const hits = TAG_KEYWORDS[tag].filter((kw) => blob.includes(kw.toLowerCase()));
    if (hits.length) score += 2 + Math.min(hits.length - 1, 2);
  }
  // Mild boost for same shelf
  if (offer.categorySlug === "hubnuti") score += 1;
  if (offer.categorySlug === "detox" && tags.includes("edema")) score += 2;
  if (offer.categorySlug === "detox" && tags.includes("detox")) score += 2;
  return score;
}

export type ScoredOffer = {
  offer: Offer;
  score: number;
  matchedTags: QuizTag[];
};

function brandKey(offer: Offer): string {
  const raw = (offer.brand || offer.title || offer.slug || "").trim().toLowerCase();
  return raw || offer.slug;
}

/** Prefer higher scores; keep first occurrence of each brand. */
function pickUniqueBrands(scored: ScoredOffer[], limit: number): ScoredOffer[] {
  const seen = new Set<string>();
  const out: ScoredOffer[] = [];
  for (const item of scored) {
    const key = brandKey(item.offer);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

export function recommendOffers(offers: Offer[], answers: QuizAnswers, limit = 6): ScoredOffer[] {
  const tags = tagsFromAnswers(answers);
  const visible = offers.filter(isProductIndexable);
  const scored: ScoredOffer[] = visible.map((offer) => {
    const score = scoreOffer(offer, tags);
    const matchedTags = tags.filter((tag) => {
      const blob = offerSearchBlob(offer);
      return TAG_KEYWORDS[tag].some((kw) => blob.includes(kw.toLowerCase()));
    });
    return { offer, score, matchedTags };
  });

  scored.sort((a, b) => b.score - a.score || a.offer.slug.localeCompare(b.offer.slug));

  const withScore = pickUniqueBrands(
    scored.filter((s) => s.score > 0),
    limit,
  );
  if (withScore.length >= limit) return withScore;

  // Fill remaining slots from the rest of the pool (still unique brands).
  const usedBrands = new Set(withScore.map((s) => brandKey(s.offer)));
  const filler = pickUniqueBrands(
    scored.filter((s) => !usedBrands.has(brandKey(s.offer))),
    limit - withScore.length,
  );
  return [...withScore, ...filler];
}

export function needsDetoxShelf(answers: QuizAnswers): boolean {
  const tags = tagsFromAnswers(answers);
  return tags.includes("edema") || tags.includes("detox");
}
