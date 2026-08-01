import type { Lang } from "@/lib/lang";
import { POOL_BG, POOL_DE, POOL_IT, POOL_RO } from "./reviews-legacy-pools";
import {
  audienceFor,
  ageRangeFor,
  buildReviewSlots,
  reviewCountFor,
  seededRng,
  type Audience,
  type Gender,
} from "./review-slots-gen";
import type { StoredReview } from "./review-gen-prompt.cs";

export type { Gender, Audience };
export { audienceFor, ageRangeFor, buildReviewSlots, reviewCountFor };

export type Review = {
  name: string;
  city: string;
  age: number;
  photo: string | null;
  gender: Gender;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  daysAgo: number;
  verified: boolean;
};

const avatar = (id: string) => `/reviews/${id}.webp`;
const r1 = avatar("r1"), r2 = avatar("r2"), r3 = avatar("r3"), r4 = avatar("r4"), r5 = avatar("r5");
const r6 = avatar("r6"), r7 = avatar("r7"), r8 = avatar("r8"), r9 = avatar("r9"), r10 = avatar("r10");
const r11 = avatar("r11"), r12 = avatar("r12"), r13 = avatar("r13"), r14 = avatar("r14"), r15 = avatar("r15"), r16 = avatar("r16");
const f1 = avatar("f1"), f2 = avatar("f2"), f3 = avatar("f3"), f4 = avatar("f4"), f5 = avatar("f5"), f6 = avatar("f6"), f7 = avatar("f7");
const f8 = avatar("f8"), f9 = avatar("f9"), f10 = avatar("f10"), f11 = avatar("f11"), f12 = avatar("f12"), f13 = avatar("f13"), f14 = avatar("f14"), f15 = avatar("f15"), f16 = avatar("f16");
const m1 = avatar("m1"), m2 = avatar("m2"), m3 = avatar("m3"), m4 = avatar("m4"), m5 = avatar("m5"), m6 = avatar("m6"), m7 = avatar("m7");
const m8 = avatar("m8"), m9 = avatar("m9"), m10 = avatar("m10"), m11 = avatar("m11"), m12 = avatar("m12"), m13 = avatar("m13"), m14 = avatar("m14"), m15 = avatar("m15"), m16 = avatar("m16");

