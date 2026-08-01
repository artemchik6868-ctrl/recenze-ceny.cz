import { syncCpaTlOffers } from "./cpa-tl-sync.server";
import { syncKmaOffers } from "./kma.server";
import { syncM1TopOffers } from "./m1-top-sync.server";
import { syncCpagettiOffers } from "./cpagetti-sync.server";
import { syncAdcomboOffers } from "./adcombo-sync.server";
import { syncShakesOffers } from "./shakes-sync.server";
import { syncTerraleadsOffers } from "./terraleads-sync.server";
import {
  generateNewContent,
  getSourceMissingCount,
  purgeContaminatedRows,
  regenMissingReviews,
  resetContentIndexCache,
  type GenerateNewContentResult,
} from "./content-backfill.server";
import type { OfferSource } from "./types";

export const PIPELINE_SOURCES: OfferSource[] = [
  "cpa_tl",
  "kma",
  "m1_top",
  "cpagetti",
  "adcombo",
  "shakes",
  "terraleads",
];

/** Default budget for content-only cron slot / hooks when new offers are pending. */
export const CONTENT_DRAIN_DEADLINE_MS = 180_000;

/** Drain missing LLM reviews across sources (after HTML content drain). */
export async function drainMissingReviews(
  opts: { deadlineMs?: number; perSourceLimit?: number; sources?: OfferSource[] } = {},
): Promise<{
  ok: true;
  elapsed_ms: number;
  totalUpdated: number;
  totalFailed: number;
  sources: Partial<Record<OfferSource, { scanned: number; updated: number; failed: number }>>;
}> {
  const started = Date.now();
  const deadlineMs = opts.deadlineMs ?? 60_000;
  const perSourceLimit = opts.perSourceLimit ?? 3;
  const sourceList = opts.sources ?? PIPELINE_SOURCES;
  const sources: Partial<Record<OfferSource, { scanned: number; updated: number; failed: number }>> = {};
  let totalUpdated = 0;
  let totalFailed = 0;

  for (const source of sourceList) {
    const remaining = deadlineMs - (Date.now() - started);
    if (remaining < 8000) break;
    const r = await regenMissingReviews(source, perSourceLimit, {
      deadlineAt: started + deadlineMs,
    });
    sources[source] = r;
    totalUpdated += r.updated;
    totalFailed += r.failed;
  }

  return {
    ok: true,
    elapsed_ms: Date.now() - started,
    totalUpdated,
    totalFailed,
    sources,
  };
}

type SyncFn = () => Promise<Record<string, unknown>>;

export const SYNC_FNS: Record<OfferSource, SyncFn> = {
  cpa_tl: syncCpaTlOffers,
  kma: syncKmaOffers,
  m1_top: syncM1TopOffers,
  cpagetti: syncCpagettiOffers,
  adcombo: syncAdcomboOffers,
  shakes: syncShakesOffers,
  terraleads: syncTerraleadsOffers,
};

export type SyncFeedsResult = {
  ok: true;
  elapsed_ms: number;
  sync: Record<OfferSource, Record<string, unknown> | { error: string }>;
  content?: Partial<Record<OfferSource, GenerateNewContentResult>>;
};

/** Download all CPA feeds (no AI — call generateNewContent after sync). */
export async function syncAllFeeds(): Promise<SyncFeedsResult> {
  const started = Date.now();
  const sync: SyncFeedsResult["sync"] = {
    cpa_tl: {},
    kma: {},
    m1_top: {},
    cpagetti: {},
    adcombo: {},
    shakes: {},
    terraleads: {},
  };

  for (const source of PIPELINE_SOURCES) {
    try {
      sync[source] = await SYNC_FNS[source]();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[sync-feeds] sync ${source} failed:`, message);
      sync[source] = { error: message };
    }
  }

  return { ok: true, elapsed_ms: Date.now() - started, sync };
}

/** Sync one source then generate missing AI content (sync → generate → done). */
export async function syncSourceAndGenerate(
  source: OfferSource,
  opts: { deadlineMs?: number } = {},
): Promise<{
  sync: Record<string, unknown> | { error: string };
  content: GenerateNewContentResult | { error: string };
}> {
  try {
    const sync = await SYNC_FNS[source]();
    const content = await generateNewContent(source, opts);
    return { sync, content };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { sync: { error: message }, content: { error: message } };
  }
}

export type RetryMissingContentResult = {
  ok: true;
  elapsed_ms: number;
  totalGenerated: number;
  totalFailed: number;
  totalMissing: number;
  sources: Partial<Record<OfferSource, GenerateNewContentResult>>;
};

/**
 * Safety retry: only sources with missing content, one offer at a time.
 * No-op when everything is generated.
 */
export async function retryMissingContent(
  opts: { deadlineMs?: number; sources?: OfferSource[] } = {},
): Promise<RetryMissingContentResult> {
  const started = Date.now();
  const deadlineMs = opts.deadlineMs ?? CONTENT_DRAIN_DEADLINE_MS;
  const sourceList = opts.sources ?? PIPELINE_SOURCES;
  const sources: Partial<Record<OfferSource, GenerateNewContentResult>> = {};
  let totalGenerated = 0;
  let totalFailed = 0;
  let totalMissing = 0;

  // Fresh index per drain request; keep warm during the tick, clear after for isolate reuse.
  resetContentIndexCache(sourceList);

  try {
    const withMissing: OfferSource[] = [];
    for (const source of sourceList) {
      const missing = await getSourceMissingCount(source);
      if (missing > 0) withMissing.push(source);
    }

    if (withMissing.length === 0) {
      return {
        ok: true,
        elapsed_ms: Date.now() - started,
        totalGenerated: 0,
        totalFailed: 0,
        totalMissing: 0,
        sources: {},
      };
    }

    const perSourceMs = Math.max(15_000, Math.floor(deadlineMs / withMissing.length));

    for (const source of withMissing) {
      const remainingMs = deadlineMs - (Date.now() - started);
      if (remainingMs < 5000) break;

      const result = await generateNewContent(source, {
        deadlineMs: Math.min(perSourceMs, remainingMs - 1000),
      });
      sources[source] = result;
      totalGenerated += result.content.totalGenerated;
      totalFailed += result.content.totalFailed;
      totalMissing += result.missingRemaining;

      console.info(
        `[retry-missing] ${source} generated=${result.content.totalGenerated} failed=${result.content.totalFailed} remaining=${result.missingRemaining}`,
      );
    }

    return {
      ok: true,
      elapsed_ms: Date.now() - started,
      totalGenerated,
      totalFailed,
      totalMissing,
      sources,
    };
  } finally {
    resetContentIndexCache(sourceList);
  }
}

/** @deprecated Use retryMissingContent */
export async function drainContentBacklog(
  opts: { deadlineMs?: number; sources?: OfferSource[] } = {},
): Promise<RetryMissingContentResult> {
  return retryMissingContent(opts);
}

export { purgeContaminatedRows };
