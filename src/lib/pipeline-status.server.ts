import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { OfferSource } from "./types";
import { getFeedWaveStatus, WAVE_STALE_MS } from "./feed-sync-wave.server";
import { getGoogleAccessToken, GOOGLE_SCOPE_WEBMASTERS } from "./google-sa.server";
import { getSitemapFromGsc } from "./gsc-sitemap.server";
import {
  classifyImageFactsExhaustError,
  isImageFactsEnabled,
  shouldReprobeExhaustedImageFacts,
} from "./image-facts";
import {
  classifyImageExhaustToFacts,
  classifyLandingExhaustError,
  countReprobeEligible,
  emptyFactsExhaustClassCounts,
  type FactsExhaustClass,
} from "./facts-recovery";
import {
  computeFailureCooldownMs,
  QUARANTINE_AFTER_FAILS,
} from "./content-gen-cooldown";
import {
  isLandingFactsContentSource,
  offerFactsReadyForContent,
} from "./offer-facts-ready";
import {
  isHardIndexingLogError,
  isIndexNowRateLimitErrorText,
} from "./indexing-rate-limit";

const PIPELINE_SOURCES: OfferSource[] = [
  "cpa_tl",
  "kma",
  "m1_top",
  "cpagetti",
  "adcombo",
  "shakes",
];

/** Hard indexing errors in the last day before Telegram/ops digest alerts. */
const INDEXING_ERROR_ALERT_MIN = 10;
/** GSC URL Inspection errors in the last day. */
const INSPECT_ERROR_ALERT_MIN = 5;
/** Image-facts / landing-facts rows with repeated failures. */
const IMAGE_FACTS_FAIL_ALERT_MIN = 5;
const LANDING_FACTS_FAIL_ALERT_MIN = 5;
/** Fresh window for facts ops alerts (warehouse ≠ incident). */
const FACTS_FRESH_MS = 48 * 60 * 60 * 1000;
const FACTS_ERROR_SAMPLE_LIMIT = 5;
const INDEXING_ERROR_SAMPLE_LIMIT = 3;
const LANDING_FACTS_TABLES = [
  "shakes_landing_facts",
  "m1_landing_facts",
  "cpa_tl_landing_facts",
] as const;

const LANDING_FACTS_TABLE: Record<"shakes" | "cpa_tl" | "m1_top", string> = {
  shakes: "shakes_landing_facts",
  cpa_tl: "cpa_tl_landing_facts",
  m1_top: "m1_landing_facts",
};

const SOURCE_TABLES: Record<OfferSource, string> = {
  cpa_tl: "cpa_tl_offers",
  kma: "kma_offers",
  m1_top: "m1_offers",
  cpagetti: "cpagetti_offers",
  adcombo: "adcombo_offers",
  shakes: "shakes_offers",
};

const OFFER_STATUS_SELECT: Record<OfferSource, string> = {
  cpa_tl: "offer_id, synced_at, picture_url",
  kma: "offer_id, synced_at, logo",
  m1_top: "offer_id, synced_at, picture_url",
  cpagetti: "offer_id, synced_at, picture_url",
  adcombo: "offer_id, synced_at, picture_url",
  shakes: "offer_id, synced_at, picture_url",
};

const STALE_MS = 2 * 60 * 60 * 1000;
const RETRY_ALERT_FAIL_COUNT = QUARANTINE_AFTER_FAILS;
const PAGE_OFFERS = 1000;
const PAGE_CONTENT = 1000;

export type StuckBlockReason =
  | "cooldown"
  | "locked"
  | "facts_pending"
  | "never_claimed"
  | "repeated_fail";

function isContentComplete(row: {
  display_title_uk: string | null;
  description_html_uk: string | null;
  faq_uk: unknown;
}): boolean {
  const faqLen = Array.isArray(row.faq_uk) ? row.faq_uk.length : 0;
  return Boolean(row.display_title_uk && row.description_html_uk && faqLen >= 3);
}