/** 48 personas — 24F + 24M, Czech market cities. Name/city/photo only for LLM reviews. */
const POOL_CS: Review[] = [
  { name: "Elena R.", city: "Praha", age: 52, photo: r1, gender: "f", rating: 5, text: "", daysAgo: 6, verified: true },
  { name: "Marie M.", city: "Brno", age: 38, photo: f1, gender: "f", rating: 5, text: "", daysAgo: 3, verified: true },
  { name: "Julie S.", city: "Ostrava", age: 58, photo: r3, gender: "f", rating: 5, text: "", daysAgo: 9, verified: true },
  { name: "Andrea P.", city: "Plzeň", age: 42, photo: f2, gender: "f", rating: 5, text: "", daysAgo: 5, verified: true },
  { name: "Anna G.", city: "Olomouc", age: 60, photo: r5, gender: "f", rating: 5, text: "", daysAgo: 7, verified: true },
  { name: "Sofie D.", city: "Liberec", age: 47, photo: f3, gender: "f", rating: 5, text: "", daysAgo: 28, verified: true },
  { name: "Valerie N.", city: "České Budějovice", age: 44, photo: r7, gender: "f", rating: 4, text: "", daysAgo: 15, verified: true },
  { name: "Sofie Z.", city: "Hradec Králové", age: 39, photo: f4, gender: "f", rating: 5, text: "", daysAgo: 19, verified: true },
  { name: "Marta L.", city: "Pardubice", age: 46, photo: f5, gender: "f", rating: 5, text: "", daysAgo: 4, verified: true },
  { name: "Laura G.", city: "Zlín", age: 51, photo: f6, gender: "f", rating: 4, text: "", daysAgo: 21, verified: true },
  { name: "Klara B.", city: "Kladno", age: 45, photo: f7, gender: "f", rating: 5, text: "", daysAgo: 33, verified: true },
  { name: "Ester K.", city: "Most", age: 41, photo: f8, gender: "f", rating: 5, text: "", daysAgo: 12, verified: true },
  { name: "Ildiko T.", city: "Opava", age: 55, photo: f9, gender: "f", rating: 4, text: "", daysAgo: 24, verified: true },
  { name: "Rebeka H.", city: "Karviná", age: 36, photo: f10, gender: "f", rating: 5, text: "", daysAgo: 8, verified: true },
  { name: "Gabriela F.", city: "Frýdek-Místek", age: 49, photo: f11, gender: "f", rating: 5, text: "", daysAgo: 17, verified: true },
  { name: "Nikola V.", city: "Jihlava", age: 44, photo: f12, gender: "f", rating: 5, text: "", daysAgo: 11, verified: true },
  { name: "Eliska W.", city: "Teplice", age: 53, photo: f13, gender: "f", rating: 4, text: "", daysAgo: 29, verified: true },
  { name: "Kinga J.", city: "Chomutov", age: 40, photo: f14, gender: "f", rating: 5, text: "", daysAgo: 14, verified: true },
  { name: "Agnes P.", city: "Ústí nad Labem", age: 57, photo: f15, gender: "f", rating: 5, text: "", daysAgo: 6, verified: true },
  { name: "Viktoria S.", city: "Havířov", age: 43, photo: f16, gender: "f", rating: 5, text: "", daysAgo: 22, verified: true },
  { name: "Katerina O.", city: "Mladá Boleslav", age: 43, photo: r9, gender: "f", rating: 4, text: "", daysAgo: 18, verified: true },
  { name: "Edit C.", city: "Praha", age: 50, photo: r11, gender: "f", rating: 5, text: "", daysAgo: 10, verified: true },
  { name: "Anika L.", city: "Brno", age: 48, photo: r13, gender: "f", rating: 5, text: "", daysAgo: 16, verified: true },
  { name: "Tereza M.", city: "Plzeň", age: 54, photo: r15, gender: "f", rating: 4, text: "", daysAgo: 27, verified: true },

  { name: "Petr H.", city: "Opava", age: 65, photo: r2, gender: "m", rating: 5, text: "", daysAgo: 12, verified: true },
  { name: "Michal T.", city: "Chomutov", age: 45, photo: m1, gender: "m", rating: 4, text: "", daysAgo: 18, verified: true },
  { name: "Ivan L.", city: "Ústí nad Labem", age: 70, photo: r4, gender: "m", rating: 5, text: "", daysAgo: 22, verified: true },
  { name: "Ondrej V.", city: "Jihlava", age: 55, photo: m2, gender: "m", rating: 4, text: "", daysAgo: 14, verified: true },
  { name: "Robert F.", city: "Most", age: 48, photo: r6, gender: "m", rating: 5, text: "", daysAgo: 11, verified: true },
  { name: "Daniel C.", city: "Frýdek-Místek", age: 53, photo: m5, gender: "m", rating: 5, text: "", daysAgo: 26, verified: true },
  { name: "Pavel R.", city: "Teplice", age: 50, photo: m6, gender: "m", rating: 5, text: "", daysAgo: 8, verified: true },
  { name: "Sandor M.", city: "Havířov", age: 61, photo: m3, gender: "m", rating: 4, text: "", daysAgo: 31, verified: true },
  { name: "Sergej B.", city: "Kladno", age: 57, photo: m4, gender: "m", rating: 5, text: "", daysAgo: 33, verified: true },
  { name: "Filip D.", city: "Mladá Boleslav", age: 49, photo: m7, gender: "m", rating: 5, text: "", daysAgo: 16, verified: true },
  { name: "Gabor N.", city: "Olomouc", age: 46, photo: m8, gender: "m", rating: 5, text: "", daysAgo: 13, verified: true },
  { name: "Tomas K.", city: "Ostrava", age: 52, photo: m9, gender: "m", rating: 4, text: "", daysAgo: 20, verified: true },
  { name: "Balazs E.", city: "Praha", age: 48, photo: m10, gender: "m", rating: 5, text: "", daysAgo: 9, verified: true },
  { name: "Ladislav U.", city: "Brno", age: 63, photo: m11, gender: "m", rating: 5, text: "", daysAgo: 25, verified: true },
  { name: "Zoltan A.", city: "Plzeň", age: 44, photo: m12, gender: "m", rating: 4, text: "", daysAgo: 7, verified: true },
  { name: "Josef I.", city: "Liberec", age: 58, photo: m13, gender: "m", rating: 5, text: "", daysAgo: 30, verified: true },
  { name: "Attila Y.", city: "České Budějovice", age: 51, photo: m14, gender: "m", rating: 5, text: "", daysAgo: 15, verified: true },
  { name: "Csaba O.", city: "Hradec Králové", age: 54, photo: m15, gender: "m", rating: 4, text: "", daysAgo: 23, verified: true },
  { name: "Norbert Q.", city: "Zlín", age: 47, photo: m16, gender: "m", rating: 5, text: "", daysAgo: 5, verified: true },
  { name: "Ferenc X.", city: "Pardubice", age: 50, photo: r8, gender: "m", rating: 5, text: "", daysAgo: 19, verified: true },
  { name: "Imre Z.", city: "Karviná", age: 55, photo: r10, gender: "m", rating: 4, text: "", daysAgo: 28, verified: true },
  { name: "Bela O.", city: "Jihlava", age: 56, photo: r12, gender: "m", rating: 5, text: "", daysAgo: 17, verified: true },
  { name: "Jiri U.", city: "Teplice", age: 59, photo: r14, gender: "m", rating: 5, text: "", daysAgo: 21, verified: true },
  { name: "Antal U.", city: "Chomutov", age: 62, photo: r16, gender: "m", rating: 4, text: "", daysAgo: 32, verified: true },
];

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function parseStoredReviews(raw: unknown): StoredReview[] {
  if (!Array.isArray(raw)) return [];
  const out: StoredReview[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const gender = r.gender === "f" ? "f" : r.gender === "m" ? "m" : null;
    const rating = Number(r.rating);
    const daysAgo = Number(r.daysAgo);
    const age = Number(r.age);
    const text = typeof r.text === "string" ? r.text.trim() : "";
    if (!gender || !text) continue;
    if (![3, 4, 5].includes(rating)) continue;
    if (!Number.isFinite(daysAgo) || !Number.isFinite(age)) continue;
    out.push({
      gender,
      rating: rating as 3 | 4 | 5,
      daysAgo: Math.max(0, Math.round(daysAgo)),
      age: Math.max(18, Math.min(90, Math.round(age))),
      text,
    });
  }
  return out;
}

