import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { OfferSource } from "./types";
import { getFeedWaveStatus } from "./feed-sync-wave.server";

const PIPELINE_SOURCES: OfferSource[] = [
  "cpa_tl",
  "kma",
  "m1_top",
  "cpagetti",
  "adcombo",
  "shakes",
  "terraleads",
];

const SOURCE_TABLES: Record<OfferSource, string> = {
  cpa_tl: "cpa_tl_offers",
  kma: "kma_offers",
  m1_top: "m1_offers",
  cpagetti: "cpagetti_offers",
  adcombo: "adcombo_offers",
  shakes: "shakes_offers",
  terraleads: "terraleads_offers",
};

const STALE_MS = 2 * 60 * 60 * 1000;
const RETRY_ALERT_FAIL_COUNT = 3;

function computeFailureCooldownMs(failCount: number): number {
  if (failCount >= 8) return 24 * 60 * 60 * 1000;
  return Math.min(6 * 60 * 60 * 1000, 5 * 60 * 1000 * 2 ** Math.max(0, failCount - 1));
}

function isContentComplete(row: {
  display_title_uk: string | null;
  description_html_uk: string | null;
  faq_uk: unknown;
}): boolean {
  const faqLen = Array.isArray(row.faq_uk) ? row.faq_uk.length : 0;
  return Boolean(row.display_title_uk && row.description_html_uk && faqLen >= 3);
}

export type SourcePipelineStatus = {
  active: number;
  missing_content: number;
  stale_content: number | null;
  missing_uk: number;
  missing_ru: number;
};

export type StuckOfferStatus = {
  source: OfferSource;
  offer_id: number;
  synced_at: string | null;
  fail_count: number | null;
  last_error: string | null;
  locked_until: string | null;
};

export type PipelineStatusResult = {
  ok: boolean;
  alerts: string[];
  sources: Partial<Record<OfferSource, SourcePipelineStatus>>;
  totals: {
    missing_content: number;
    stale_content: number | null;
  };
  stuck_offers: StuckOfferStatus[];
  feed_wave?: {
    active: boolean;
    pending: OfferSource[];
    active_source: OfferSource | null;
    has_cursor: boolean;
    wave_id: string;
    started_at: string;
    updated_at: string;
    last_error: string | null;
  };
};

