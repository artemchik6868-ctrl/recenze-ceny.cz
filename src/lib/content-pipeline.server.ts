import { syncCpaTlOffers } from "./cpa-tl-sync.server";
import { syncKmaOffers } from "./kma.server";
import { syncM1TopOffers } from "./m1-top-sync.server";
import { syncCpagettiOffers } from "./cpagetti-sync.server";
import { syncAdcomboOffers } from "./adcombo-sync.server";
import { syncShakesOffers } from "./shakes-sync.server";
import {
  generateNewContent,
  listMissingActiveOfferIdsBounded,
  BOUNDED_MISSING_DRAIN_LIMIT,
  BOUNDED_MISSING_SCAN_CAP,
  MIN_CONTENT_OFFER_MS,
  purgeContaminatedRows,
  regenMissingReviews,
  type GenerateNewContentResult,
} from "./content-backfill.server";
import { tryAcquireFeedSyncLock, releaseFeedSyncLock } from "./feed-sync-lock.server";
import { feedSyncSourceHasError, feedSyncSourceIsIncomplete } from "./feed-sync-guards";
import type { OfferSource } from "./types";

/** Do not start a source unless one claim+LLM still fits after generateNewContent setup. */
export const SOURCE_DRAIN_SLOT_MS = MIN_CONTENT_OFFER_MS + 40_000;

/**
 * Floor to enter a source. Same as the slot: a 58s slice used to pass this
 * check then miss the 50s claim gate after ~15s of row/facts loading.
 */
export const MIN_SOURCE_DRAIN_MS = SOURCE_DRAIN_SLOT_MS;

/**
 * Per-source deadline for generateNewContent given remaining wall ms.
 * Returns null when the slice is too small to pass the drainMode claim gate.
 */
export function sourceDrainDeadlineMs(remainingMs: number): number | null {
  if (remainingMs < MIN_SOURCE_DRAIN_MS) return null;
  return remainingMs - 1000;
}

/** One source slot — do not give the leftover 180s wall to the first backlog. */
export function sourceSlotDeadlineMs(remainingMs: number): number | null {
  return sourceDrainDeadlineMs(Math.min(remainingMs, SOURCE_DRAIN_SLOT_MS));
}

/**
 * Ranked-queue slot: earlier sources stay capped so m1/shakes get a turn.
 * The last (or only) source owns the leftover wall — no 90s cap.
 */
export function sourceDeadlineForQueueSlot(opts: {
  remainingMs: number;
  isLast: boolean;
}): number | null {
  if (opts.isLast) return sourceDrainDeadlineMs(opts.remainingMs);
  return sourceSlotDeadlineMs(opts.remainingMs);
}

/** Rotate source list so startIndex is first (fair multi-source drain). */
export function rotateSourcesFrom<T>(sources: readonly T[], startIndex: number): T[] {
  if (sources.length === 0) return [];
  const i = ((startIndex % sources.length) + sources.length) % sources.length;
  return [...sources.slice(i), ...sources.slice(0, i)];
}

/**
 * Prefer small bounded holes (m1/shakes never_claimed) over a fat source window.
 * Tie-break: original `found` order (already rotated).
 */
