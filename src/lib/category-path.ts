import { categorySlugRedirectTarget } from "@/lib/category-slug-redirects";

/** Canonical category hub path: `/{slug}` (not `/category/{slug}`). */
export function canonicalCategorySlug(slug: string): string {
  return categorySlugRedirectTarget(slug) ?? slug;
}

/** Path for a single category page, e.g. `/klouby`. */
export function categoryPath(slug: string): string {
  return `/${canonicalCategorySlug(slug)}`;
}
