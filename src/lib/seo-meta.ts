// SEO title + description builders for product pages (CZ storefront).

import { getCategoryDescriptorByLang, displayTitleOverlapsCategory, type CategoryDescriptor } from "./category-descriptors";
import { firstLatinToken, normalizeProductTitle } from "./brand-clean";
import { DEFAULT_LANG, type Lang } from "./lang";
import {
  buildTitleFromSlot,
  formatPriceEUR,
  hasDisplayPrice,
  metaCtaFor,
  metaDescPartsFor,
  variantIndex,
} from "./pdp-variants";

const TITLE_MAX = 60;
const DESC_MIN = 130;
const DESC_MAX = 158;
const AI_META_DESC_MIN = 120;
const AI_META_DESC_MAX = 158;
const SLOT_COUNT = 4;

export function clipAtBoundary(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  const base = sp > Math.floor(max * 0.5) ? cut.slice(0, sp) : cut;
  return base.replace(/[\s,;:\-—|]+$/u, "");
}

export function clampDesc(s: string, min: number, max: number): string {
  const norm = s.replace(/\s+/g, " ").trim();
  if (norm.length <= max) return norm;
  const cut = norm.slice(0, max);
  const stops = [cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?")];
  const lastStop = Math.max(...stops);
  if (lastStop >= min) return cut.slice(0, lastStop + 1).trim();
  return clipAtBoundary(norm, max);
}

export type ProductMetaInput = {
  brand: string;
  feedBrand?: string;
  categorySlug: string;
  priceEUR: number | null;
  variantSeed?: number;
};

function resolveSeoBrand(input: ProductMetaInput, d: CategoryDescriptor): string {
  const feed = (input.feedBrand ?? "").trim();
  if (feed.length >= 2 && !displayTitleOverlapsCategory(feed, d)) {
    return normalizeProductTitle(feed) || feed;
  }
  const latin = firstLatinToken(input.brand, feed);
  if (latin) return latin;
  return input.brand.trim();
}

function resolveBrandParts(input: ProductMetaInput, d: CategoryDescriptor) {
  const fullHeadline = input.brand.trim();
  const headlineHasDescriptor = displayTitleOverlapsCategory(fullHeadline, d);
  const brand = headlineHasDescriptor ? fullHeadline : resolveSeoBrand(input, d);
  const skipShort =
    headlineHasDescriptor ||
    !d.short ||
    displayTitleOverlapsCategory(brand, d) ||
    displayTitleOverlapsCategory(input.brand, d);
  const short = skipShort ? "" : ` — ${d.short}`;
  return { brand, short };
}

export function buildProductTitle(input: ProductMetaInput, lang: Lang = DEFAULT_LANG): string {
  const d = getCategoryDescriptorByLang(input.categorySlug, lang);
  const { brand, short } = resolveBrandParts(input, d);
  const seed = input.variantSeed ?? 0;
  const slot = variantIndex(seed, SLOT_COUNT);
  const priced = hasDisplayPrice(input.priceEUR);
  const priceLabel = priced ? formatPriceEUR(input.priceEUR!) : "";

  const primary = buildTitleFromSlot(
    input.categorySlug,
    slot,
    priced,
    brand,
    short,
    priceLabel,
  );

  const candidates = [
    primary,
    buildTitleFromSlot(input.categorySlug, slot, priced, brand, "", priceLabel),
    priced
      ? buildTitleFromSlot(input.categorySlug, slot, false, brand, short, priceLabel)
      : brand + short,
    brand,
  ];

  for (const c of candidates) {
    if (c.length <= TITLE_MAX) return c;
  }
  return clipAtBoundary(candidates[candidates.length - 1], TITLE_MAX);
}

export function buildProductDescription(
  input: ProductMetaInput & { aiBenefit?: string | null; aiMetaDesc?: string | null },
  lang: Lang = DEFAULT_LANG,
): string {
  const aiFull = (input.aiMetaDesc ?? "").trim().replace(/\s+/g, " ");
  if (aiFull.length >= AI_META_DESC_MIN && aiFull.length <= AI_META_DESC_MAX) {
    return aiFull;
  }

  const d = getCategoryDescriptorByLang(input.categorySlug, lang);
  const { brand, short } = resolveBrandParts(input, d);
  const aiBenefit = (input.aiBenefit ?? "").trim().replace(/\.+$/, "");
  const benefit =
    aiBenefit.length >= 20 && aiBenefit.length <= AI_META_DESC_MAX ? aiBenefit : d.problem;
  const seed = input.variantSeed ?? 0;
  const slot = variantIndex(seed, SLOT_COUNT);
  const priced = hasDisplayPrice(input.priceEUR);
  const priceLabel = priced ? formatPriceEUR(input.priceEUR!) : "";
  const cta = metaCtaFor(input.categorySlug, slot, priced, priceLabel);

  const hasInlineDescriptor = /\s[—–-]\s/.test(input.brand.trim());
  const brandLine =
    hasInlineDescriptor || short === "" ? brand : `${brand}${short}`;

  const parts = metaDescPartsFor(
    input.categorySlug,
    slot,
    priced,
    brandLine,
    benefit,
    priceLabel,
    cta,
  );
  const fits = (p: string[]) => p.join(" ").length <= DESC_MAX;

  for (let drop = 0; drop < parts.length; drop++) {
    const trimmed = parts.slice(0, parts.length - drop);
    if (trimmed.length >= 2 && fits(trimmed)) return trimmed.join(" ");
  }
  for (let drop = 0; drop < parts.length; drop++) {
    const trimmed = parts.slice(0, parts.length - drop);
    if (fits(trimmed)) return trimmed.join(" ");
  }
  return clampDesc(parts[0], DESC_MIN, DESC_MAX);
}

/** Hybrid meta: full AI meta_desc when length fits SERP; else template + AI benefit snippet. */
export function resolveProductMetaDescription(
  input: ProductMetaInput & { aiBenefit?: string | null; aiMetaDesc?: string | null },
  lang: Lang = DEFAULT_LANG,
): string {
  return buildProductDescription(input, lang);
}
