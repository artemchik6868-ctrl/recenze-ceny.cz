import type { Offer } from "./types";
import { isProductIndexable } from "./index-policy";

export function hasDisplayableProductImage(o: Offer): boolean {
  return Boolean(o.image);
}

/** Legacy Uk/Ru field names that must never appear in SSR / client Offer JSON. */
const LEGACY_LOCALE_KEYS = [
  "metaTitleUk",
  "metaDescUk",
  "metaDescRu",
  "subtitleUk",
  "displayTitleUk",
  "displayTitleRu",
] as const;

/**
 * Strip server-only partner classify blobs and legacy Uk/Ru field names
 * before dehydrate / client payloads. Keeps RU/UA labels out of SSR HTML
 * crawlers see.
 */
export function offerForClient(offer: Offer): Offer {
  const rest = { ...offer } as Offer & Record<string, unknown>;
  delete rest.feedClassifyText;
  for (const key of LEGACY_LOCALE_KEYS) {
    delete rest[key];
  }
  return rest;
}

export function offersForClient(offers: Offer[]): Offer[] {
  return offers.map(offerForClient);
}

/** Homepage featured block: indexable offers, unique brands, newest first. */
export function pickFeaturedOffers(offers: Offer[], limit = 8): Offer[] {
  const sorted = [...offers].filter(isProductIndexable).sort((a, b) =>
    a.firstSeenAt > b.firstSeenAt ? -1 : a.firstSeenAt < b.firstSeenAt ? 1 : 0,
  );
  const seenBrands = new Set<string>();
  const result: Offer[] = [];
  for (const o of sorted) {
    const brandKey = (o.brand || o.title || "").toLowerCase().trim();
    if (brandKey && seenBrands.has(brandKey)) continue;
    if (brandKey) seenBrands.add(brandKey);
    result.push(o);
    if (result.length >= limit) break;
  }
  return result;
}