/** Classify why a stale missing offer is not progressing. */
export function classifyStuckBlockReason(opts: {
  failCount: number | null;
  lastError: string | null;
  lockedUntil: string | null;
  lastFailedAt: string | null;
  factsPending: boolean;
  nowMs?: number;
}): StuckBlockReason {
  const now = opts.nowMs ?? Date.now();
  const lockTs = opts.lockedUntil ? Date.parse(opts.lockedUntil) : NaN;
  if (Number.isFinite(lockTs) && lockTs > now) return "locked";

  const failCount = Number(opts.failCount ?? 0);
  const failTs = opts.lastFailedAt ? Date.parse(opts.lastFailedAt) : NaN;
  const coolingDown =
    failCount > 0 &&
    Number.isFinite(failTs) &&
    failTs + computeFailureCooldownMs(failCount) > now;
  if (coolingDown) return "cooldown";
  if (failCount >= RETRY_ALERT_FAIL_COUNT) return "repeated_fail";
  if (opts.factsPending) return "facts_pending";
  return "never_claimed";
}

async function loadAllActiveOffers(
  source: OfferSource,
): Promise<
  Array<{
    offer_id: number;
    synced_at: string | null;
    picture_url?: string | null;
    logo?: string | null;
  }>
> {
  const rows: Array<{
    offer_id: number;
    synced_at: string | null;
    picture_url?: string | null;
    logo?: string | null;
  }> = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabaseAdmin
      .from(SOURCE_TABLES[source])
      .select(OFFER_STATUS_SELECT[source])
      .eq("is_active", true)
      .range(from, from + PAGE_OFFERS - 1);
    if (error) throw error;
    const page = (data ?? []) as typeof rows;
    rows.push(...page);
    if (page.length < PAGE_OFFERS) break;
    from += PAGE_OFFERS;
  }
  return rows;
}

async function loadAllProductContent(source: OfferSource): Promise<
  Array<{
    offer_id: number;
    display_title_uk: string | null;
    description_html_uk: string | null;
    faq_uk: unknown;
    title_ru: string | null;
    display_title_ru: string | null;
  }>
> {
  const rows: Array<{
    offer_id: number;
    display_title_uk: string | null;
    description_html_uk: string | null;
    faq_uk: unknown;
    title_ru: string | null;
    display_title_ru: string | null;
  }> = [];
  let from = 0;
  while (true) {
    // No HTML body — rows without description never complete AI, so exclude them.
    const { data, error } = await supabaseAdmin
      .from("product_content")
      .select(
        "offer_id, display_title_uk, faq_uk, title_ru, display_title_ru",
      )
      .eq("source", source)
      .not("description_html_uk", "is", null)
      .range(from, from + PAGE_CONTENT - 1);
    if (error) throw error;
    const page = (data ?? []) as Array<{
      offer_id: number;
      display_title_uk: string | null;
      faq_uk: unknown;
      title_ru: string | null;
      display_title_ru: string | null;
    }>;
    for (const r of page) {
      rows.push({
        offer_id: r.offer_id,
        display_title_uk: r.display_title_uk,
        description_html_uk: "1",
        faq_uk: r.faq_uk,
        title_ru: r.title_ru,
        display_title_ru: r.display_title_ru,
      });
    }
    if (page.length < PAGE_CONTENT) break;
    from += PAGE_CONTENT;
  }
  return rows;
}

async function loadLandingStatuses(
  source: OfferSource,
  ids: number[],
): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  if (!isLandingFactsContentSource(source) || ids.length === 0) return out;
  // Chunk .in() to avoid URL limits.
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const { data, error } = await supabaseAdmin
      .from(LANDING_FACTS_TABLE[source])
      .select("offer_id, status")
      .in("offer_id", chunk);
    if (error) {
      console.warn(`[pipeline-status] landing facts ${source}:`, error.message);
      continue;
    }
    for (const row of data ?? []) {
      const id = Number((row as { offer_id: number }).offer_id);
      const status = String((row as { status?: string }).status ?? "").trim();
      if (Number.isFinite(id) && status) out.set(id, status);
    }
  }
  return out;
}

