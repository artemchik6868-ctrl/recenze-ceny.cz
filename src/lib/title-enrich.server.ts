/**
 * Enriched metadata for bulk title localization (same signals as runtime catalog).
 */

import type { Offer } from "./types";

export type TitleEnrichRow = {
  categorySlug?: string;
  formKind?: string | null;
  feedSnippet?: string;
  listingSlug?: string;
};

export type ContentSnippetRow = {
  form_kind: string | null;
  intro_uk: string | null;
};

export async function loadTitleEnrichMaps(): Promise<{
  offersByKey: Map<string, Offer>;
  briefsCategoryByKey: Map<string, string>;
  contentByKey: Map<string, ContentSnippetRow>;
}> {
  const { loadOffers } = await import("./offers.server");
  const { loadResolvedCategoryMap } = await import("./catalog-shelf.server");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [offers, briefsCategoryByKey, contentRes] = await Promise.all([
    loadOffers().catch(() => [] as Offer[]),
    loadResolvedCategoryMap(),
    supabaseAdmin.from("product_content").select("source, offer_id, form_kind, intro_uk"),
  ]);

  const offersByKey = new Map(offers.map((o) => [`${o.source}:${o.id}`, o]));
  const contentByKey = new Map<string, ContentSnippetRow>();

  if (!contentRes.error) {
    for (const row of (contentRes.data ?? []) as {
      source: string;
      offer_id: number;
      form_kind: string | null;
      intro_uk: string | null;
    }[]) {
      contentByKey.set(`${row.source}:${row.offer_id}`, {
        form_kind: row.form_kind,
        intro_uk: row.intro_uk,
      });
    }
  }

  return { offersByKey, briefsCategoryByKey, contentByKey };
}

export function buildEnrichedTitleMeta(
  source: string,
  offerId: number,
  rawTitle: string,
  maps: {
    offersByKey: Map<string, Offer>;
    briefsCategoryByKey: Map<string, string>;
    contentByKey: Map<string, ContentSnippetRow>;
  },
  base?: { categorySlug?: string; formKind?: string | null },
): TitleEnrichRow {
  const key = `${source}:${offerId}`;
  const offer = maps.offersByKey.get(key);
  const content = maps.contentByKey.get(key);

  const feedSnippet = [
    offer?.feedClassifyText,
    content?.intro_uk?.trim().slice(0, 200),
    rawTitle,
  ]
    .filter(Boolean)
    .join("\n")
    .trim();

  const categorySlug =
    offer?.categorySlug ??
    base?.categorySlug ??
    maps.briefsCategoryByKey.get(key);

  const formKind = content?.form_kind ?? base?.formKind ?? null;

  return {
    categorySlug,
    formKind,
    feedSnippet: feedSnippet || rawTitle,
    listingSlug: offer?.slug,
  };
}
