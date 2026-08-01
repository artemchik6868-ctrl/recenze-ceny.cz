import type { Offer } from "@/lib/types";

function brandKey(offer: Offer): string {
  const raw = (offer.brand || offer.title || offer.slug || "").trim().toLowerCase();
  return raw || offer.slug;
}

/** Fisher–Yates shuffle (mutates copy). */
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/** Random sample of offers with unique brands. */
export function pickRandomUniqueBrandOffers(offers: Offer[], limit = 6): Offer[] {
  const seen = new Set<string>();
  const unique: Offer[] = [];
  for (const o of shuffle(offers)) {
    const key = brandKey(o);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(o);
    if (unique.length >= limit) break;
  }
  return unique;
}