async function loadImageStatuses(
  source: OfferSource,
  ids: number[],
): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  if (ids.length === 0) return out;
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const { data, error } = await supabaseAdmin
      .from("offer_image_facts")
      .select("offer_id, status")
      .eq("source", source)
      .in("offer_id", chunk);
    if (error) {
      console.warn(`[pipeline-status] image facts ${source}:`, error.message);
      continue;
    }
    for (const row of data ?? []) {
      const id = Number((row as { offer_id: number }).offer_id);
      const status = String((row as { status?: string }).status ?? "").trim();
      if (Number.isFinite(id) && status) out.set(id, status);
    }
  }
  return out;
}

function offerHasImageUrl(
  source: OfferSource,
  row: { picture_url?: string | null; logo?: string | null },
): boolean {
  if (source === "kma") return Boolean(String(row.logo ?? "").trim());
  return Boolean(String(row.picture_url ?? "").trim());
}

export type SourcePipelineStatus = {
  active: number;
  missing_content: number;
  stale_content: number;
  missing_uk: number;
  missing_ru: number;
  facts_pending: number;
  cooldown_blocked: number;
};

export type StuckOfferStatus = {
  source: OfferSource;
  offer_id: number;
  synced_at: string | null;
  fail_count: number | null;
  last_error: string | null;
  locked_until: string | null;
  block_reason: StuckBlockReason;
};

export type PipelineOpsSignals = {
  stale_content: number;
  repeated_failures: number;
  feed_wave_error: string | null;
  feed_wave_stale: boolean;
  /** Hard indexing failures only (excludes IndexNow/Google 429 rate limits). */
  indexing_errors_24h: number;
  /** IndexNow/Seznam/Google rate_limited rows in last 24h (context, never pages alone). */
  indexing_rate_limited_24h: number;
  indexing_config_skips_24h: number;
  indexing_error_samples: string[];
  /** GSC URL Inspection failures written by indexing-retry. */
  inspect_errors_24h: number;
  /** High fail_count warehouse (compat); prefer fresh_* for alerts. */
  image_facts_high_fail: number;
  /** Total exhausted warehouse (LLM cap / safety / fetch streak). */
  image_facts_exhausted: number;
  /** Active CDN/egress retries (status=fetch_error). */
  image_facts_fetch_error: number;
  /** Exhausted rows updated within FACTS_FRESH_MS. */
  image_facts_exhausted_fresh: number;
  /** fetch_error rows updated within FACTS_FRESH_MS. */
  image_facts_fetch_error_fresh: number;
  /** Exhausted classified as LLM cap / safety (warehouse). */
  image_facts_llm_exhausted: number;
  /** Exhausted class breakdown (warehouse — tier C, never page). */
  image_facts_exhausted_by_class: Record<FactsExhaustClass, number>;
  /** Fresh exhausted class breakdown (tier B alerts use this only). */
  image_facts_exhausted_fresh_by_class: Record<FactsExhaustClass, number>;
  image_facts_error_samples: string[];
  /** Exhausted rows past soft re-probe TTL (drain will pick them). */
  image_facts_reprobe_eligible: number;
  /** Compat: retryable high-fail + exhausted (prefer split fields). */
  landing_facts_high_fail: number;
  landing_facts_retryable: number;
  landing_facts_exhausted: number;
  landing_facts_retryable_fresh: number;
  landing_facts_exhausted_fresh: number;
  landing_facts_exhausted_by_class: Record<FactsExhaustClass, number>;
  landing_facts_exhausted_fresh_by_class: Record<FactsExhaustClass, number>;
  landing_facts_error_samples: string[];
  landing_facts_reprobe_eligible: number;
  /** null = GSC token missing (skipped). */
  gsc_sitemap_errors: number | null;
  gsc_sitemap_error: string | null;
  gsc_sitemap_skipped: "no_token" | null;
};

