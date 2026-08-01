/**
 * Shared offer row → slug / category mapping (Supabase rows only, no CPA API).
 * Category slug here is a backfill pre-hint only — storefront uses AI resolved category.
 */
import { classifyByText, classifyTitleFirst } from "./classify";
import { overrideShelfSlug } from "./catalog-shelf-overrides";
import { buildPartnerClassifyBlob } from "./partner-feed-text";
import { cleanBrandName } from "./brand-clean";
import { resolveOfferSlug, type OfferSource } from "./slugify";

export type SourceOfferRow = {
  offer_id: number;
  title?: string | null;
  name?: string | null;
  category?: string | null;
  raw?: Record<string, unknown> | null;
};

export function categorySlugFromRow(source: OfferSource, row: SourceOfferRow): string {
  const raw = row.raw ?? {};
  const title = String(row.title ?? row.name ?? raw.title ?? raw.name ?? "");
  const category = String(row.category ?? "");
  const blob = buildPartnerClassifyBlob(source, raw, title, category);
  let slug: string;
  if (source === "m1_top") {
    const titleFirst = classifyTitleFirst(title, blob, "other");
    slug =
      titleFirst !== "other"
        ? titleFirst
        : category && category !== "other"
          ? category
          : classifyByText(title, "other");
  } else if (source === "cpagetti") {
    slug = classifyTitleFirst(String(raw.name ?? title), blob, "other");
  } else if (source === "adcombo") {
    slug = classifyTitleFirst(title, blob, "other");
    if (slug === "other") slug = classifyByText(`${title} ${blob}`, "other");
  } else if (source === "shakes") {
    const rawTitle = String((raw as { title?: string }).title ?? title);
    const titleFirst = classifyTitleFirst(title, rawTitle, "other");
    slug = titleFirst !== "other" ? titleFirst : classifyByText(`${title} ${rawTitle}`, "other");
  } else {
    slug = classifyTitleFirst(title, blob || category, "other");
  }
  return overrideShelfSlug(source, row.offer_id, slug) ?? slug;
}

export function computeOfferSlugFromRow(source: OfferSource, row: SourceOfferRow): string {
  const raw = row.raw ?? {};
  const title = String(row.title ?? row.name ?? raw.title ?? raw.name ?? "");
  const brand = cleanBrandName(title);
  return resolveOfferSlug({
    title,
    brand,
    offerId: row.offer_id,
    source,
  });
}