export async function getPipelineStatus(): Promise<PipelineStatusResult> {
  const sources: Partial<Record<OfferSource, SourcePipelineStatus>> = {};
  const alerts: string[] = [];
  const stuckOffers: StuckOfferStatus[] = [];
  let totalMissingContent = 0;
  const staleThreshold = Date.now() - STALE_MS;

  for (const source of PIPELINE_SOURCES) {
    const table = SOURCE_TABLES[source];

    const { data: offers, error: oErr } = await supabaseAdmin
      .from(table)
      .select("offer_id, synced_at")
      .eq("is_active", true);
    if (oErr) {
      alerts.push(`${source}: offers query failed — ${oErr.message}`);
      continue;
    }

    const rows = offers ?? [];
    const ids = rows.map((r) => r.offer_id as number);
    const syncedAtById = new Map(
      rows.map((r) => [r.offer_id as number, String(r.synced_at ?? "")]),
    );

    const { data: content } = await supabaseAdmin
      .from("product_content")
      .select(
        "offer_id, display_title_uk, description_html_uk, faq_uk, title_ru, display_title_ru",
      )
      .eq("source", source);

    const haveComplete = new Set<number>();
    const haveUk = new Set<number>();
    const haveRu = new Set<number>();
    for (const r of content ?? []) {
      if (r.display_title_uk) haveUk.add(r.offer_id);
      if (r.title_ru && r.display_title_ru) haveRu.add(r.offer_id);
      if (isContentComplete(r)) haveComplete.add(r.offer_id);
    }

    const missingComplete = ids.filter((id) => !haveComplete.has(id));
    const missingUk = ids.filter((id) => !haveUk.has(id)).length;
    const missingRu = ids.filter((id) => !haveRu.has(id)).length;

    const staleIds = missingComplete.filter((id) => {
      const synced = syncedAtById.get(id);
      if (!synced) return false;
      const ts = Date.parse(synced);
      return Number.isFinite(ts) && ts < staleThreshold;
    });

    const stat: SourcePipelineStatus = {
      active: ids.length,
      missing_content: missingComplete.length,
      stale_content: null,
      missing_uk: missingUk,
      missing_ru: missingRu,
    };

    let retryBlocked = 0;
    let repeatedFailures = 0;

    const { data: failures } = await supabaseAdmin
      .from("content_gen_failures")
      .select("offer_id, fail_count, last_failed_at, locked_until, last_error")
      .eq("source", source);
    const failureByOffer = new Map(
      (failures ?? []).map((row) => [row.offer_id as number, row]),
    );

    for (const row of failures ?? []) {
      const failCount = Number(row.fail_count ?? 0);
      if (failCount >= RETRY_ALERT_FAIL_COUNT) repeatedFailures += 1;
      const lockTs = row.locked_until ? Date.parse(String(row.locked_until)) : NaN;
      const failTs = row.last_failed_at ? Date.parse(String(row.last_failed_at)) : NaN;
      const coolingDown =
        Number.isFinite(failTs) && failTs + computeFailureCooldownMs(failCount) > Date.now();
      if ((Number.isFinite(lockTs) && lockTs > Date.now()) || coolingDown) {
        retryBlocked += 1;
      }
    }

    for (const offerId of staleIds) {
      const failure = failureByOffer.get(offerId);
      stuckOffers.push({
        source,
        offer_id: offerId,
        synced_at: syncedAtById.get(offerId) ?? null,
        fail_count: failure ? Number(failure.fail_count ?? 0) : null,
        last_error: failure?.last_error ? String(failure.last_error) : null,
        locked_until: failure?.locked_until ? String(failure.locked_until) : null,
      });
    }

    sources[source] = stat;

    totalMissingContent += missingComplete.length;

    if (missingComplete.length > 0) {
      alerts.push(`${source}: ${missingComplete.length} offers missing AI content`);
    }
    if (staleIds.length > 0) {
      const preview = staleIds.slice(0, 10).join(", ");
      const suffix = staleIds.length > 10 ? "…" : "";
      alerts.push(
        `${source}: ${staleIds.length} offers missing AI > 2h (ids: ${preview}${suffix})`,
      );
    }
    if (repeatedFailures > 0) {
      alerts.push(`${source}: ${repeatedFailures} offers have repeated AI failures`);
    }
    if (retryBlocked > 0) {
      alerts.push(`${source}: ${retryBlocked} offers are in AI retry cooldown/lock`);
    }
  }

  const ok = totalMissingContent === 0;

  let feed_wave: PipelineStatusResult["feed_wave"];
  try {
    const wave = await getFeedWaveStatus();
    feed_wave = {
      active: wave.active,
      pending: wave.pending,
      active_source: wave.active_source,
      has_cursor: wave.has_cursor,
      wave_id: wave.wave_id,
      started_at: wave.started_at,
      updated_at: wave.updated_at,
      last_error: wave.last_error,
    };
    if (wave.active) {
      const parts = [
        wave.active_source ? `active=${wave.active_source}` : null,
        wave.pending.length ? `pending=${wave.pending.length}` : null,
      ].filter(Boolean);
      alerts.push(`feed-wave: in progress (${parts.join(", ")})`);
    } else if (wave.last_error) {
      alerts.push(`feed-wave: last_error=${wave.last_error}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    alerts.push(`feed-wave: status failed — ${message}`);
  }

  return {
    ok,
    alerts,
    sources,
    totals: {
      missing_content: totalMissingContent,
      stale_content: null,
    },
    stuck_offers: stuckOffers,
    feed_wave,
  };
}
