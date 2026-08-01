// SEO-friendly slug generator with UA/RU → ASCII transliteration.
// Used by all 4 sync modules to produce stable, readable product slugs
// like "neoprostan-kapsuly" instead of "offer-16559-g16559".

import { firstLatinToken } from "./brand-clean";

export type OfferSource = "cpa_tl" | "kma" | "m1_top" | "cpagetti" | "adcombo" | "shakes";

const SOURCE_SUFFIX: Record<OfferSource, string> = {
  cpagetti: "g",
  kma: "k",
  m1_top: "m",
  cpa_tl: "",
  adcombo: "a",
  shakes: "s",
};

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye",
  ж: "zh", з: "z", и: "y", і: "i", ї: "yi", й: "y", к: "k", л: "l",
  м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "",
  ы: "y", ь: "", э: "e", ю: "yu", я: "ya", ё: "yo",
};

const STOP_WORDS = new Set([
  "dlya", "dla", "dlja", "the", "for", "from", "and", "with", "by",
  "ot", "ta", "i", "v", "na", "po", "do", "iz", "k",
  "premium", "pro", "plus", "max", "extra", "ultra", "new", "top",
]);

function transliterate(input: string): string {
  let out = "";
  for (const ch of input.toLowerCase()) {
    out += TRANSLIT[ch] ?? ch;
  }
  return out;
}

/** Lowercase ASCII transliteration for fuzzy brand/tail comparison. */
export function transliterateAscii(input: string): string {
  return transliterate(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/** Build an SEO-friendly slug. */
export function makeSlug(input: string, fallback: string): string {
  const translit = transliterate(input);
  const ascii = translit
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!ascii) return fallback;
  // Drop stop-words but keep at least one segment.
  const parts = ascii.split("-").filter((p) => p && !STOP_WORDS.has(p));
  const cleaned = (parts.length > 0 ? parts : ascii.split("-")).join("-");
  // Trim to 60 chars at word boundary.
  if (cleaned.length <= 60) return cleaned;
  const cut = cleaned.slice(0, 60);
  const lastDash = cut.lastIndexOf("-");
  return lastDash > 20 ? cut.slice(0, lastDash) : cut;
}

function legacySlugBase(brand: string, offerId: number): string {
  return makeSlug(brand, `offer-${offerId}`);
}

function withSourceSuffix(base: string, offerId: number, source: OfferSource): string {
  const sfx = SOURCE_SUFFIX[source];
  return sfx ? `${base}-${sfx}${offerId}` : `${base}-${offerId}`;
}

/** Latin-brand-first slug (SEO-friendly when feed has Latin tokens). */
export function buildProductSlug(input: {
  title: string;
  brand: string;
  offerId: number;
  source: OfferSource;
}): string {
  const latinBrand = firstLatinToken(input.title, input.brand);
  const base = latinBrand
    ? makeSlug(latinBrand, `offer-${input.offerId}`)
    : legacySlugBase(input.brand, input.offerId);
  return withSourceSuffix(base, input.offerId, input.source);
}

/** Alias used by sync loaders — always Latin-first for the full catalogue. */
export function resolveOfferSlug(input: {
  title: string;
  brand: string;
  offerId: number;
  source: OfferSource;
}): string {
  return buildProductSlug(input);
}

/** SEO slug from RO display title when sync slug is Cyrillic-translit descriptor. */
export function seoSlugFromRoTitle(
  displayTitle: string,
  brand: string,
  offerId: number,
  source: OfferSource,
): string {
  const trimmed = displayTitle.trim();
  if (!trimmed) return resolveOfferSlug({ title: brand, brand, offerId, source });

  const latinBrand = firstLatinToken(trimmed, brand);
  if (latinBrand && trimmed.split(/\s*[—–-]\s*/)[0]?.trim().split(/\s+/).length === 1) {
    return buildProductSlug({ title: trimmed, brand: latinBrand, offerId, source });
  }

  const dashParts = trimmed.split(/\s*[—–-]\s*/);
  const primary = (dashParts[0] ?? trimmed).trim();
  const base = makeSlug(primary, `offer-${offerId}`);
  return withSourceSuffix(base, offerId, source);
}

/** True when sync slug looks like full-title Cyrillic translit, not a short brand token. */
export function shouldPreferRoDerivedSlug(
  syncSlug: string,
  displayTitle: string | null | undefined,
  brand: string,
): boolean {
  if (!displayTitle?.trim()) return false;

  const latinBrand = firstLatinToken(displayTitle, brand) || firstLatinToken(brand, brand);
  if (latinBrand) {
    const brandPrefix = makeSlug(latinBrand, "");
    if (brandPrefix && syncSlug.startsWith(`${brandPrefix}-`)) return false;
  }

  const base = syncSlug.replace(/-[kmgast]\d+$/, "").replace(/-\d+$/, "");
  return base.split("-").filter(Boolean).length >= 3;
}

/** Ensure slug uniqueness within a list: duplicates get -2, -3 suffixes. */
export function dedupeSlugs<T extends { slug: string; id: number }>(items: T[]): T[] {
  const seen = new Map<string, number>();
  return items.map((it) => {
    const n = (seen.get(it.slug) ?? 0) + 1;
    seen.set(it.slug, n);
    if (n === 1) return it;
    return { ...it, slug: `${it.slug}-${n}` };
  });
}