export function rankDrainSourcesByBacklog<T extends { count: number }>(
  found: readonly T[],
): T[] {
  return [...found].sort((a, b) => a.count - b.count);
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

export type ExclusiveSyncFeedsResult = SyncFeedsResult & {
  lock: "acquired" | "busy";
  failed: OfferSource[];
  incomplete: OfferSource[];
};

/** Full ingest with a DB lock so GHA and Worker hooks cannot deactivate together. */
export async function syncAllFeedsExclusive(
  holder: string,
): Promise<ExclusiveSyncFeedsResult> {
  const acquired = await tryAcquireFeedSyncLock(holder);
  if (!acquired) {
    const sync: SyncFeedsResult["sync"] = {
      cpa_tl: {},
      kma: {},
      m1_top: {},
      cpagetti: {},
      adcombo: {},
      shakes: {},
    };
    return { ok: true, elapsed_ms: 0, sync, lock: "busy", failed: [], incomplete: [] };
  }
  try {
    const result = await syncAllFeeds();
    const failed = PIPELINE_SOURCES.filter((source) =>
      feedSyncSourceHasError(result.sync[source]),
    );
    const incomplete = PIPELINE_SOURCES.filter((source) =>
      feedSyncSourceIsIncomplete(result.sync[source]),
    );
    return { ...result, lock: "acquired", failed, incomplete };
  } finally {
    await releaseFeedSyncLock(holder);
  }
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
  slots: Array<{
    source: OfferSource;
    backlogBefore: number;
    backlogAfter: number;
    slot_ms: number;
    warmedFacts: number;
  }>;
};

/**
 * Safety retry for sources with missing content.
 *
 * 1) Sequential list (one bounded window per source — no 6-way probe burst).
 * 2) Rank small backlogs first so m1/shakes never_claimed beat fat cpagetti.
 * 3) Capped SOURCE_DRAIN_SLOT_MS + maxRounds:1 for earlier sources; last
 *    source gets leftover wall and generateNewContent's multi-round loop.
 */
export async function retryMissingContent(
  opts: { deadlineMs?: number; sources?: OfferSource[]; nowMs?: number } = {},
): Promise<RetryMissingContentResult> {
  const started = Date.now();
  const deadlineMs = opts.deadlineMs ?? CONTENT_DRAIN_DEADLINE_MS;
  const sourceList = opts.sources ?? PIPELINE_SOURCES;
  const sources: Partial<Record<OfferSource, GenerateNewContentResult>> = {};
  const slots: RetryMissingContentResult["slots"] = [];
  let totalGenerated = 0;
  let totalFailed = 0;
  let totalMissing = 0;

  const order = rotateSourcesFrom(
    sourceList,
    drainRoundStartIndex(opts.nowMs ?? Date.now(), sourceList.length),
  );

  const found: Array<{ source: OfferSource; offerIds: number[]; count: number }> = [];
  for (const source of order) {
    const remainingMs = deadlineMs - (Date.now() - started);
    if (sourceSlotDeadlineMs(remainingMs) == null) break;
    try {
      const offerIds = await listMissingActiveOfferIdsBounded(source, {
        limit: BOUNDED_MISSING_DRAIN_LIMIT,
        scanCap: BOUNDED_MISSING_SCAN_CAP,
        oldestFirst: true,
      });
      if (offerIds.length > 0) {
        found.push({ source, offerIds, count: offerIds.length });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[retry-missing] ${source} list failed: ${message}`);
      break;
    }
  }

  const ranked = rankDrainSourcesByBacklog(found);
  for (let i = 0; i < ranked.length; i++) {
    const { source, offerIds } = ranked[i]!;
    const remainingMs = deadlineMs - (Date.now() - started);
    const isLast = i === ranked.length - 1;
    const sourceDeadlineMs = sourceDeadlineForQueueSlot({ remainingMs, isLast });
    if (sourceDeadlineMs == null) break;

    try {
      const result = await generateNewContent(source, {
        deadlineMs: sourceDeadlineMs,
        offerIds,
        allowWarmFactsBeforeClaim: true,
        ...(isLast ? {} : { maxRounds: 1 }),
      });
      sources[source] = result;
      totalGenerated += result.content.totalGenerated;
      totalFailed += result.content.totalFailed;
      totalMissing += result.missingRemaining;
      const warmedFacts = result.content.rounds.reduce(
        (sum, round) => sum + (round.warmedFacts ?? 0),
        0,
      );
      slots.push({
        source,
        backlogBefore: offerIds.length,
        backlogAfter: result.missingRemaining,
        slot_ms: remainingMs,
        warmedFacts,
      });
      console.info(
        `[retry-missing] ${source} generated=${result.content.totalGenerated} failed=${result.content.totalFailed} remaining=${result.missingRemaining} backlog=${offerIds.length}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[retry-missing] ${source} threw: ${message}`);
      totalFailed += 1;
      sources[source] = {
        content: { rounds: [], totalGenerated: 0, totalFailed: 1 },
        timedOut: false,
        missingRemaining: offerIds.length,
      };
      slots.push({
        source,
        backlogBefore: offerIds.length,
        backlogAfter: offerIds.length,
        slot_ms: remainingMs,
        warmedFacts: 0,
      });
    }
  }

  return {
    ok: true,
    elapsed_ms: Date.now() - started,
    totalGenerated,
    totalFailed,
    totalMissing,
    sources,
    slots,
  };
}

/** @deprecated Use retryMissingContent */
export async function drainContentBacklog(
  opts: { deadlineMs?: number; sources?: OfferSource[] } = {},
): Promise<RetryMissingContentResult> {
  return retryMissingContent(opts);
}

export { purgeContaminatedRows };
