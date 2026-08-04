/** Shared blog types and path helpers (no DB I/O). */

import { BLOG_PATH } from "@/lib/site";
import type { Offer, OfferSource } from "@/lib/types";

export type BlogPostStatus = "draft" | "published" | "rejected";

export type BlogFaqItem = { q: string; a: string };

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  bodyHtml: string;
  metaTitle: string | null;
  metaDescription: string | null;
  categorySlug: string;
  coverImagePath: string | null;
  coverCredit: string | null;
  sourceUrl: string;
  sourceName: string | null;
  productIds: string[];
  faq: BlogFaqItem[];
  status: BlogPostStatus;
  publishedAt: string | null;
  contentHash: string | null;
  createdAt: string;
};

export type BlogPostListItem = Pick<
  BlogPost,
  | "id"
  | "slug"
  | "title"
  | "excerpt"
  | "categorySlug"
  | "coverImagePath"
  | "coverCredit"
  | "publishedAt"
>;

/** Composite offer key stored in blog_posts.product_ids. */
export function offerProductKey(offer: Pick<Offer, "source" | "id">): string {
  return `${offer.source}:${offer.id}`;
}

export function parseProductKey(
  key: string,
): { source: OfferSource; id: number } | null {
  const m = key.match(
    /^(cpa_tl|kma|m1_top|cpagetti|adcombo|shakes):(\d+)$/,
  );
  if (!m) return null;
  return { source: m[1] as OfferSource, id: Number(m[2]) };
}

export function blogPath(slug?: string): string {
  if (!slug) return BLOG_PATH;
  return `${BLOG_PATH}/${slug}`;
}

/**
 * Public source label for captions / footer.
 * RSS niche shelves ("ScienceDaily — Diet & Weight Loss") collapse to the outlet name.
 */
export function blogSourceDisplayName(raw: string | null | undefined): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const brand = s.split(/\s+[—–]\s+/)[0]?.trim() || s;
  return brand.replace(/\s*\([^)]*\)\s*$/, "").trim() || s;
}

const CS_DIACRITICS: Record<string, string> = {
  á: "a",
  ä: "a",
  č: "c",
  ď: "d",
  é: "e",
  ě: "e",
  í: "i",
  ň: "n",
  ó: "o",
  ö: "o",
  ř: "r",
  š: "s",
  ť: "t",
  ú: "u",
  ů: "u",
  ü: "u",
  ý: "y",
  ž: "z",
};

/** ASCII slug for Czech (and Latin) article titles. */
export function blogSlugFromTitle(title: string, fallback = "clanek"): string {
  let out = "";
  for (const ch of title.trim().toLowerCase()) {
    out += CS_DIACRITICS[ch] ?? ch;
  }
  const ascii = out
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");
  return ascii || fallback;
}

/** Marker the LLM may insert so products render mid-article. */
export const BLOG_PRODUCTS_MARKER = "<!--PRODUCTS-->";

/**
 * Ensure a mid-article products slot exists.
 * Insert at a paragraph boundary mid-body — never directly under an H2
 * (so the product rail is not read as part of a section heading).
 */
export function ensureBlogProductsMarker(bodyHtml: string): string {
  if (!bodyHtml || bodyHtml.includes(BLOG_PRODUCTS_MARKER)) return bodyHtml;

  const mid = Math.floor(bodyHtml.length * 0.45);
  const fromMid = bodyHtml.slice(mid);
  const pClose = fromMid.match(/<\/p>/i);
  if (pClose && pClose.index != null) {
    const at = mid + pClose.index + pClose[0].length;
    return `${bodyHtml.slice(0, at)}\n${BLOG_PRODUCTS_MARKER}\n${bodyHtml.slice(at)}`;
  }
  return `${bodyHtml}\n${BLOG_PRODUCTS_MARKER}`;
}

/**
 * If the pre-products HTML ends with a short H2 section (legacy marker under a heading),
 * move that heading (+ optional short intro) into `after` so the rail is not under it.
 */
export function peelTrailingHeading(before: string, after: string): {
  before: string;
  after: string;
} {
  const m = before.match(/([\s\S]*?)(<h2\b[^>]*>[\s\S]*)$/i);
  if (!m) return { before, after };
  const tail = m[2] ?? "";
  // Keep long section bodies above the rail; only peel heading + short lead-in.
  if (tail.length > 480) return { before, after };
  return {
    before: m[1] ?? before,
    after: `${tail}\n${after}`,
  };
}

export function splitBlogBody(bodyHtml: string): {
  before: string;
  after: string;
  hasMarker: boolean;
} {
  const withMarker = ensureBlogProductsMarker(bodyHtml);
  const idx = withMarker.indexOf(BLOG_PRODUCTS_MARKER);
  if (idx < 0) return { before: withMarker, after: "", hasMarker: false };
  const peeled = peelTrailingHeading(
    withMarker.slice(0, idx),
    withMarker.slice(idx + BLOG_PRODUCTS_MARKER.length),
  );
  return { ...peeled, hasMarker: true };
}

/** Truncate breadcrumb / UI label without cutting mid-word when possible. */
export function truncateBlogLabel(text: string, max = 42): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > 20 ? cut.slice(0, sp) : cut).trim()}…`;
}
