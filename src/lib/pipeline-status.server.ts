import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { OfferSource } from "./types";
import { getFeedWaveStatus, WAVE_STALE_MS } from "./feed-sync-wave.server";

const PIPELINE_SOURCES: OfferSource[] = [
  "cpa_tl",
  "kma",
  "m1_top",
  "cpagetti",
  "adcombo",
  "shakes",
  "terraleads",
];

/** Hard indexing errors in the last day before Telegram/ops digest alerts. */
const INDEXING_ERROR_ALERT_MIN = 10;
/** Image-facts rows with repeated failures. */
const IMAGE_FACTS_FAIL_ALERT_MIN = 5;

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
  stale_content: number;
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

export type PipelineOpsSignals = {
  stale_content: number;
  repeated_failures: number;
  feed_wave_error: string | null;
  feed_wave_stale: boolean;
  indexing_errors_24h: number;
  indexing_config_skips_24h: number;
  image_facts_high_fail: number;
};

export type PipelineStatusResult = {
  ok: boolean;
  alerts: string[];
  sources: Partial<Record<OfferSource, SourcePipelineStatus>>;
  totals: {
    missing_content: number;
    stale_content: number;
    repeated_failures: number;
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
    stale: boolean;
  };
  /** Structured signals for Telegram ops digest (low-noise). */
  ops: PipelineOpsSignals;
};

export async function getPipelineStatus(): Promise<PipelineStatusResult> {
  const sources: Partial<Record<OfferSource, SourcePipelineStatus>> = {};
  const alerts: string[] = [];
  const stuckOffers: StuckOfferStatus[] = [];
  let totalMissingContent = 0;
  let totalStaleContent = 0;
  let totalRepeatedFailures = 0;
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
      stale_content: staleIds.length,
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
    totalStaleContent += staleIds.length;
    totalRepeatedFailures += repeatedFailures;

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

  let feedWaveError: string | null = null;
  let feedWaveStale = false;
  let feed_wave: PipelineStatusResult["feed_wave"];
  try {
    const wave = await getFeedWaveStatus();
    const updatedMs = Date.parse(wave.updated_at);
    feedWaveStale =
      wave.active &&
      Number.isFinite(updatedMs) &&
      Date.now() - updatedMs > WAVE_STALE_MS;
    feedWaveError = wave.last_error;
    feed_wave = {
      active: wave.active,
      pending: wave.pending,
      active_source: wave.active_source,
      has_cursor: wave.has_cursor,
      wave_id: wave.wave_id,
      started_at: wave.started_at,
      updated_at: wave.updated_at,
      last_error: wave.last_error,
      stale: feedWaveStale,
    };
    if (feedWaveStale) {
      alerts.push(`feed-wave: stale (>${Math.round(WAVE_STALE_MS / 3600000)}h without progress)`);
    } else if (wave.active) {
      const parts = [
        wave.active_source ? `active=${wave.active_source}` : null,
        wave.pending.length ? `pending=${wave.pending.length}` : null,
      ].filter(Boolean);
      alerts.push(`feed-wave: in progress (${parts.join(", ")})`);
    }
    if (wave.last_error) {
      alerts.push(`feed-wave: last_error=${wave.last_error}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    feedWaveError = message;
    alerts.push(`feed-wave: status failed — ${message}`);
  }

  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let indexingErrors24h = 0;
  let indexingConfigSkips24h = 0;
  try {
    const { count: errCount } = await supabaseAdmin
      .from("indexing_log")
      .select("*", { count: "exact", head: true })
      .eq("status", "error")
      .gte("created_at", sinceIso);
    indexingErrors24h = errCount ?? 0;
    if (indexingErrors24h >= INDEXING_ERROR_ALERT_MIN) {
      alerts.push(`indexing: ${indexingErrors24h} errors in last 24h`);
    }

    const { count: cfgCount } = await supabaseAdmin
      .from("indexing_log")
      .select("*", { count: "exact", head: true })
      .eq("status", "skipped_config")
      .gte("created_at", sinceIso);
    indexingConfigSkips24h = cfgCount ?? 0;
    if (indexingConfigSkips24h > 0) {
      alerts.push(`indexing: ${indexingConfigSkips24h} skipped_config in last 24h`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    alerts.push(`indexing: status failed — ${message}`);
  }

  let imageFactsHighFail = 0;
  try {
    const { count } = await supabaseAdmin
      .from("offer_image_facts")
      .select("*", { count: "exact", head: true })
      .gte("fail_count", RETRY_ALERT_FAIL_COUNT);
    imageFactsHighFail = count ?? 0;
    if (imageFactsHighFail >= IMAGE_FACTS_FAIL_ALERT_MIN) {
      alerts.push(`image-facts: ${imageFactsHighFail} rows with fail_count≥${RETRY_ALERT_FAIL_COUNT}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    alerts.push(`image-facts: status failed — ${message}`);
  }

  const ops: PipelineOpsSignals = {
    stale_content: totalStaleContent,
    repeated_failures: totalRepeatedFailures,
    feed_wave_error: feedWaveError,
    feed_wave_stale: feedWaveStale,
    indexing_errors_24h: indexingErrors24h,
    indexing_config_skips_24h: indexingConfigSkips24h,
    image_facts_high_fail: imageFactsHighFail,
  };

  return {
    ok,
    alerts,
    sources,
    totals: {
      missing_content: totalMissingContent,
      stale_content: totalStaleContent,
      repeated_failures: totalRepeatedFailures,
    },
    stuck_offers: stuckOffers,
    feed_wave,
    ops,
  };
}
