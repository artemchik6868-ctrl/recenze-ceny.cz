// Backfill indexing notifications for existing offers that already have content.
// Useful one-shot for catching up the ~1800 existing pages after enabling
// IndexNow/Google Indexing. Call repeatedly with `offset` to paginate.
//
// Query params:
//   source     — optional, one of cpa_tl|kma|m1_top|cpagetti|adcombo (default: all)
//   providers  — comma list: indexnow,google (default: indexnow,google)
//   limit      — max offers to process per call (default: 100)
//   offset     — pagination offset (default: 0)

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { pingIndexNow, pingGoogleIndexing, offerUrls } from "@/lib/indexers.server";
import { findOfferById } from "@/lib/offers.server";
import { checkHookSecret } from "@/lib/hook-auth";
import type { OfferSource } from "@/lib/types";

const SOURCES: OfferSource[] = ["cpa_tl", "kma", "m1_top", "cpagetti", "adcombo", "shakes"];

async function run(request: Request) {
  const unauthorized = checkHookSecret(request);
  if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  const onlyParam = url.searchParams.get("source") as OfferSource | null;
  const limit = Math.min(500, Number(url.searchParams.get("limit") ?? "100"));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? "0"));
  const providersParam = url.searchParams.get("providers") ?? "indexnow,google";
  const providers = new Set(providersParam.split(",").map((s) => s.trim()));
  const sources = onlyParam ? [onlyParam] : SOURCES;

  // Pull offer_ids with content rows for the requested source(s).
  const { data, error } = await supabaseAdmin
    .from("product_content")
    .select("offer_id, source")
    .in("source", sources)
    .order("offer_id", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  const seen = new Set<string>();
  const urls: string[] = [];
  for (const row of (data ?? []) as { offer_id: number; source: string }[]) {
    const key = `${row.source}:${row.offer_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      const offer = await findOfferById(row.offer_id);
      if (offer?.categorySlug && offer.slug) {
        urls.push(...offerUrls(offer.categorySlug, offer.slug));
      }
    } catch (err) {
      console.warn(`[notify-backfill] lookup ${row.source}:${row.offer_id} failed:`, err);
    }
  }

  const tasks: Promise<unknown>[] = [];
  if (providers.has("indexnow")) tasks.push(pingIndexNow(urls));
  if (providers.has("google")) tasks.push(pingGoogleIndexing(urls));
  await Promise.allSettled(tasks);

  return Response.json({
    ok: true,
    offset,
    limit,
    rows: data?.length ?? 0,
    urls: urls.length,
    providers: [...providers],
    next_offset: (data?.length ?? 0) === limit ? offset + limit : null,
  });
}

export const Route = createFileRoute("/api/public/hooks/notify-indexers-backfill")({
  server: {
    handlers: {
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request),
    },
  },
});
