import { syncCpaTlOffers } from "./cpa-tl-sync.server";
import { syncKmaOffers } from "./kma.server";
import { syncM1TopOffers } from "./m1-top-sync.server";
import { syncCpagettiOffers } from "./cpagetti-sync.server";
import { syncAdcomboOffers } from "./adcombo-sync.server";
import { syncShakesOffers } from "./shakes-sync.server";
import {
  generateNewContent,
  getSourceMissingCount,
  MIN_CONTENT_OFFER_MS,
  purgeContaminatedRows,
  regenMissingReviews,
  resetContentIndexCache,
  type GenerateNewContentResult,
} from "./content-backfill.server";
import type { OfferSource } from "./types";

/** Wall time needed so generateNewContent's claim gate (MIN_CONTENT_OFFER_MS) can fire. */
export const MIN_SOURCE_DRAIN_MS = MIN_CONTENT_OFFER_MS + 8_000;

/**
 * One fair slot per source in a round-robin pass — enough for a single claim.
 * Full remaining budget is no longer given to the first source in PIPELINE_SOURCES order.
 */
export const SOURCE_DRAIN_SLOT_MS = MIN_SOURCE_DRAIN_MS;

/**
 * Per-source deadline for generateNewContent given remaining wall ms.
 * Returns null when the slice is too small to pass the drainMode claim gate.
 */
export function sourceDrainDeadlineMs(remainingMs: number): number | null {
  if (remainingMs < MIN_SOURCE_DRAIN_MS) return null;
  return remainingMs - 1000;
}

/** Rotate source list so startIndex is first (fair multi-source drain). */
export function rotateSourcesFrom<T>(sources: readonly T[], startIndex: number): T[] {
  if (sources.length === 0) return [];
  const i = ((startIndex % sources.length) + sources.length) % sources.length;
  return [...sources.slice(i), ...sources.slice(0, i)];
}

/**
 * Prefer the source with the largest AI backlog.
 * Tie-break: first in `order` (rotation) so fairness still advances.
 */
export function pickSourceWithMostMissing(
  order: readonly OfferSource[],
  missingBySource: Partial<Record<OfferSource, number>>,
): OfferSource | null {
  let best: OfferSource | null = null;
  let bestCount = 0;
  for (const source of order) {
    const n = Number(missingBySource[source] ?? 0);
    if (n > bestCount) {
      best = source;
      bestCount = n;
    }
  }
  return best;
}

/** Half-hour tick bucket so consecutive scheduled ticks rotate who goes first. */
export function drainRoundStartIndex(nowMs: number, sourceCount: number): number {
  if (sourceCount <= 0) return 0;
  return Math.floor(nowMs / (30 * 60 * 1000)) % sourceCount;
}

export function mergeGenerateNewContentResult(
  prev: GenerateNewContentResult | undefined,
  next: GenerateNewContentResult,
): GenerateNewContentResult {
  if (!prev) return next;
  return {
    content: {
      rounds: [...prev.content.rounds, ...next.content.rounds],
      totalGenerated: prev.content.totalGenerated + next.content.totalGenerated,
      totalFailed: prev.content.totalFailed + next.content.totalFailed,
    },
    timedOut: prev.timedOut || next.timedOut,
    missingRemaining: next.missingRemaining,
  };
}

export const PIPELINE_SOURCES: OfferSource[] = [
  "cpa_tl",
  "kma",
  "m1_top",
  "cpagetti",
  "adcombo",
  "shakes",
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
 * Safety retry for sources with missing content.
 *
 * Fair multi-source: rotate start so m1/shakes are not always last, but process
 * **at most one source per Worker invoke**. Free CF plan caps ~50 subrequests;
 * multi-source full index scans + raw offer loads blow that budget before LLM.
 * Cron (* /30) still advances every source over successive ticks.
 */
export async function retryMissingContent(
  opts: { deadlineMs?: number; sources?: OfferSource[]; nowMs?: number } = {},
): Promise<RetryMissingContentResult> {
  const started = Date.now();
  const deadlineMs = opts.deadlineMs ?? CONTENT_DRAIN_DEADLINE_MS;
  const sourceList = opts.sources ?? PIPELINE_SOURCES;
  const sources: Partial<Record<OfferSource, GenerateNewContentResult>> = {};
  let totalGenerated = 0;
  let totalFailed = 0;

  resetContentIndexCache(sourceList);

  try {
    // Rotate scan order for fairness, but pick the source with the largest backlog
    // so a single shakes spike is not starved behind empty earlier sources.
    const order = rotateSourcesFrom(
      sourceList,
      drainRoundStartIndex(opts.nowMs ?? Date.now(), sourceList.length),
    );

    const missingBySource: Partial<Record<OfferSource, number>> = {};
    for (const source of order) {
      missingBySource[source] = await getSourceMissingCount(source);
    }
    const chosen = pickSourceWithMostMissing(order, missingBySource);

    if (!chosen) {
      return {
        ok: true,
        elapsed_ms: Date.now() - started,
        totalGenerated: 0,
        totalFailed: 0,
        totalMissing: 0,
        sources: {},
      };
    }

    // One source only — full wall budget for real LLM work.
    const remainingMs = deadlineMs - (Date.now() - started);
    const sourceDeadlineMs = sourceDrainDeadlineMs(remainingMs);
    if (sourceDeadlineMs == null) {
      console.info(
        `[retry-missing] ${chosen} skip: remaining=${remainingMs}ms < min=${MIN_SOURCE_DRAIN_MS}ms`,
      );
      return {
        ok: true,
        elapsed_ms: Date.now() - started,
        totalGenerated: 0,
        totalFailed: 0,
        totalMissing: missingBySource[chosen] ?? 1,
        sources: {},
      };
    }

    const result = await generateNewContent(chosen, {
      deadlineMs: sourceDeadlineMs,
    });
    sources[chosen] = result;
    totalGenerated += result.content.totalGenerated;
    totalFailed += result.content.totalFailed;

    console.info(
      `[retry-missing] ${chosen} generated=${result.content.totalGenerated} failed=${result.content.totalFailed} remaining=${result.missingRemaining} backlog=${missingBySource[chosen] ?? "?"}`,
    );

    return {
      ok: true,
      elapsed_ms: Date.now() - started,
      totalGenerated,
      totalFailed,
      totalMissing: result.missingRemaining,
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
