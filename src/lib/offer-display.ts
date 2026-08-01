import type { Offer } from "./types";
import {
  cleanFeedTitleWithDescriptor,
  resolveHeadlineBrand,
  sanitizeDisplayTitle,
  splitBrandAndTail,
  stripAffiliateSkuTokens,
} from "./brand-clean";
import { getCategoryDescriptor } from "./category-descriptors.cs";
import { problemRoleForShelf } from "./problem-vocabulary.cs";
import {
  joinBgDisplayTitle,
  mechanicalDescriptorToBg,
  bgFormLabel,
  translateFormFromFeedBlob,
} from "./title-translate.cs";
import { hasCyrillicLocaleLeak } from "./locale-leak-cz";

/** True when stored title is empty or equals brand only (no descriptor tail). */
export function isBrandOnlyDisplayTitle(
  title: string | null | undefined,
  brand: string,
): boolean {
  const t = title?.trim();
  const b = brand?.trim();
  if (!t) return true;
  if (!b) return false;
  if (t.toLowerCase() === b.toLowerCase()) return true;
  const prefix = `${b} —`;
  if (t.toLowerCase().startsWith(prefix.toLowerCase())) {
    return !t.slice(prefix.length).trim();
  }
  return false;
}

/** Mechanical card title (no LLM) — category/form fallback when feed tail is empty. */
export function mechanicalBgDisplayTitleFromFeed(input: {
  rawTitle: string;
  brand: string;
  categorySlug?: string;
  formKind?: string | null;
  seed?: string;
}): string | null {
  const cleaned = cleanFeedTitleWithDescriptor(input.rawTitle) || input.rawTitle;
  let { brand, tail } = splitBrandAndTail(cleaned);
  brand =
    stripAffiliateSkuTokens(brand) ||
    stripAffiliateSkuTokens(input.brand) ||
    resolveHeadlineBrand(input.brand, cleaned);
  if (!brand.trim()) return null;

  let descriptor = tail.trim() ? mechanicalDescriptorToBg(tail, { formKind: input.formKind, seed: input.seed }) : null;

  if (!descriptor?.trim() && input.categorySlug) {
    const shelf = problemRoleForShelf(input.categorySlug, "", input.formKind);
    if (shelf) descriptor = shelf;
    else {
      const cat = getCategoryDescriptor(input.categorySlug);
      descriptor = cat?.short?.trim() || cat?.long?.trim() || null;
    }
  }

  if (!descriptor?.trim() && input.formKind) {
    descriptor = bgFormLabel(input.formKind) || translateFormFromFeedBlob(input.rawTitle) || null;
  }

  if (!descriptor?.trim()) return null;
  return sanitizeDisplayTitle(joinBgDisplayTitle(brand, descriptor)) || null;
}

/** @deprecated use mechanicalBgDisplayTitleFromFeed */
export const mechanicalRoDisplayTitleFromFeed = mechanicalBgDisplayTitleFromFeed;

function safeMarketText(value: string | null | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (hasCyrillicLocaleLeak(v)) return null;
  return v;
}

/** Display title — AI display_title (legacy *_uk column) first, else mechanical CZ, else cleaned feed. */
export function offerDisplayTitle(offer: Offer): string {
  const ai = safeMarketText(offer.displayTitle);
  if (ai) return ai;

  const mechanical = mechanicalBgDisplayTitleFromFeed({
    rawTitle: offer.title,
    brand: offer.brand,
    categorySlug: offer.categorySlug,
    formKind: offer.formKind,
    seed: String(offer.id),
  });
  if (mechanical && !hasCyrillicLocaleLeak(mechanical)) return mechanical;

  const cleaned = cleanFeedTitleWithDescriptor(offer.title) || offer.title;
  if (!hasCyrillicLocaleLeak(cleaned)) return cleaned;

  // Last resort: brand-only Latin title when feed is Cyrillic.
  const brand = offer.brand?.trim();
  if (brand && !hasCyrillicLocaleLeak(brand)) return brand;
  return cleaned;
}

/** Meta benefit from AI meta_desc (legacy *_uk column). */
export function offerMetaBenefit(offer: Offer): string | null {
  return safeMarketText(offer.metaDesc);
}

/** PDP meta description: raw step-5 LLM output when available. */
export function productPageMetaDescription(
  aiMetaDesc: string | null | undefined,
): string | null {
  const raw = aiMetaDesc?.trim().replace(/\s+/g, " ");
  return safeMarketText(raw);
}

/** SEO title from AI title (legacy *_uk column). */
export function offerMetaTitle(offer: Offer): string | null {
  if (!offer.contentGeneratedAt) return null;
  return safeMarketText(offer.metaTitle);
}

/** Card subtitle from AI subtitle — only when content was generated. */
export function offerCardSubtitle(offer: Offer): string | null {
  if (!offer.contentGeneratedAt) return null;
  return safeMarketText(offer.subtitle);
}
