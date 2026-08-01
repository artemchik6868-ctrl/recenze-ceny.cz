/** Valid catalog shelf slugs for LLM / resolved_category_slug (excludes catch-all). */

import { classifyByText, classifyTitleFirst, KEYWORD_TO_SLUG } from "./classify";
import { normalizeCategoryShelfSlug } from "./category-slug-redirects";
import { normalizeHemorrhoidShelfSlug } from "./hemorrhoid-vocabulary.cs";
import { normalizePotencyShelfSlug } from "./potency-vocabulary.cs";

export const SHELF_SLUG_EXCLUDE = new Set(["other"]);

export const ALLOWED_SHELF_SLUGS: string[] = [
  ...new Set(KEYWORD_TO_SLUG.map(([, slug]) => slug).filter((s) => !SHELF_SLUG_EXCLUDE.has(s))),
].sort();

export function validateShelfSlug(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim().toLowerCase();
  s = normalizeCategoryShelfSlug(s) ?? s;
  s = normalizePotencyShelfSlug(s) ?? s;
  s = normalizeHemorrhoidShelfSlug(s) ?? s;
  if (SHELF_SLUG_EXCLUDE.has(s)) return null;
  return ALLOWED_SHELF_SLUGS.includes(s) ? s : null;
}

/** Deterministic re-classify from enriched title + feed (backfill hint only, not storefront truth). */
export function resolveShelfFromText(
  title: string,
  feedCategory: string,
  extra = "",
): string | null {
  const blob = `${title} ${extra} ${feedCategory}`.trim();
  const slug = classifyTitleFirst(title, `${feedCategory} ${extra}`, "other");
  if (slug !== "other") return slug;
  const broad = classifyByText(blob, "other");
  return broad !== "other" ? broad : null;
}
