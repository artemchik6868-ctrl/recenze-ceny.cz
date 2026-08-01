/** Hemorrhoids shelf — single source for slug, category name, and legacy redirect. */

export const HEMORRHOID_SLUG = "hemoroidy";
export const HEMORRHOID_SLUG_LEGACY = "intimate-comfort";
/** Pre-CZ-SEO English shelf slug. */
export const HEMORRHOID_SLUG_LEGACY_EN = "hemorrhoids";
export const HEMORRHOID_CATEGORY_NAME = "Hemoroidy";

const LEGACY_SLUG_MAP: Record<string, string> = {
  [HEMORRHOID_SLUG_LEGACY]: HEMORRHOID_SLUG,
  [HEMORRHOID_SLUG_LEGACY_EN]: HEMORRHOID_SLUG,
};

/** Map stale DB / feed slugs to canonical shelf slug. */
export function normalizeHemorrhoidShelfSlug(slug: string | null | undefined): string | null {
  if (!slug?.trim()) return null;
  const s = slug.trim();
  return LEGACY_SLUG_MAP[s] ?? s;
}