export type PipelineStatusResult = {
  ok: boolean;
  alerts: string[];
  sources: Partial<Record<OfferSource, SourcePipelineStatus>>;
  totals: {
    missing_content: number;
    stale_content: number;
    repeated_failures: number;
    facts_pending: number;
    cooldown_blocked: number;
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
  let totalFactsPending = 0;
  let totalCooldownBlocked = 0;
  const staleThreshold = Date.now() - STALE_MS;
  const nowMs = Date.now();
  const imageFactsEnabled = isImageFactsEnabled();

  for (const source of PIPELINE_SOURCES) {
    let offerRows: Awaited<ReturnType<typeof loadAllActiveOffers>>;
    try {
      offerRows = await loadAllActiveOffers(source);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      alerts.push(`${source}: offers query failed — ${message}`);
      continue;
    }

    const ids = offerRows.map((r) => r.offer_id);
    const offerById = new Map(offerRows.map((r) => [r.offer_id, r]));
    const syncedAtById = new Map(
      offerRows.map((r) => [r.offer_id, String(r.synced_at ?? "")]),
    );

    let content: Awaited<ReturnType<typeof loadAllProductContent>>;
    try {
      content = await loadAllProductContent(source);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      alerts.push(`${source}: product_content query failed — ${message}`);
      content = [];
    }

    const haveComplete = new Set<number>();
    const haveUk = new Set<number>();
    const haveRu = new Set<number>();
    for (const r of content) {
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

    const landingStatuses = await loadLandingStatuses(source, missingComplete);
    const imageStatuses = await loadImageStatuses(source, missingComplete);

    const isFactsRowMissing = (id: number): boolean => {
      const row = offerById.get(id);
      if (!row) return false;
      // No raw blob on status path (CF subrequest budget) — assume landing sources need a row.
      return !offerFactsReadyForContent({
        source,
        hasExtractableLanding: isLandingFactsContentSource(source),
        landingStatus: landingStatuses.get(id) ?? null,
        imageFactsEnabled,
        hasImageUrl: offerHasImageUrl(source, row),
        imageStatus: imageStatuses.get(id) ?? null,
        // Force young so age bypass does not hide warehouse facts backlog from ops.
        syncedAt: new Date().toISOString(),
        nowMs,
      });
    };

    /** True when drain would still skip (facts hard-block, not soft-bypassed by age). */
    const isFactsHardBlocked = (id: number): boolean => {
      const row = offerById.get(id);
      if (!row) return false;
      return !offerFactsReadyForContent({
        source,
        hasExtractableLanding: isLandingFactsContentSource(source),
        landingStatus: landingStatuses.get(id) ?? null,
        imageFactsEnabled,
        hasImageUrl: offerHasImageUrl(source, row),
        imageStatus: imageStatuses.get(id) ?? null,
        syncedAt: row.synced_at,
        nowMs,
      });
    };

    let factsPending = 0;
    for (const id of missingComplete) {
      if (isFactsRowMissing(id)) factsPending += 1;
    }

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
        Number.isFinite(failTs) && failTs + computeFailureCooldownMs(failCount) > nowMs;
      if ((Number.isFinite(lockTs) && lockTs > nowMs) || coolingDown) {
        retryBlocked += 1;
      }
    }

    for (const offerId of staleIds) {
      const failure = failureByOffer.get(offerId);
      const failCount = failure ? Number(failure.fail_count ?? 0) : null;
      const lastError = failure?.last_error ? String(failure.last_error) : null;
      const lockedUntil = failure?.locked_until ? String(failure.locked_until) : null;
      const lastFailedAt = failure?.last_failed_at ? String(failure.last_failed_at) : null;
      const factsPendingOffer = isFactsHardBlocked(offerId);
      stuckOffers.push({
        source,
        offer_id: offerId,
        synced_at: syncedAtById.get(offerId) ?? null,
        fail_count: failCount,
        last_error: lastError,
        locked_until: lockedUntil,
        block_reason: classifyStuckBlockReason({
          failCount,
          lastError,
          lockedUntil,
          lastFailedAt,
          factsPending: factsPendingOffer,
          nowMs,
        }),
      });
    }

    const stat: SourcePipelineStatus = {
      active: ids.length,
      missing_content: missingComplete.length,
      stale_content: staleIds.length,
      missing_uk: missingUk,
      missing_ru: missingRu,
      facts_pending: factsPending,
      cooldown_blocked: retryBlocked,
    };

    sources[source] = stat;

    totalMissingContent += missingComplete.length;
    totalStaleContent += staleIds.length;
    totalRepeatedFailures += repeatedFailures;
    totalFactsPending += factsPending;
    totalCooldownBlocked += retryBlocked;

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
    if (factsPending > 0) {
      alerts.push(`${source}: ${factsPending} offers waiting on landing/image facts`);
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
  let indexingRateLimited24h = 0;
  let indexingConfigSkips24h = 0;
  const indexingErrorSamples: string[] = [];
  try {
    const { count: rlCount } = await supabaseAdmin
      .from("indexing_log")
      .select("*", { count: "exact", head: true })
      .eq("status", "rate_limited")
      .gte("created_at", sinceIso);
    indexingRateLimited24h = rlCount ?? 0;

    // Legacy rows logged 429 as status=error — classify so they do not page.
    const { data: errRows, error: idxErr } = await supabaseAdmin
      .from("indexing_log")
      .select("provider, status, error, url")
      .eq("status", "error")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (idxErr) throw idxErr;

    for (const row of errRows ?? []) {
      const err = String((row as { error?: string | null }).error ?? "");
      if (isIndexNowRateLimitErrorText(err)) {
        indexingRateLimited24h += 1;
        continue;
      }
      if (isHardIndexingLogError({ status: "error", error: err })) {
        indexingErrors24h += 1;
        if (indexingErrorSamples.length < INDEXING_ERROR_SAMPLE_LIMIT) {
          const provider = String((row as { provider?: string }).provider ?? "?");
          const url = String((row as { url?: string }).url ?? "").slice(0, 60);
          const sample = `${provider}:${err.slice(0, 100)}${url ? ` (${url})` : ""}`;
          if (sample.trim() && !indexingErrorSamples.includes(sample)) {
            indexingErrorSamples.push(sample);
          }
        }
      }
    }

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
  let imageFactsExhausted = 0;
  let imageFactsFetchError = 0;
  let imageFactsExhaustedFresh = 0;
  let imageFactsFetchErrorFresh = 0;
  let imageFactsLlmExhausted = 0;
  let imageFactsReprobeEligible = 0;
  const imageFactsExhaustedByClass = emptyFactsExhaustClassCounts();
  const imageFactsExhaustedFreshByClass = emptyFactsExhaustClassCounts();
  const imageFactsErrorSamples: string[] = [];
  const factsFreshSince = new Date(Date.now() - FACTS_FRESH_MS).toISOString();
  try {
    const { count } = await supabaseAdmin
      .from("offer_image_facts")
      .select("*", { count: "exact", head: true })
      .gte("fail_count", RETRY_ALERT_FAIL_COUNT);
    imageFactsHighFail = count ?? 0;

    const { data: badImageRows, error: imgErr } = await supabaseAdmin
      .from("offer_image_facts")
      .select("status,error,updated_at,fail_count")
      .in("status", ["exhausted", "fetch_error"]);
    if (imgErr) throw imgErr;

    for (const row of badImageRows ?? []) {
      const status = String(row.status ?? "");
      const err = String(row.error ?? "").slice(0, 120);
      const updated = String(row.updated_at ?? "");
      const fresh = updated >= factsFreshSince;
      if (status === "exhausted") {
        imageFactsExhausted += 1;
        const imageCls = classifyImageFactsExhaustError(String(row.error ?? ""));
        const factsCls = classifyImageExhaustToFacts(imageCls);
        imageFactsExhaustedByClass[factsCls] += 1;
        if (fresh) {
          imageFactsExhaustedFresh += 1;
          imageFactsExhaustedFreshByClass[factsCls] += 1;
        }
        if (imageCls === "llm_cap" || imageCls === "safety") {
          imageFactsLlmExhausted += 1;
        }
        if (
          shouldReprobeExhaustedImageFacts({
            status,
            error: String(row.error ?? ""),
            updatedAt: updated,
            now: nowMs,
          })
        ) {
          imageFactsReprobeEligible += 1;
        }
      } else if (status === "fetch_error") {
        imageFactsFetchError += 1;
        if (fresh) imageFactsFetchErrorFresh += 1;
      }
      if (err && imageFactsErrorSamples.length < FACTS_ERROR_SAMPLE_LIMIT) {
        const sample = `${status}:${err}`;
        if (!imageFactsErrorSamples.includes(sample)) imageFactsErrorSamples.push(sample);
      }
    }

    // Alert only on fresh problems — warehouse exhausted is stock (tier C), not an incident.
    // Never frame warehouse stock as "circuit breaker" (tick-local gateway stop).
    if (imageFactsFetchErrorFresh >= IMAGE_FACTS_FAIL_ALERT_MIN) {
      alerts.push(
        `image-facts: ${imageFactsFetchErrorFresh} fresh fetch_error (CDN/egress, last 48h)`,
      );
    }
    if (imageFactsExhaustedFresh >= IMAGE_FACTS_FAIL_ALERT_MIN) {
      const by = imageFactsExhaustedFreshByClass;
      alerts.push(
        `image-facts: ${imageFactsExhaustedFresh} newly exhausted (last 48h; transient=${by.transient_fetch} thin_llm=${by.thin_llm} other=${by.other})`,
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    alerts.push(`image-facts: status failed — ${message}`);
  }

  let landingFactsHighFail = 0;
  let landingFactsRetryable = 0;
  let landingFactsExhausted = 0;
  let landingFactsRetryableFresh = 0;
  let landingFactsExhaustedFresh = 0;
  let landingFactsReprobeEligible = 0;
  const landingFactsExhaustedByClass = emptyFactsExhaustClassCounts();
  const landingFactsExhaustedFreshByClass = emptyFactsExhaustClassCounts();
  const landingFactsErrorSamples: string[] = [];
  const landingReprobeRows: Array<{
    status: string;
    exhaustClass: FactsExhaustClass;
    updatedAt: string | null;
  }> = [];
  try {
    for (const table of LANDING_FACTS_TABLES) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select("offer_id,status,error,fail_count,updated_at")
        .or(`fail_count.gte.${RETRY_ALERT_FAIL_COUNT},status.eq.exhausted`);
      if (error) {
        alerts.push(`landing-facts: ${table} query failed — ${error.message}`);
        continue;
      }
      for (const row of data ?? []) {
        landingFactsHighFail += 1;
        const status = String(row.status ?? "");
        const updated = String(row.updated_at ?? "");
        const fresh = updated >= factsFreshSince;
        const err = String(row.error ?? "").slice(0, 120);
        if (status === "exhausted") {
          landingFactsExhausted += 1;
          const cls = classifyLandingExhaustError(String(row.error ?? ""));
          landingFactsExhaustedByClass[cls] += 1;
          landingReprobeRows.push({
            status,
            exhaustClass: cls,
            updatedAt: updated || null,
          });
          if (fresh) {
            landingFactsExhaustedFresh += 1;
            landingFactsExhaustedFreshByClass[cls] += 1;
          }
        } else {
          landingFactsRetryable += 1;
          if (fresh) landingFactsRetryableFresh += 1;
        }
        if (err && landingFactsErrorSamples.length < FACTS_ERROR_SAMPLE_LIMIT) {
          const sample = `${table.replace(/_landing_facts$/, "")}:${status}:${err}`;
          if (!landingFactsErrorSamples.includes(sample)) {
            landingFactsErrorSamples.push(sample);
          }
        }
      }
    }
    landingFactsReprobeEligible = countReprobeEligible(landingReprobeRows, nowMs);
    if (landingFactsRetryableFresh >= LANDING_FACTS_FAIL_ALERT_MIN) {
      alerts.push(
        `landing-facts: ${landingFactsRetryableFresh} fresh retryable fetch/thin failures (last 48h)`,
      );
    }
    if (landingFactsExhaustedFresh >= LANDING_FACTS_FAIL_ALERT_MIN) {
      const by = landingFactsExhaustedFreshByClass;
      alerts.push(
        `landing-facts: ${landingFactsExhaustedFresh} newly exhausted (last 48h; dead=${by.terminal_dead} transient=${by.transient_fetch} thin=${by.thin_llm})`,
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    alerts.push(`landing-facts: status failed — ${message}`);
  }

  let inspectErrors24h = 0;
  try {
    const { count } = await supabaseAdmin
      .from("indexing_status")
      .select("*", { count: "exact", head: true })
      .not("inspect_error", "is", null)
      .gte("last_inspected_at", sinceIso);
    inspectErrors24h = count ?? 0;
    if (inspectErrors24h >= INSPECT_ERROR_ALERT_MIN) {
      alerts.push(`indexing-retry: ${inspectErrors24h} GSC inspect errors in last 24h`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    alerts.push(`indexing-retry: status failed — ${message}`);
  }

  let gscSitemapErrors: number | null = null;
  let gscSitemapError: string | null = null;
  let gscSitemapSkipped: "no_token" | null = null;
  try {
    const token = await getGoogleAccessToken(GOOGLE_SCOPE_WEBMASTERS);
    if (!token) {
      gscSitemapSkipped = "no_token";
      alerts.push("gsc-sitemap: skipped_config (no GSC token)");
    } else {
      const get = await getSitemapFromGsc(token);
      if (!get.ok) {
        gscSitemapError = get.error;
        alerts.push(`gsc-sitemap: get failed — ${get.error}`);
      } else {
        const errorsRaw = get.body.errors;
        const n =
          typeof errorsRaw === "number"
            ? errorsRaw
            : errorsRaw != null
              ? Number(errorsRaw)
              : 0;
        gscSitemapErrors = Number.isFinite(n) ? n : 0;
        if (gscSitemapErrors > 0) {
          alerts.push(`gsc-sitemap: ${gscSitemapErrors} errors in Search Console`);
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    gscSitemapError = message;
    alerts.push(`gsc-sitemap: status failed — ${message}`);
  }

  const ops: PipelineOpsSignals = {
    stale_content: totalStaleContent,
    repeated_failures: totalRepeatedFailures,
    feed_wave_error: feedWaveError,
    feed_wave_stale: feedWaveStale,
    indexing_errors_24h: indexingErrors24h,
    indexing_rate_limited_24h: indexingRateLimited24h,
    indexing_config_skips_24h: indexingConfigSkips24h,
    indexing_error_samples: indexingErrorSamples,
    inspect_errors_24h: inspectErrors24h,
    image_facts_high_fail: imageFactsHighFail,
    image_facts_exhausted: imageFactsExhausted,
    image_facts_fetch_error: imageFactsFetchError,
    image_facts_exhausted_fresh: imageFactsExhaustedFresh,
    image_facts_fetch_error_fresh: imageFactsFetchErrorFresh,
    image_facts_llm_exhausted: imageFactsLlmExhausted,
    image_facts_exhausted_by_class: imageFactsExhaustedByClass,
    image_facts_exhausted_fresh_by_class: imageFactsExhaustedFreshByClass,
    image_facts_error_samples: imageFactsErrorSamples,
    image_facts_reprobe_eligible: imageFactsReprobeEligible,
    landing_facts_high_fail: landingFactsHighFail,
    landing_facts_retryable: landingFactsRetryable,
    landing_facts_exhausted: landingFactsExhausted,
    landing_facts_retryable_fresh: landingFactsRetryableFresh,
    landing_facts_exhausted_fresh: landingFactsExhaustedFresh,
    landing_facts_exhausted_by_class: landingFactsExhaustedByClass,
    landing_facts_exhausted_fresh_by_class: landingFactsExhaustedFreshByClass,
    landing_facts_error_samples: landingFactsErrorSamples,
    landing_facts_reprobe_eligible: landingFactsReprobeEligible,
    gsc_sitemap_errors: gscSitemapErrors,
    gsc_sitemap_error: gscSitemapError,
    gsc_sitemap_skipped: gscSitemapSkipped,
  };

  return {
    ok,
    alerts,
    sources,
    totals: {
      missing_content: totalMissingContent,
      stale_content: totalStaleContent,
      repeated_failures: totalRepeatedFailures,
      facts_pending: totalFactsPending,
      cooldown_blocked: totalCooldownBlocked,
    },
    stuck_offers: stuckOffers,
    feed_wave,
    ops,
  };
}
