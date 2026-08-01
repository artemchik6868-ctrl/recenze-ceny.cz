import type { Offer } from "@/lib/types";

/**
 * Catalog indexation is always-on for any offer with a public PDP path.
 * Content readiness (AI body, category resolution, "other") does NOT gate robots/sitemap.
 * Real 404s still use notFoundHead() → noindex.
 */
export function isProductIndexable(o: Offer): boolean {
  return Boolean(o.categorySlug && o.slug);
}

/** Category / guide hubs are always indexable (including empty grids). */
export function isCategoryIndexable(_count: number): boolean {
  return true;
}

export function robotsNoindexMeta(indexable: boolean): { name: string; content: string } | null {
  return indexable ? null : { name: "robots", content: "noindex, follow" };
}

/** Offer counts per category slug (indexable products only). */
export function indexableOffersByCategory(offers: Offer[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const o of offers) {
    if (!isProductIndexable(o) || !o.categorySlug) continue;
    counts.set(o.categorySlug, (counts.get(o.categorySlug) ?? 0) + 1);
  }
  return counts;
}