/**
 * Assemble UI reviews from stored LLM rows + persona pool (name/city/photo).
 * Age/rating/text come from stored rows — not persona ages.
 */
export function pickReviewsFromStored(
  offerId: number,
  stored: unknown,
  lang: Lang = "cs",
): Review[] {
  const rows = parseStoredReviews(stored);
  if (!rows.length) return [];

  const personas = lang === "cs" ? POOL_CS : POOL_IT;
  const malePool = shuffle(
    personas.filter((p) => p.gender === "m"),
    seededRng(offerId, 1),
  );
  const femalePool = shuffle(
    personas.filter((p) => p.gender === "f"),
    seededRng(offerId, 2),
  );
  const usedPhotos = new Set<string>();
  let mi = 0;
  let fi = 0;
  const out: Review[] = [];

  for (const row of rows) {
    const queue = row.gender === "m" ? malePool : femalePool;
    const cursor = () => (row.gender === "m" ? mi : fi);
    const advance = () => {
      if (row.gender === "m") mi++;
      else fi++;
    };
    let p: Review | undefined;
    while (cursor() < queue.length) {
      const cand = queue[cursor()];
      advance();
      if (cand.photo && usedPhotos.has(cand.photo)) continue;
      p = cand;
      break;
    }
    if (!p) continue;
    if (p.photo) usedPhotos.add(p.photo);
    out.push({
      name: p.name,
      city: p.city,
      age: row.age,
      gender: row.gender,
      verified: true,
      rating: row.rating,
      daysAgo: row.daysAgo,
      text: row.text,
      photo: p.photo,
    });
  }
  return out;
}

/** @deprecated Use pickReviewsFromStored — template slots removed. */
export function pickReviews(
  offerId: number,
  _count: number,
  lang: Lang = "cs",
  _audience: Audience = "any",
  _categorySlug?: string,
  stored?: unknown,
): Review[] {
  return pickReviewsFromStored(offerId, stored ?? [], lang);
}

export function averageRating(reviews: Review[]): number | null {
  if (!reviews.length) return null;
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export { POOL_CS, POOL_CS as POOL_HU, POOL_BG, POOL_DE, POOL_IT, POOL_RO };
