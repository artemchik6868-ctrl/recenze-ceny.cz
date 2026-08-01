/** Category audience, age ranges, and seeded review slots for LLM generation. */

export type Gender = "m" | "f";
export type Audience = "men" | "women" | "any";
export type AgeRange = { min: number; max: number };

export type ReviewSlotSpec = {
  gender: Gender;
  rating: 3 | 4 | 5;
  daysAgo: number;
  age: number;
};

const CATEGORY_AUDIENCE: Record<string, Audience> = {
  "potence": "men",
  "prostata": "men",
  "zvetseni-penisu": "men",
  "zdravi-zen": "women",
  cystitida: "women",
  "zvetseni-prsou": "women",
};

/** Soft gender mix ratios for `any` shelves (scaled to slot count). */
const CATEGORY_GENDER_BIAS: Record<string, { f: number; m: number }> = {
  "hubnuti": { f: 4, m: 1 },
  "krecove-zily": { f: 4, m: 1 },
  "anti-aging": { f: 4, m: 1 },
  "vypadavani-vlasu": { f: 3, m: 2 },
  "vboceny-palec": { f: 4, m: 1 },
};

const DEFAULT_AGE: AgeRange = { min: 30, max: 60 };

export const CATEGORY_AGE_RANGE: Record<string, AgeRange> = {
  "krevni-tlak": { min: 50, max: 72 },
  "cukrovka": { min: 45, max: 70 },
  "prostata": { min: 48, max: 72 },
  "potence": { min: 35, max: 60 },
  "zvetseni-penisu": { min: 28, max: 55 },
  "klouby": { min: 45, max: 70 },
  "krecove-zily": { min: 40, max: 68 },
  "zrak": { min: 40, max: 70 },
  sluch: { min: 50, max: 75 },
  hemoroidy: { min: 35, max: 65 },
  cystitida: { min: 25, max: 55 },
  "zdravi-zen": { min: 28, max: 55 },
  "zvetseni-prsou": { min: 25, max: 50 },
  "hubnuti": { min: 28, max: 55 },
  "stres": { min: 30, max: 60 },
  traveni: { min: 30, max: 65 },
  "plisen-nehtu": { min: 30, max: 65 },
  paraziti: { min: 25, max: 55 },
  "detox": { min: 25, max: 55 },
  "jatra": { min: 35, max: 65 },
  "ledviny": { min: 35, max: 65 },
  "dychaci-cesty": { min: 30, max: 65 },
  imunita: { min: 25, max: 60 },
  "chrapani": { min: 35, max: 65 },
  lupenka: { min: 25, max: 60 },
  papilomy: { min: 25, max: 55 },
  alkoholismus: { min: 30, max: 60 },
  "odvykani-koureni": { min: 25, max: 60 },
  "vboceny-palec": { min: 35, max: 65 },
  "anti-aging": { min: 35, max: 60 },
  "vypadavani-vlasu": { min: 28, max: 60 },
  _default: DEFAULT_AGE,
};

export function audienceFor(categorySlug?: string | null): Audience {
  if (!categorySlug) return "any";
  return CATEGORY_AUDIENCE[categorySlug] ?? "any";
}

export function ageRangeFor(categorySlug?: string | null): AgeRange {
  if (!categorySlug) return CATEGORY_AGE_RANGE._default ?? DEFAULT_AGE;
  return CATEGORY_AGE_RANGE[categorySlug] ?? CATEGORY_AGE_RANGE._default ?? DEFAULT_AGE;
}

export function seededRng(offerId: number, salt: number): () => number {
  let s = offerId * 9301 + 49297 + salt;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Seeded review count in [3, 10] — stable across retries/backfill. */
export function reviewCountFor(offerId: number): number {
  return 3 + Math.floor(seededRng(offerId, 17)() * 8);
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** ~40% fives, ~40% fours, rest threes. */
function ratingsForCount(count: number, rnd: () => number): Array<3 | 4 | 5> {
  const fives = Math.max(1, Math.round(count * 0.4));
  const fours = Math.max(1, Math.round(count * 0.4));
  let threes = count - fives - fours;
  if (threes < 0) {
    // trim fives first when rounding overshoots
    const over = -threes;
    const trimFives = Math.min(over, Math.max(0, fives - 1));
    const rest = over - trimFives;
    const ratings: Array<3 | 4 | 5> = [
      ...Array.from({ length: fives - trimFives }, () => 5 as const),
      ...Array.from({ length: Math.max(0, fours - rest) }, () => 4 as const),
    ];
    while (ratings.length < count) ratings.push(4);
    return shuffle(ratings.slice(0, count), rnd);
  }
  const ratings: Array<3 | 4 | 5> = [
    ...Array.from({ length: fives }, () => 5 as const),
    ...Array.from({ length: fours }, () => 4 as const),
    ...Array.from({ length: threes }, () => 3 as const),
  ];
  return shuffle(ratings, rnd);
}

function daysForCount(count: number, rnd: () => number): number[] {
  const pool = Array.from({ length: Math.max(count, 10) }, (_, i) => 6 + i * 7);
  return shuffle(pool, rnd).slice(0, count);
}

function gendersForSlots(
  categorySlug: string | null | undefined,
  count: number,
  rnd: () => number,
): Gender[] {
  const audience = audienceFor(categorySlug);
  if (audience === "men") return Array.from({ length: count }, () => "m");
  if (audience === "women") return Array.from({ length: count }, () => "f");

  const bias = categorySlug ? CATEGORY_GENDER_BIAS[categorySlug] : undefined;
  if (bias) {
    const total = bias.f + bias.m;
    let fCount = Math.round((bias.f / total) * count);
    let mCount = count - fCount;
    if (count >= 2) {
      if (fCount === 0) {
        fCount = 1;
        mCount = count - 1;
      } else if (mCount === 0) {
        mCount = 1;
        fCount = count - 1;
      }
    }
    const genders: Gender[] = [
      ...Array.from({ length: fCount }, () => "f" as const),
      ...Array.from({ length: mCount }, () => "m" as const),
    ];
    return shuffle(genders.slice(0, count), rnd);
  }

  return Array.from({ length: count }, (_, i) => (i % 2 === 0 ? "m" : "f"));
}

/** Seeded N-slot mix (N = count ?? reviewCountFor(offerId)). */
export function buildReviewSlots(
  offerId: number,
  categorySlug?: string | null,
  count?: number,
): ReviewSlotSpec[] {
  const n = count ?? reviewCountFor(offerId);
  const rnd = seededRng(offerId, 7);
  const agesRnd = seededRng(offerId, 11);
  const range = ageRangeFor(categorySlug);
  const ratings = ratingsForCount(n, rnd);
  const days = daysForCount(n, rnd);
  const genders = gendersForSlots(categorySlug, n, seededRng(offerId, 13));

  const slots: ReviewSlotSpec[] = [];
  for (let i = 0; i < n; i++) {
    const span = Math.max(0, range.max - range.min);
    const age = range.min + Math.floor(agesRnd() * (span + 1));
    slots.push({
      gender: genders[i] ?? "m",
      rating: ratings[i] ?? 5,
      daysAgo: days[i] ?? 10 + i * 7,
      age,
    });
  }
  return slots;
}
