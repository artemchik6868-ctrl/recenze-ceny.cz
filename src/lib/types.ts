export type OfferSource = "cpa_tl" | "kma" | "m1_top" | "cpagetti" | "adcombo" | "shakes";

export type Offer = {
  id: number;
  source: OfferSource;
  slug: string;
  title: string; // brand name (kept as-is from feed)
  brand: string;
  subtitle: string; // AI card subtitle (from product_content.subtitle_uk), not category template
  categoryKey: string;
  categoryName: string;
  categorySlug: string;
  /** True when AI pipeline persisted resolved_category_slug for this offer. */
  aiCategoryResolved?: boolean;
  image: string; // partner feed URL (picture_url / logo)
  priceEUR: number | null;
  landingUrl: string | null;
  publishedAt: string;
  /** ISO timestamp when the offer first appeared in our DB (stable across re-syncs). */
  firstSeenAt: string;
  // AI-generated per-offer overrides (populated by loadOffers joining product_content.*_uk).
  metaTitle?: string | null;
  metaDesc?: string | null;
  displayTitle?: string | null;
  contentGeneratedAt?: string | null; // ISO timestamp from product_content.generated_at
  // Physical form of the product, computed once at AI-generation time from
  // the RAW feed (title/category/description) and persisted in
  // product_content.form_kind. Source of truth for "Форма выпуска" rendering.
  formKind?: string | null;
  /** Partner landing/category text for shelf intent (Shakes landings, AdCombo desc, etc.). */
  feedClassifyText?: string;
};

export type Category = {
  key: string;
  slug: string;
  name: string; // Czech
  description: string; // Czech short description
  count: number;
};
