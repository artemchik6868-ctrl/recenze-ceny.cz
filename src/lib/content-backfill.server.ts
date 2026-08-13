// Background backfill helpers.
// - generateMissingContent: for active offers in a source, generate the HI and
//   EN AI content rows ahead of the first crawler visit. This stops Googlebot
//   from being the first user to trigger a slow generation request.
//
// Helpers are capped (`limit`) to keep within the request window when
// chained off a sync hook. Run multiple times (e.g. via the manual backfill
// hook) to chew through a large backlog.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  getOrGenerateProductContentDetailed,
  getExpectedSourceHash,
  computeFormKind,
  generateReviewsOnlyForOffer,
  warmOfferFactsBeforeContent,
} from "./ai-content.server";
import { loadResolvedCategoryMap } from "./catalog-shelf.server";
import { categorySlugFromRow, type SourceOfferRow } from "./offer-row-map.server";
import { reviewCountFor } from "./review-slots-gen";
import type { OfferSource } from "./types";
import { ENABLE_AI_CONTENT } from "./market";
import { isImageFactsEnabled } from "./image-facts";
import {
  hasExtractableLandingForSource,
  isLandingFactsContentSource,
  offerFactsReadyForContent,
} from "./offer-facts-ready";
import {
  CONTENT_STALE_MS,
  computeFailureCooldownMs,
  QUARANTINE_AFTER_FAILS,
} from "./content-gen-cooldown";

const TABLE: Record<OfferSource, string> = {
  cpa_tl: "cpa_tl_offers",
  kma: "kma_offers",
  m1_top: "m1_offers",
  cpagetti: "cpagetti_offers",
  adcombo: "adcombo_offers",
  shakes: "shakes_offers",
};

const NAME_COL: Record<OfferSource, string> = {
  cpa_tl: "title",
  kma: "name",
  m1_top: "name",
  cpagetti: "title",
  adcombo: "title",
  shakes: "title",
};

const OFFER_SELECT: Record<OfferSource, string> = {
  cpa_tl: "offer_id,title,category,raw,synced_at,picture_url",
  kma: "offer_id,name,category,raw,synced_at,logo",
  m1_top: "offer_id,name,category,raw,synced_at,picture_url",
  cpagetti: "offer_id,title,category,raw,synced_at,picture_url",
  adcombo: "offer_id,title,category,raw,synced_at,picture_url",
  shakes: "offer_id,title,category,raw,synced_at,picture_url",
};

type BackfillOfferRow = SourceOfferRow & {
  synced_at?: string | null;
  picture_url?: string | null;
  logo?: string | null;
};
type ContentGenFailureRow = {
  offer_id: number;
  source: string;
  fail_count: number;
  last_failed_at: string | null;
  locked_until?: string | null;
  last_error?: string | null;
  last_attempt_at?: string | null;
};

const GENERATION_LOCK_MS = 4 * 60 * 1000;
/** Release in-flight locks when Worker died without finishing generation. */
export const STALE_LOCK_AGE_MS = 3 * 60 * 1000;
/** Per-invoke cap: one UPDATE per batch, never one fetch per stale row. */
export const STALE_LOCK_RELEASE_CAP = 8;
/** Do not claim a new offer unless at least this much wall time remains before deadlineAt.
 *  Smoke/HTTP generate for one offer is ~30–45s; leave headroom without starving the tick. */
export const MIN_CONTENT_OFFER_MS = 50_000;
export const MAX_DRAIN_FACTS_WARMUPS_PER_ROUND = 1;
export { CONTENT_STALE_MS, computeFailureCooldownMs, QUARANTINE_AFTER_FAILS };

/** Pure priority for drain ordering — lower sorts first. */
export function computeDrainPriority(opts: {
  missingContent: boolean;
  bareMissing: boolean;
  failCount: number;
  missingQa: boolean;
  /** Complete row whose source_hash drifted (regenStale path). */
  regenStaleComplete?: boolean;
  syncedAt?: string | null;
  nowMs?: number;
  drainMode?: boolean;
}): number {
  const now = opts.nowMs ?? Date.now();
  const syncTs = opts.syncedAt ? Date.parse(opts.syncedAt) : NaN;
  const isStaleSync =
    opts.drainMode === true && Number.isFinite(syncTs) && now - syncTs >= CONTENT_STALE_MS;
  // Prefer healthy offers — high fail_count (poison / CF-kill loops) go last.
  // Stale missing (>2h) boost so health-check targets are claimed first.
  return (
    (opts.bareMissing ? -20 : 0) +
    (opts.missingContent ? -10 : 0) +
    (isStaleSync ? -15 : 0) +
    (opts.regenStaleComplete ? -5 : 0) +
    (opts.missingQa ? 0 : 5) +
    opts.failCount * 25 +
    3
  );
}

/** Tie-break: oldest synced_at first (ASC), then offer id. */
export function compareDrainOfferOrder(
  a: { priority: number; syncedAt: string; id: number },
  b: { priority: number; syncedAt: string; id: number },
): number {
  if (a.priority !== b.priority) return a.priority - b.priority;
  const bySync = a.syncedAt.localeCompare(b.syncedAt);
  if (bySync !== 0) return bySync;
  return a.id - b.id;
}

// Tiny concurrency limiter — keep AI/image fetches polite.
async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
  shouldContinue: () => boolean = () => true,
): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      if (!shouldContinue()) return;
      const next = queue.shift();
      if (next === undefined) return;
      try {
        await fn(next);
      } catch (err) {
        console.warn("[backfill] worker error:", err);
      }
    }
  });
  await Promise.all(workers);
}

function summarizeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function isMissingGenFailuresTable(err: { message?: string } | null | undefined): boolean {
  return Boolean(err?.message?.includes("content_gen_failures"));
}

function hasActiveLock(row: ContentGenFailureRow | undefined, nowMs = Date.now()): boolean {
  if (!row?.locked_until) return false;
  const ts = Date.parse(row.locked_until);
  return Number.isFinite(ts) && ts > nowMs;
}

function hasFailureCooldown(row: ContentGenFailureRow | undefined, nowMs = Date.now()): boolean {
  if (!row?.last_failed_at || row.fail_count <= 0) return false;
  const ts = Date.parse(row.last_failed_at);
  if (!Number.isFinite(ts)) return false;
  return ts + computeFailureCooldownMs(row.fail_count) > nowMs;
}

async function loadGenerationState(
  source: OfferSource,
): Promise<Map<number, ContentGenFailureRow>> {
  const { data, error } = await supabaseAdmin
    .from("content_gen_failures")
    .select("offer_id,source,fail_count,last_failed_at,locked_until,last_error,last_attempt_at")
    .eq("source", source);
  if (error || !data) {
    console.warn(`[backfill:${source}] generation state query failed:`, error?.message);
    return new Map();
  }
  return new Map((data as ContentGenFailureRow[]).map((row) => [row.offer_id, row]));
}

async function claimGenerationLock(
  source: OfferSource,
  offerId: number,
): Promise<{ ok: true } | { ok: false; reason: "locked" | "cooldown" | "error" }> {
  const now = new Date();
  const nowMs = now.getTime();
  const nowIso = now.toISOString();
  const lockUntil = new Date(nowMs + GENERATION_LOCK_MS).toISOString();
  const { data: existing, error: readErr } = await supabaseAdmin
    .from("content_gen_failures")
    .select("offer_id,source,fail_count,last_failed_at,locked_until,last_error,last_attempt_at")
    .eq("source", source)
    .eq("offer_id", offerId)
    .maybeSingle();
  if (readErr) {
    if (isMissingGenFailuresTable(readErr)) return { ok: true };
    console.warn(`[backfill:${source}] lock read ${offerId} failed:`, readErr.message);
    return { ok: false, reason: "error" };
  }
  const current = (existing as ContentGenFailureRow | null) ?? null;
  if (hasActiveLock(current ?? undefined, nowMs)) return { ok: false, reason: "locked" };
  if (hasFailureCooldown(current ?? undefined, nowMs)) return { ok: false, reason: "cooldown" };
  const { error: upsertErr } = await supabaseAdmin.from("content_gen_failures").upsert({
    source,
    offer_id: offerId,
    fail_count: current?.fail_count ?? 0,
    last_failed_at: current?.last_failed_at,
    locked_until: lockUntil,
    last_error: current?.last_error ?? null,
    last_attempt_at: nowIso,
  });
  if (upsertErr) {
    if (isMissingGenFailuresTable(upsertErr)) return { ok: true };
    console.warn(`[backfill:${source}] lock claim ${offerId} failed:`, upsertErr.message);
    return { ok: false, reason: "error" };
  }
  return { ok: true };
}

async function clearGenerationState(source: OfferSource, offerId: number): Promise<void> {
  const { error } = await supabaseAdmin
    .from("content_gen_failures")
    .delete()
    .eq("source", source)
    .eq("offer_id", offerId);
  if (error) {
    if (!isMissingGenFailuresTable(error)) {
      console.warn(`[backfill:${source}] clear state ${offerId} failed:`, error.message);
    }
  }
}

async function unlockGenerationState(source: OfferSource, offerId: number): Promise<void> {
  const { error } = await supabaseAdmin
    .from("content_gen_failures")
    .update({ locked_until: null })
    .eq("source", source)
    .eq("offer_id", offerId);
  if (error) {
    if (!isMissingGenFailuresTable(error)) {
      console.warn(`[backfill:${source}] unlock ${offerId} failed:`, error.message);
    }
  }
}

async function recordGenerationFailure(
  source: OfferSource,
  offerId: number,
  errorMessage: string,
): Promise<void> {
  const now = new Date();
  const nowIso = now.toISOString();
  const { data: existing } = await supabaseAdmin
    .from("content_gen_failures")
    .select("fail_count")
    .eq("source", source)
    .eq("offer_id", offerId)
    .maybeSingle();
  const nextFailCount = Math.max(
    1,
    Number((existing as { fail_count?: number } | null)?.fail_count ?? 0) + 1,
  );
  const lockedUntil = new Date(
    now.getTime() + computeFailureCooldownMs(nextFailCount),
  ).toISOString();
  const { error } = await supabaseAdmin.from("content_gen_failures").upsert({
    source,
    offer_id: offerId,
    fail_count: nextFailCount,
    last_failed_at: nowIso,
    locked_until: lockedUntil,
    last_error: errorMessage.slice(0, 500),
    last_attempt_at: nowIso,
  });
  if (error) {
    if (!isMissingGenFailuresTable(error)) {
      console.warn(`[backfill:${source}] record failure ${offerId} failed:`, error.message);
    }
  }
}

type ContentCompletionRow = {
  offer_id: number;
  source_hash: string;
  display_title_uk: string | null;
  description_html_uk: string | null;
  faq_uk: unknown;
  qa_checked_at: string | null;
};

const CONTENT_STATUS_PAGE = 500;

export function isContentComplete(row: {
  display_title_uk: string | null;
  description_html_uk?: string | null;
  faq_uk: unknown;
}): boolean {
  const faqLen = Array.isArray(row.faq_uk) ? row.faq_uk.length : 0;
  return Boolean(row.display_title_uk && row.description_html_uk && faqLen >= 3);
}

/** Index / bounded-window completion when HTML body was already filtered non-null. */
export function isIndexContentComplete(row: {
  display_title_uk: string | null;
  faq_uk: unknown;
}): boolean {
  const faqLen = Array.isArray(row.faq_uk) ? row.faq_uk.length : 0;
  return Boolean(row.display_title_uk && faqLen >= 3);
}

/** Newest-first window: keep only IDs without complete AI, up to limit. */
export function filterIncompleteOfferIds(
  windowIds: readonly number[],
  haveComplete: ReadonlySet<number>,
  limit?: number,
): number[] {
  const missing: number[] = [];
  for (const id of windowIds) {
    if (haveComplete.has(id)) continue;
    missing.push(id);
    if (limit != null && missing.length >= limit) break;
  }
  return missing;
}

/** Hard cap so drain never enumerates a large catalog in memory. */
export function capScanWindow(ids: readonly number[], scanCap: number): number[] {
  const cap = Math.max(0, scanCap);
  if (ids.length <= cap) return [...ids];
  return ids.slice(0, cap);
}

export const BOUNDED_MISSING_PAGE_SIZE = 200;
export const BOUNDED_MISSING_SCAN_CAP = 200;
/** Cheap empty-source skip: 1 offer page + 1 content .in(), not a 200-id window. */
export const BOUNDED_MISSING_PROBE_CAP = 24;
export const BOUNDED_MISSING_DRAIN_LIMIT = 8;
/** Full-index pagination ceiling — Worker drain must not use this path. */
export const CONTENT_INDEX_PAGE_SIZE = 1000;
export const CONTENT_INDEX_MAX_PAGES = 8;

/** Pure helper for stale-lock release (unit-tested). */
export function shouldReleaseStaleLock(
  row: ContentGenFailureRow,
  haveComplete: Set<number>,
  nowMs = Date.now(),
): boolean {
  if (haveComplete.has(row.offer_id)) return false;
  const attemptMs = row.last_attempt_at ? Date.parse(row.last_attempt_at) : NaN;
  if (!Number.isFinite(attemptMs)) return false;
  if (nowMs - attemptMs < STALE_LOCK_AGE_MS) return false;

  // Cooldown residue after a recorded failure — do not re-fail.
  if (row.fail_count > 0 && row.last_error && row.last_failed_at) {
    const failedMs = Date.parse(row.last_failed_at);
    if (Number.isFinite(failedMs) && failedMs >= attemptMs - 1000) {
      return false;
    }
  }

  // Active lock held past STALE_LOCK_AGE_MS (Worker died mid-flight).
  if (hasActiveLock(row, nowMs)) return true;

  // Expired generation lock still on the row (silent CF kill left fail_count=0).
  if (row.locked_until) {
    const until = Date.parse(row.locked_until);
    if (Number.isFinite(until) && until <= nowMs) return true;
  }

  return false;
}

/** Oldest-first stale locks, capped so drain never spends the CF subrequest budget here. */
export function selectStaleLockCandidates(
  rows: readonly ContentGenFailureRow[],
  nowMs: number,
  cap = STALE_LOCK_RELEASE_CAP,
): ContentGenFailureRow[] {
  const out: ContentGenFailureRow[] = [];
  for (const row of rows) {
    if (!shouldReleaseStaleLock(row, new Set(), nowMs)) continue;
    out.push(row);
    if (out.length >= cap) break;
  }
  return out;
}

export function shouldYieldAfterWarmOnlyRound(round: {
  generated: number;
  failed: number;
  warmedFacts: number;
}): boolean {
  return round.generated === 0 && round.failed === 0 && round.warmedFacts > 0;
}

export const WORKER_KILLED_OR_TIMEOUT = "worker_killed_or_timeout";

/** Clear locks left by aborted Worker runs; free same-tick re-claim when possible. */
export async function releaseStaleLocks(source: OfferSource): Promise<number> {
  const nowMs = Date.now();
  const cutoffIso = new Date(nowMs - STALE_LOCK_AGE_MS).toISOString();
  const { data, error } = await supabaseAdmin
    .from("content_gen_failures")
    .select("offer_id,source,fail_count,last_failed_at,locked_until,last_error,last_attempt_at")
    .eq("source", source)
    .not("locked_until", "is", null)
    .lt("last_attempt_at", cutoffIso)
    .order("last_attempt_at", { ascending: true })
    .limit(STALE_LOCK_RELEASE_CAP * 3);
  if (error) {
    if (!isMissingGenFailuresTable(error)) {
      console.warn(`[backfill:${source}] stale-lock scan failed:`, error.message);
    }
    return 0;
  }
  const candidates = selectStaleLockCandidates(
    (data ?? []) as ContentGenFailureRow[],
    nowMs,
  );
  if (candidates.length === 0) return 0;

  const softIds: number[] = [];
  const hardIds: number[] = [];
  for (const row of candidates) {
    if ((row.fail_count ?? 0) === 0 && !row.last_error) softIds.push(row.offer_id);
    else hardIds.push(row.offer_id);
  }

  // Two batched UPDATEs max — never one fetch per lock (that blows the CF ~50 cap).
  if (softIds.length > 0) {
    const nowIso = new Date(nowMs).toISOString();
    const { error: softErr } = await supabaseAdmin
      .from("content_gen_failures")
      .update({
        locked_until: null,
        last_error: WORKER_KILLED_OR_TIMEOUT,
        last_failed_at: null,
        last_attempt_at: nowIso,
      })
      .eq("source", source)
      .in("offer_id", softIds);
    if (softErr && !isMissingGenFailuresTable(softErr)) {
      console.warn(`[backfill:${source}] soft-release stale batch failed:`, softErr.message);
    }
  }
  if (hardIds.length > 0) {
    const { error: hardErr } = await supabaseAdmin
      .from("content_gen_failures")
      .update({ locked_until: null })
      .eq("source", source)
      .in("offer_id", hardIds);
    if (hardErr && !isMissingGenFailuresTable(hardErr)) {
      console.warn(`[backfill:${source}] hard-release stale batch failed:`, hardErr.message);
    }
  }

  const released = candidates.length;
  console.info(`[backfill:${source}] released ${released} stale generation lock(s)`);
  return released;
}

function sleepMs(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Paginated load without description_html_uk (large blobs break Node fetch on Windows). */
async function loadContentCompletionBySource(source: OfferSource): Promise<ContentCompletionRow[]> {
  const rows: ContentCompletionRow[] = [];
  let from = 0;
  while (true) {
    let page: ContentCompletionRow[] = [];
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data, error } = await supabaseAdmin
        .from("product_content")
        .select("offer_id,source_hash,display_title_uk,description_html_uk,faq_uk,qa_checked_at")
        .eq("source", source)
        .not("description_html_uk", "is", null)
        .range(from, from + CONTENT_STATUS_PAGE - 1);
      if (!error) {
        page = (data ?? []) as ContentCompletionRow[];
        break;
      }
      console.warn(
        `[backfill:${source}] content status page ${from} failed (attempt ${attempt}):`,
        error.message,
      );
      if (attempt < 3) await sleepMs(1500 * attempt);
    }
    if (page.length === 0) break;
    rows.push(...page);
    if (page.length < CONTENT_STATUS_PAGE) break;
    from += CONTENT_STATUS_PAGE;
  }
  return rows;
}

/** offer_id-only pages when faq payload causes fetch resets. */
async function loadCompleteOfferIdsFallback(source: OfferSource): Promise<Set<number>> {
  const complete = new Set<number>();
  let from = 0;
  while (true) {
    let page: { offer_id: number }[] = [];
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data, error } = await supabaseAdmin
        .from("product_content")
        .select("offer_id")
        .eq("source", source)
        .not("description_html_uk", "is", null)
        .not("display_title_uk", "is", null)
        .range(from, from + 50 - 1);
      if (!error) {
        page = (data ?? []) as { offer_id: number }[];
        break;
      }
      if (attempt < 3) await sleepMs(1500 * attempt);
    }
    if (page.length === 0) break;
    for (const r of page) complete.add(r.offer_id);
    if (page.length < 50) break;
    from += 50;
  }
  return complete;
}

async function loadCompleteOfferIds(source: OfferSource): Promise<Set<number>> {
  const complete = new Set<number>();
  let from = 0;
  const pageSize = 500;
  while (true) {
    let page: ContentCompletionRow[] = [];
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data, error } = await supabaseAdmin
        .from("product_content")
        .select("offer_id,display_title_uk,description_html_uk,faq_uk")
        .eq("source", source)
        .range(from, from + pageSize - 1);
      if (!error) {
        page = (data ?? []) as ContentCompletionRow[];
        break;
      }
      console.warn(
        `[backfill:${source}] complete ids page ${from} failed (attempt ${attempt}):`,
        error.message,
      );
      if (attempt < 3) await sleepMs(1500 * attempt);
    }
    if (page.length === 0) break;
    for (const r of page) {
      if (isContentComplete(r)) complete.add(r.offer_id);
    }
    if (page.length < pageSize) break;
    from += pageSize;
  }
  return complete;
}

const OFFER_ROWS_PAGE = 200;

const LANDING_FACTS_TABLE: Record<"shakes" | "cpa_tl" | "m1_top", string> = {
  shakes: "shakes_landing_facts",
  cpa_tl: "cpa_tl_landing_facts",
  m1_top: "m1_landing_facts",
};

function offerImageUrl(source: OfferSource, row: BackfillOfferRow | undefined): string {
  if (!row) return "";
  if (source === "kma") return String(row.logo ?? "").trim();
  return String(row.picture_url ?? "").trim();
}

async function loadLandingFactsStatuses(
  source: OfferSource,
  ids: number[],
): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  if (!isLandingFactsContentSource(source) || ids.length === 0) return out;
  const { data, error } = await supabaseAdmin
    .from(LANDING_FACTS_TABLE[source])
    .select("offer_id, status")
    .in("offer_id", ids);
  if (error) {
    console.warn(`[backfill:${source}] landing facts status query failed:`, error.message);
    return out;
  }
  for (const row of data ?? []) {
    const id = Number((row as { offer_id: number }).offer_id);
    const status = String((row as { status?: string }).status ?? "").trim();
    if (Number.isFinite(id) && status) out.set(id, status);
  }
  return out;
}

async function loadImageFactsStatuses(
  source: OfferSource,
  ids: number[],
): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  if (ids.length === 0) return out;
  const { data, error } = await supabaseAdmin
    .from("offer_image_facts")
    .select("offer_id, status")
    .eq("source", source)
    .in("offer_id", ids);
  if (error) {
    console.warn(`[backfill:${source}] image facts status query failed:`, error.message);
    return out;
  }
  for (const row of data ?? []) {
    const id = Number((row as { offer_id: number }).offer_id);
    const status = String((row as { status?: string }).status ?? "").trim();
    if (Number.isFinite(id) && status) out.set(id, status);
  }
  return out;
}

async function loadActiveOfferRowsByIds(
  source: OfferSource,
  ids: number[],
): Promise<BackfillOfferRow[]> {
  if (ids.length === 0) return [];
  const rows: BackfillOfferRow[] = [];
  const chunkSize = 100;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { data, error } = await supabaseAdmin
      .from(TABLE[source])
      .select(OFFER_SELECT[source])
      .eq("is_active", true)
      .in("offer_id", chunk);
    if (error) {
      console.warn(`[backfill:${source}] offers by id failed:`, error.message);
      throw new Error(`[backfill:${source}] offers by id failed: ${error.message}`);
    }
    rows.push(...((data ?? []) as BackfillOfferRow[]));
  }
  return rows;
}

const ID_IN_CHUNK = 100;

async function loadContentCompletionForIds(
  source: OfferSource,
  ids: number[],
): Promise<{ complete: Set<number>; hashMap: Map<number, string> }> {
  const complete = new Set<number>();
  const hashMap = new Map<number, string>();
  if (ids.length === 0) return { complete, hashMap };
  for (let i = 0; i < ids.length; i += ID_IN_CHUNK) {
    const chunk = ids.slice(i, i + ID_IN_CHUNK);
    const { data, error } = await supabaseAdmin
      .from("product_content")
      .select("offer_id, display_title_uk, description_html_uk, faq_uk, source_hash")
      .eq("source", source)
      .in("offer_id", chunk);
    if (error) {
      console.warn(`[backfill:${source}] content by id failed:`, error.message);
      throw new Error(`[backfill:${source}] content by id failed: ${error.message}`);
    }
    for (const row of data ?? []) {
      const id = Number((row as { offer_id: number }).offer_id);
      const hash = (row as { source_hash?: string | null }).source_hash;
      if (hash) hashMap.set(id, String(hash));
      if (
        isContentComplete({
          display_title_uk: (row as { display_title_uk: string | null }).display_title_uk,
          description_html_uk: (row as { description_html_uk: string | null }).description_html_uk,
          faq_uk: (row as { faq_uk: unknown }).faq_uk,
        })
      ) {
        complete.add(id);
      }
    }
  }
  return { complete, hashMap };
}

/**
 * Newest-active missing AI IDs without paging the whole catalog.
 * scanCap IDs max, then one content .in() per 100 ids.
 */
export async function listMissingActiveOfferIdsBounded(
  source: OfferSource,
  opts?: { limit?: number; scanCap?: number },
): Promise<number[]> {
  const limit = opts?.limit ?? BOUNDED_MISSING_DRAIN_LIMIT;
  const scanCap = opts?.scanCap ?? BOUNDED_MISSING_SCAN_CAP;
  if (limit <= 0 || scanCap <= 0) return [];

  const windowIds: number[] = [];
  let from = 0;
  while (windowIds.length < scanCap) {
    const take = Math.min(BOUNDED_MISSING_PAGE_SIZE, scanCap - windowIds.length);
    const { data, error } = await supabaseAdmin
      .from(TABLE[source])
      .select("offer_id")
      .eq("is_active", true)
      .order("synced_at", { ascending: false })
      .order("offer_id", { ascending: false })
      .range(from, from + take - 1);
    if (error) {
      console.warn(`[backfill:${source}] bounded offers failed:`, error.message);
      throw new Error(`[backfill:${source}] bounded offers failed: ${error.message}`);
    }
    const page = (data ?? [])
      .map((r) => Number((r as { offer_id: number }).offer_id))
      .filter((id) => Number.isFinite(id));
    if (page.length === 0) break;
    windowIds.push(...page);
    if (page.length < take) break;
    from += take;
  }

  const { complete } = await loadContentCompletionForIds(source, windowIds);
  return filterIncompleteOfferIds(windowIds, complete, limit);
}

async function loadActiveOfferRows(source: OfferSource): Promise<BackfillOfferRow[]> {
  const rows: BackfillOfferRow[] = [];
  let from = 0;
  while (true) {
    let page: BackfillOfferRow[] = [];
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data, error } = await supabaseAdmin
        .from(TABLE[source])
        .select(OFFER_SELECT[source])
        .eq("is_active", true)
        .range(from, from + OFFER_ROWS_PAGE - 1);
      if (!error) {
        page = (data ?? []) as BackfillOfferRow[];
        break;
      }
      console.warn(
        `[backfill:${source}] offers page ${from} failed (attempt ${attempt}):`,
        error.message,
      );
      if (attempt < 3) await sleepMs(1500 * attempt);
    }
    if (page.length === 0) break;
    rows.push(...page);
    if (page.length < OFFER_ROWS_PAGE) break;
    from += OFFER_ROWS_PAGE;
  }
  return rows;
}

/** Pure gate for onlyMissing + regenStale job selection (unit-tested). */
export function shouldEnqueueBackfillJob(
  opts: {
    onlyMissing?: boolean;
    regenStale?: boolean;
    forceRegen?: boolean;
    regenMissingQa?: boolean;
  },
  state: { missingContent: boolean; stale: boolean; needsQa: boolean },
): boolean {
  if (opts.onlyMissing === true && opts.regenStale !== true) {
    return state.missingContent;
  }
  if (opts.onlyMissing === true && opts.regenStale === true) {
    return state.missingContent || state.stale;
  }
  const needsForce =
    opts.forceRegen === true &&
    (opts.onlyMissing !== true || state.stale || state.missingContent);
  return state.stale || state.needsQa || needsForce || state.missingContent;
}

export async function generateMissingContent(
  source: OfferSource,
  limit = 8,
  opts: {
    regenMissingQa?: boolean;
    deadlineAt?: number;
    categorySlug?: string;
    forceRegen?: boolean;
    /** Skip offers that already have UK+RU display titles (drain cron). */
    onlyMissing?: boolean;
    /** When set with onlyMissing, also regenerate rows whose source_hash is stale (e.g. feed price changed). */
    regenStale?: boolean;
    /** Use full limit and oldest/stale-first ordering (drain cron). */
    drainMode?: boolean;
    /** Local batch script: no deadline cap, full job limit, configurable concurrency. */
    localMode?: boolean;
    /** Parallel LLM jobs (default 2 worker, 3 local). */
    concurrency?: number;
    /** Skip first N offers in sorted target list (force-regen pagination). */
    startOffset?: number;
    /** Regenerate only these offer IDs (must be active in source table). */
    offerIds?: number[];
    /** Warm landing/image facts before skipping a not-ready offer. */
    allowWarmFactsBeforeClaim?: boolean;
  } = {},
): Promise<{
  checked: number;
  generated: number;
  failed: number;
  lockedSkipped: number;
  cooldownSkipped: number;
  factsPendingSkipped: number;
  cachedAfterFailure: number;
  warmedFacts: number;
}> {
  const claimReserveMs = opts.drainMode === true ? MIN_CONTENT_OFFER_MS : 22_000;
  const hasBudget = () =>
    opts.localMode === true ||
    !opts.deadlineAt ||
    opts.deadlineAt - Date.now() >= claimReserveMs;

  // Drain onlyMissing: bounded missing window, then load raw blobs only for candidates.
  let offerRows: BackfillOfferRow[];
  let haveHi: Set<number>;
  let hashMap = new Map<number, string>();
  const missingQa = new Set<number>();

  if (opts.drainMode === true && opts.onlyMissing === true && opts.regenStale !== true) {
    const materializeCap =
      opts.allowWarmFactsBeforeClaim === true
        ? Math.max(limit * 2, 4)
        : Math.max(limit * 4, 8);
    let missingIds: number[];
    if (opts.offerIds?.length) {
      // Caller already filtered missing IDs — do not spend another content .in() here.
      haveHi = new Set();
      hashMap = new Map();
      missingIds = opts.offerIds.slice(0, materializeCap);
    } else {
      missingIds = await listMissingActiveOfferIdsBounded(source, { limit: materializeCap });
      haveHi = new Set();
      hashMap = new Map();
    }
    offerRows = await loadActiveOfferRowsByIds(source, missingIds);
  } else {
    offerRows = await loadActiveOfferRows(source);
    if (opts.drainMode) {
      const index = await loadCompleteContentIndex(source);
      haveHi = index.haveComplete;
      hashMap = index.hashMap;
    } else {
      const completeIds = await loadCompleteOfferIds(source);
      haveHi = new Set(completeIds);
      const existing = await loadContentCompletionBySource(source);
      for (const r of existing) {
        hashMap.set(r.offer_id, r.source_hash);
        if (!r.qa_checked_at) missingQa.add(r.offer_id);
      }
    }
  }

  if (offerRows.length === 0) {
    return {
      checked: 0,
      generated: 0,
      failed: 0,
      lockedSkipped: 0,
      cooldownSkipped: 0,
      factsPendingSkipped: 0,
      cachedAfterFailure: 0,
      warmedFacts: 0,
    };
  }
  const offerIds = offerRows.map((r) => r.offer_id);
  const offerById = new Map(offerRows.map((r) => [r.offer_id, r]));
  const resolvedMap = await loadResolvedCategoryMap();
  const generationState = await loadGenerationState(source);

  // 3. Targets: offers missing content, stale hash drift, or missing QA audit.
  type Job = { offerId: number; categorySlug: string };
  const jobs: Job[] = [];
  let lockedSkipped = 0;
  let cooldownSkipped = 0;
  let factsPendingSkipped = 0;
  let warmedFacts = 0;
  const jobLimit =
    opts.localMode === true || opts.drainMode
      ? limit
      : opts.deadlineAt
        ? limit
        : Math.min(limit, 4);
  const singleWarmupDrainPass = opts.drainMode === true && opts.onlyMissing === true;
  let targetOfferIds = offerIds;
  if (opts.offerIds?.length) {
    const allow = new Set(opts.offerIds);
    targetOfferIds = offerIds.filter((id) => allow.has(id));
  }
  if (opts.onlyMissing === true && opts.regenStale !== true) {
    targetOfferIds = offerIds.filter((id) => !haveHi.has(id));
  }
  const nowMs = Date.now();
  const oldestFirst = opts.drainMode === true || opts.onlyMissing === true;
  targetOfferIds.sort((a, b) => {
    const pa = computeDrainPriority({
      missingContent: !haveHi.has(a),
      bareMissing: !haveHi.has(a) && !hashMap.has(a),
      failCount: Number(generationState.get(a)?.fail_count ?? 0),
      missingQa: missingQa.has(a),
      regenStaleComplete: opts.regenStale === true && haveHi.has(a),
      syncedAt: offerById.get(a)?.synced_at,
      nowMs,
      drainMode: opts.drainMode === true,
    });
    const pb = computeDrainPriority({
      missingContent: !haveHi.has(b),
      bareMissing: !haveHi.has(b) && !hashMap.has(b),
      failCount: Number(generationState.get(b)?.fail_count ?? 0),
      missingQa: missingQa.has(b),
      regenStaleComplete: opts.regenStale === true && haveHi.has(b),
      syncedAt: offerById.get(b)?.synced_at,
      nowMs,
      drainMode: opts.drainMode === true,
    });
    if (oldestFirst) {
      return compareDrainOfferOrder(
        { priority: pa, syncedAt: offerById.get(a)?.synced_at ?? "", id: a },
        { priority: pb, syncedAt: offerById.get(b)?.synced_at ?? "", id: b },
      );
    }
    // Non-drain force paths keep newest-first tie-break.
    if (pa !== pb) return pa - pb;
    return (offerById.get(b)?.synced_at ?? "").localeCompare(offerById.get(a)?.synced_at ?? "");
  });
  if (opts.startOffset && opts.startOffset > 0) {
    targetOfferIds = targetOfferIds.slice(opts.startOffset);
  }

  const imageFactsEnabled = isImageFactsEnabled();
  const landingStatuses = await loadLandingFactsStatuses(source, targetOfferIds);
  const imageStatuses = await loadImageFactsStatuses(source, targetOfferIds);
  const refreshFactsStatuses = async (id: number): Promise<void> => {
    const [landing, image] = await Promise.all([
      loadLandingFactsStatuses(source, [id]),
      loadImageFactsStatuses(source, [id]),
    ]);
    if (landing.has(id)) landingStatuses.set(id, landing.get(id) ?? "");
    else landingStatuses.delete(id);
    if (image.has(id)) imageStatuses.set(id, image.get(id) ?? "");
    else imageStatuses.delete(id);
  };

  const isFactsReady = (id: number): boolean => {
    const row = offerById.get(id);
    return offerFactsReadyForContent({
      source,
      hasExtractableLanding: hasExtractableLandingForSource(source, row?.raw),
      landingStatus: landingStatuses.get(id) ?? null,
      imageFactsEnabled,
      hasImageUrl: Boolean(offerImageUrl(source, row)),
      imageStatus: imageStatuses.get(id) ?? null,
      syncedAt: row?.synced_at ?? null,
      nowMs,
    });
  };

  for (const id of targetOfferIds) {
    if (!hasBudget()) break;
    const state = generationState.get(id);
    if (hasActiveLock(state)) {
      lockedSkipped += 1;
      continue;
    }
    if (hasFailureCooldown(state)) {
      cooldownSkipped += 1;
      continue;
    }
    if (!isFactsReady(id)) {
      const canWarmThisOffer =
        opts.allowWarmFactsBeforeClaim === true &&
        hasBudget() &&
        (!singleWarmupDrainPass || warmedFacts < MAX_DRAIN_FACTS_WARMUPS_PER_ROUND);
      if (canWarmThisOffer) {
        try {
          await warmOfferFactsBeforeContent(source, id);
          warmedFacts += 1;
          await refreshFactsStatuses(id);
        } catch (err) {
          console.warn(`[backfill:${source}] warm facts ${id} failed:`, err);
        }
      }
      if (!isFactsReady(id)) {
        factsPendingSkipped += 1;
        if (singleWarmupDrainPass && warmedFacts > 0) break;
        continue;
      }
    }
    const row = offerById.get(id);
    const categorySlug =
      resolvedMap.get(`${source}:${id}`) ??
      (row ? categorySlugFromRow(source, row) : "other");
    if (opts.categorySlug && categorySlug !== opts.categorySlug) continue;
    const missingContent = !haveHi.has(id);
    const needsQa = opts.regenMissingQa === true && missingQa.has(id);
    let stale = false;
    if (!needsQa && !opts.forceRegen && hashMap.has(id)) {
      try {
        const expected = await getExpectedSourceHash(source, id, categorySlug);
        if (expected) stale = expected !== hashMap.get(id);
        else if (haveHi.has(id)) stale = false;
      } catch (err) {
        console.warn(`[backfill:${source}] hash check ${id} failed:`, err);
      }
    }
    if (opts.onlyMissing === true && opts.regenStale !== true) {
      if (missingContent) jobs.push({ offerId: id, categorySlug });
      if (jobs.length >= jobLimit) break;
      continue;
    }
    if (
      shouldEnqueueBackfillJob(opts, { missingContent, stale, needsQa })
    ) {
      jobs.push({ offerId: id, categorySlug });
    }
    if (jobs.length >= jobLimit) break;
  }
  let generated = 0;
  let failed = 0;
  let cachedAfterFailure = 0;
  if (jobs.length === 0) {
    return {
      checked: targetOfferIds.length,
      generated: 0,
      failed: 0,
      lockedSkipped,
      cooldownSkipped,
      factsPendingSkipped,
      cachedAfterFailure: 0,
      warmedFacts,
    };
  }
  const forceRegen = opts.regenMissingQa === true || opts.forceRegen === true;
  const workerCount = opts.concurrency ?? (opts.localMode === true ? 3 : 2);
  await runWithConcurrency(
    jobs,
    workerCount,
    async (job) => {
      const started = Date.now();
      if (
        opts.localMode !== true &&
        opts.deadlineAt &&
        opts.deadlineAt - Date.now() < MIN_CONTENT_OFFER_MS
      ) {
        return;
      }
      const claim = await claimGenerationLock(source, job.offerId);
      if (!claim.ok) {
        if (claim.reason === "locked") lockedSkipped += 1;
        else if (claim.reason === "cooldown") cooldownSkipped += 1;
        else failed += 1;
        return;
      }
      let finished = false;
      try {
        // Soft wall deadline so CF hard-kill is a last resort (not the default path).
        // After warm, generate may return status "deferred" and yield the slot.
        const out = await getOrGenerateProductContentDetailed(
          source,
          job.offerId,
          "uk",
          job.categorySlug,
          { forceRegen, deadlineAt: opts.deadlineAt },
        );
        if (out.status === "generated" && out.content) {
          generated += 1;
          await clearGenerationState(source, job.offerId);
          markOfferContentComplete(source, job.offerId, out.content.source_hash ?? null);
          console.info(
            `[backfill:${source}] generated offer=${job.offerId} category=${job.categorySlug} ms=${Date.now() - started} force=${forceRegen} tokens=${out.metrics?.totalTokens ?? 0} retries=${out.metrics?.retries ?? 0}`,
          );
          // Indexing is notified inside getOrGenerateProductContentDetailed after persist.
          finished = true;
          return;
        }
        if (out.status === "cache_hit") {
          await unlockGenerationState(source, job.offerId);
          finished = true;
          return;
        }
        if (out.status === "deferred") {
          // Warm spent the tick — unlock without fail_count so next :30 can generate.
          await unlockGenerationState(source, job.offerId);
          console.info(
            `[backfill:${source}] deferred offer=${job.offerId} after warm/budget ms=${Date.now() - started}`,
          );
          finished = true;
          return;
        }
        if (out.status === "cached_after_failure") {
          cachedAfterFailure += 1;
        }
        failed += 1;
        await recordGenerationFailure(
          source,
          job.offerId,
          out.error ?? `Generation ended with status=${out.status}`,
        );
        finished = true;
      } catch (err) {
        console.warn(
          `[backfill:${source}] gen ${job.offerId} failed after ${Date.now() - started}ms:`,
          err,
        );
        failed += 1;
        await recordGenerationFailure(source, job.offerId, summarizeError(err));
        finished = true;
      } finally {
        if (!finished) {
          await unlockGenerationState(source, job.offerId);
        }
      }
    },
    hasBudget,
  );

  return {
    checked: targetOfferIds.length,
    generated,
    failed,
    lockedSkipped,
    cooldownSkipped,
    factsPendingSkipped,
    cachedAfterFailure,
    warmedFacts,
  };
}

async function countStaleOffers(
  source: OfferSource,
  offerRows: BackfillOfferRow[],
  haveHi: Set<number>,
  hashMap: Map<number, string>,
  resolvedMap: Map<string, string>,
): Promise<number> {
  let count = 0;
  for (const row of offerRows) {
    const id = row.offer_id;
    if (!haveHi.has(id)) continue;
    const categorySlug =
      resolvedMap.get(`${source}:${id}`) ?? categorySlugFromRow(source, row);
    let stale = false;
    const stored = hashMap.get(id);
    if (stored) {
      try {
        const expected = await getExpectedSourceHash(source, id, categorySlug);
        if (expected) stale = expected !== stored;
      } catch (err) {
        console.warn(`[backfill:${source}] stale count ${id} failed:`, err);
      }
    }
    if (stale) count += 1;
  }
  return count;
}

export type SourcePendingCounts = {
  missing: number;
  stale: number;
};

type ContentIndex = {
  offerIds: number[];
  haveComplete: Set<number>;
  hashMap: Map<number, string>;
};

const contentIndexCache = new Map<OfferSource, ContentIndex>();

/** Clear cached offer/content index (call at drain start/end). */
export function resetContentIndexCache(sources?: OfferSource[]): void {
  if (!sources) {
    contentIndexCache.clear();
    return;
  }
  for (const source of sources) contentIndexCache.delete(source);
}

/** Update in-memory index after a successful generation (avoids re-fetch counts). */
export function markOfferContentComplete(
  source: OfferSource,
  offerId: number,
  sourceHash?: string | null,
): void {
  const index = contentIndexCache.get(source);
  if (!index) return;
  if (!index.offerIds.includes(offerId)) index.offerIds.push(offerId);
  index.haveComplete.add(offerId);
  if (sourceHash) index.hashMap.set(offerId, sourceHash);
}

async function loadCompleteContentIndex(source: OfferSource): Promise<ContentIndex> {
  const cached = contentIndexCache.get(source);
  if (cached) return cached;

  // Paginated with large pages — PostgREST caps ~1000/req; tiny pages blow CF subrequest budget.
  // Hard maxPages so a Worker caller fails closed instead of a CF subrequest kill.
  const offerIds: number[] = [];
  {
    let from = 0;
    let pages = 0;
    const pageSize = CONTENT_INDEX_PAGE_SIZE;
    while (true) {
      if (pages >= CONTENT_INDEX_MAX_PAGES) {
        throw new Error(
          `[backfill:${source}] content index exceeded maxPages=${CONTENT_INDEX_MAX_PAGES} (use bounded drain)`,
        );
      }
      const { data, error } = await supabaseAdmin
        .from(TABLE[source])
        .select("offer_id")
        .eq("is_active", true)
        .range(from, from + pageSize - 1);
      if (error) {
        console.warn(`[backfill:${source}] count offers failed:`, error.message);
        throw new Error(`[backfill:${source}] count offers failed: ${error.message}`);
      }
      const page = data ?? [];
      for (const r of page) offerIds.push(r.offer_id as number);
      pages += 1;
      if (page.length < pageSize) break;
      from += pageSize;
    }
  }

  const haveComplete = new Set<number>();
  const hashMap = new Map<number, string>();
  {
    let from = 0;
    let pages = 0;
    const pageSize = CONTENT_INDEX_PAGE_SIZE;
    while (true) {
      if (pages >= CONTENT_INDEX_MAX_PAGES) {
        throw new Error(
          `[backfill:${source}] content index exceeded maxPages=${CONTENT_INDEX_MAX_PAGES} (use bounded drain)`,
        );
      }
      // Omit description_html_uk body — only need non-null proof + faq length (CF subrequest bandwidth).
      const { data, error } = await supabaseAdmin
        .from("product_content")
        .select("offer_id, display_title_uk, faq_uk, source_hash")
        .eq("source", source)
        .not("description_html_uk", "is", null)
        .range(from, from + pageSize - 1);
      if (error) {
        console.warn(`[backfill:${source}] count content failed:`, error.message);
        throw new Error(`[backfill:${source}] count content failed: ${error.message}`);
      }
      const page = data ?? [];
      for (const row of page) {
        const id = row.offer_id as number;
        if (isIndexContentComplete(row)) haveComplete.add(id);
        if (row.source_hash) hashMap.set(id, String(row.source_hash));
      }
      pages += 1;
      if (page.length < pageSize) break;
      from += pageSize;
    }
  }

  const built: ContentIndex = { offerIds, haveComplete, hashMap };
  contentIndexCache.set(source, built);
  return built;
}

/** Fast missing count — same completion logic as pipeline-status. */
export async function getSourceMissingCount(source: OfferSource): Promise<number> {
  const { offerIds, haveComplete } = await loadCompleteContentIndex(source);
  if (offerIds.length === 0) return 0;
  return offerIds.filter((id) => !haveComplete.has(id)).length;
}

/** Active offer IDs still missing complete AI content (for facts catch-up priority). */
export async function listSourceMissingOfferIds(
  source: OfferSource,
  opts?: { limit?: number },
): Promise<number[]> {
  const limit = opts?.limit ?? BOUNDED_MISSING_DRAIN_LIMIT;
  return listMissingActiveOfferIdsBounded(source, {
    limit,
    scanCap: BOUNDED_MISSING_SCAN_CAP,
  });
}

/** Stale hash drift among offers that already have complete content. */
export async function getSourceStaleCount(source: OfferSource): Promise<number> {
  const { haveComplete, hashMap } = await loadCompleteContentIndex(source);
  if (haveComplete.size === 0) return 0;
  const offerRows = await loadActiveOfferRows(source);
  const resolvedMap = await loadResolvedCategoryMap();
  return countStaleOffers(source, offerRows, haveComplete, hashMap, resolvedMap);
}

/** Single-pass missing + stale counts. */
export async function getSourcePendingCounts(
  source: OfferSource,
): Promise<SourcePendingCounts> {
  const missing = await getSourceMissingCount(source);
  const stale = missing === 0 ? await getSourceStaleCount(source) : 0;
  return { missing, stale };
}

/** Count active offers still needing AI content (for drain logging). */
export async function countPendingContent(
  source: OfferSource,
  opts?: { includeStale?: boolean },
): Promise<number> {
  const missing = await getSourceMissingCount(source);
  if (!opts?.includeStale) return missing;
  const stale = await getSourceStaleCount(source);
  return missing + stale;
}

/** Active offers lacking AI content (no stale hash drift). */
export async function countMissingContent(source: OfferSource): Promise<number> {
  return getSourceMissingCount(source);
}

/** Active offers with content whose source_hash no longer matches the feed. */
export async function countStaleContent(source: OfferSource): Promise<number> {
  return getSourceStaleCount(source);
}

export type GenerateNewContentResult = {
  content: {
    rounds: Awaited<ReturnType<typeof generateMissingContent>>[];
    totalGenerated: number;
    totalFailed: number;
  };
  timedOut: boolean;
  missingRemaining: number;
};

/** Sync path: generate missing AI content one offer at a time until done or deadline. */
export async function generateNewContent(
  source: OfferSource,
  opts: {
    deadlineMs?: number;
    offerIds?: number[];
    allowWarmFactsBeforeClaim?: boolean;
    maxRounds?: number;
  } = {},
): Promise<GenerateNewContentResult> {
  const started = Date.now();
  const deadlineMs = opts.deadlineMs ?? 55_000;
  const reserveMs = 3500;
  const deadlineAt = started + deadlineMs - reserveMs;
  const hasBudget = () => Date.now() < deadlineAt - 2000;

  const rounds: Awaited<ReturnType<typeof generateMissingContent>>[] = [];
  let totalGenerated = 0;
  let totalFailed = 0;

  if (!ENABLE_AI_CONTENT) {
    return {
      content: { rounds, totalGenerated, totalFailed },
      timedOut: false,
      missingRemaining: 0,
    };
  }

  await releaseStaleLocks(source);

  let remainingIds =
    opts.offerIds?.length
      ? [...opts.offerIds]
      : await listMissingActiveOfferIdsBounded(source, { limit: BOUNDED_MISSING_DRAIN_LIMIT });

  while (hasBudget()) {
    if (opts.maxRounds != null && rounds.length >= Math.max(0, opts.maxRounds)) break;
    if (remainingIds.length === 0) break;

    const r = await generateMissingContent(source, 1, {
      deadlineAt,
      onlyMissing: true,
      concurrency: 1,
      drainMode: true,
      offerIds: remainingIds,
      allowWarmFactsBeforeClaim: opts.allowWarmFactsBeforeClaim,
    });
    rounds.push(r);
    totalGenerated += r.generated;
    totalFailed += r.failed;

    if (r.generated > 0) {
      const { complete } = await loadContentCompletionForIds(source, remainingIds);
      remainingIds = filterIncompleteOfferIds(remainingIds, complete);
      continue;
    }
    if (r.failed > 0) continue; // recorded + cooldown; try another offer while budget remains
    if (shouldYieldAfterWarmOnlyRound(r)) break;
    if (r.lockedSkipped > 0) {
      const released = await releaseStaleLocks(source);
      if (released > 0) continue;
    }
    // No progress this round (all cooling / facts-pending / empty) — stop this source.
    break;
  }

  return {
    content: { rounds, totalGenerated, totalFailed },
    timedOut: Date.now() >= deadlineAt - reserveMs,
    missingRemaining: remainingIds.length,
  };
}

/** @deprecated Use generateNewContent — kept for hook response shape compatibility. */
export async function postSyncBackfill(
  source: OfferSource,
  opts: { deadlineMs?: number; aiLimit?: number } = {},
): Promise<{
  content: {
    rounds: Awaited<ReturnType<typeof generateMissingContent>>[];
    totalGenerated: number;
  };
  timedOut: boolean;
}> {
  const result = await generateNewContent(source, { deadlineMs: opts.deadlineMs });
  return {
    content: {
      rounds: result.content.rounds,
      totalGenerated: result.content.totalGenerated,
    },
    timedOut: result.timedOut,
  };
}

/** No-op: cross-category purpose-ban purge removed in v52-no-forbidden-bans. */
export async function purgeContaminatedRows(
  _source: OfferSource,
  _limit = 200,
): Promise<{ scanned: number; flagged: number }> {
  return { scanned: 0, flagged: 0 };
}

/**
 * Backfill `form_kind` on product_content rows that don't have one yet.
 * Cheap: just re-runs `computeFormKind` on the raw feed; no AI calls.
 * Idempotent — only touches rows where form_kind IS NULL.
 */
export async function recomputeFormKinds(
  source: OfferSource,
  limit = 200,
  opts: { force?: boolean; deadlineAt?: number } = {},
): Promise<{ scanned: number; updated: number }> {
  const hasBudget = () => !opts.deadlineAt || Date.now() < opts.deadlineAt - 2000;
  let query = supabaseAdmin
    .from("product_content")
    .select("offer_id, form_kind")
    .eq("source", source)
    .limit(limit);
  if (!opts.force) query = query.is("form_kind", null);
  const { data, error } = await query;
  if (error || !data) {
    console.warn(`[form-kind:${source}] query failed:`, error?.message);
    return { scanned: 0, updated: 0 };
  }
  let updated = 0;
  for (const r of data as { offer_id: number }[]) {
    if (!hasBudget()) break;
    const offer = await findOfferById(r.offer_id).catch(() => null);
    if (!offer || offer.source !== source) continue;
    try {
      const kind = await computeFormKind(source, r.offer_id, offer.categorySlug);
      if (!kind) continue;
      const { error: updErr } = await supabaseAdmin
        .from("product_content")
        .update({ form_kind: kind })
        .eq("source", source)
        .eq("offer_id", r.offer_id);
      if (!updErr) updated += 1;
    } catch (err) {
      console.warn(`[form-kind:${source}] recompute ${r.offer_id} failed:`, err);
    }
  }
  return { scanned: data.length, updated };
}


/**
 * One-shot cleanup: light tail-only scrub on stored display titles.
 * Brand prefix is kept verbatim; geo markers stripped only when space/paren-delimited.
 * No AI calls — pure regex pass.
 */
export async function cleanupDisplayTitles(
  source: OfferSource,
  limit = 500,
  opts: { deadlineAt?: number } = {},
): Promise<{ scanned: number; updated: number }> {
  const { sanitizeDisplayTitle } = await import("./brand-clean");
  const hasBudget = () => !opts.deadlineAt || Date.now() < opts.deadlineAt - 2000;
  const { data, error } = await supabaseAdmin
    .from("product_content")
    .select("offer_id, display_title_ru, display_title_uk")
    .eq("source", source)
    .limit(limit);
  if (error || !data) {
    console.warn(`[cleanup-titles:${source}] query failed:`, error?.message);
    return { scanned: 0, updated: 0 };
  }
  let updated = 0;
  for (const r of data as { offer_id: number; display_title_ru: string | null; display_title_uk: string | null }[]) {
    if (!hasBudget()) break;
    const ruClean = r.display_title_ru ? sanitizeDisplayTitle(r.display_title_ru) : null;
    const ukClean = r.display_title_uk ? sanitizeDisplayTitle(r.display_title_uk) : null;
    const patch: { display_title_ru?: string; display_title_uk?: string } = {};
    if (ruClean && ruClean !== r.display_title_ru) patch.display_title_ru = ruClean;
    if (ukClean && ukClean !== r.display_title_uk) patch.display_title_uk = ukClean;
    if (Object.keys(patch).length === 0) continue;
    const { error: updErr } = await supabaseAdmin
      .from("product_content")
      .update(patch)
      .eq("source", source)
      .eq("offer_id", r.offer_id);
    if (!updErr) updated += 1;
  }
  return { scanned: data.length, updated };
}




/**
 * Re-translate `display_title_ru` / `display_title_uk` rows where the
 * translated tail still contains an English descriptor word (LLM kept
 * "POTENCY TREATMENT" / "JOINT CARE" verbatim because the brand happens
 * to be Cyrillic and the old splitBrandAndTail couldn't separate them).
 *
 * Pulls the raw feed title for each candidate via findOfferById and
 * reruns the canonical pipeline (splitBrandAndTail + computeDisplayTitles)
 * by invoking getOrGenerateProductContent with forceRegen=true. Bounded
 * by `limit` and the wall-clock deadline.
 */
export async function retranslateDisplayTitles(
  source: OfferSource,
  _limit = 50,
  _opts: { deadlineAt?: number } = {},
): Promise<{ scanned: number; updated: number; failed: number }> {
  void source;
  return { scanned: 0, updated: 0, failed: 0 };
}

/**
 * Fix UK/RU display-title brand parity for rows where the Latin brand from
 * the feed was lost during translation (e.g. Shiseydo+ present in RU but
 * missing in UK). Pure join fix — no AI calls.
 */
export async function fixBrandParity(
  source: OfferSource,
  limit = 500,
  opts: { deadlineAt?: number } = {},
): Promise<{ scanned: number; updated: number }> {
  const { assertDisplayTitleParity, sanitizeDisplayTitle } = await import("./brand-clean");
  const hasBudget = () => !opts.deadlineAt || Date.now() < opts.deadlineAt - 2000;
  const { data, error } = await supabaseAdmin
    .from("product_content")
    .select("offer_id, display_title_ru, display_title_uk")
    .eq("source", source)
    .limit(limit);
  if (error || !data) {
    console.warn(`[fix-brand-parity:${source}] query failed:`, error?.message);
    return { scanned: 0, updated: 0 };
  }
  let updated = 0;
  for (const r of data as { offer_id: number; display_title_ru: string | null; display_title_uk: string | null }[]) {
    if (!hasBudget()) break;
    const offer = await findOfferById(r.offer_id).catch(() => null);
    if (!offer || offer.source !== source || !offer.title) continue;
    const parity = assertDisplayTitleParity(
      r.display_title_uk ?? "",
      r.display_title_ru ?? "",
      offer.title,
    );
    if (parity.ok || !parity.uk || !parity.ru) continue;
    const patch = {
      display_title_uk: sanitizeDisplayTitle(parity.uk) || parity.uk,
      display_title_ru: sanitizeDisplayTitle(parity.ru) || parity.ru,
    };
    const { error: updErr } = await supabaseAdmin
      .from("product_content")
      .update(patch)
      .eq("source", source)
      .eq("offer_id", r.offer_id);
    if (!updErr) {
      updated += 1;
      console.info(`[fix-brand-parity:${source}] offer=${r.offer_id} uk="${patch.display_title_uk}" ru="${patch.display_title_ru}"`);
    }
  }
  return { scanned: data.length, updated };
}

function reviewsLen(raw: unknown): number {
  return Array.isArray(raw) ? raw.length : 0;
}

/**
 * Fill missing LLM reviews on existing product_content (HTML untouched).
 */
export async function regenMissingReviews(
  source: OfferSource,
  limit = 5,
  opts: { deadlineAt?: number } = {},
): Promise<{ scanned: number; updated: number; failed: number }> {
  const hasBudget = () => !opts.deadlineAt || Date.now() < opts.deadlineAt - 2000;
  const { data, error } = await supabaseAdmin
    .from("product_content")
    .select("offer_id, reviews_uk, display_title_uk")
    .eq("source", source)
    .not("display_title_uk", "is", null)
    .not("description_html_uk", "is", null)
    .limit(Math.max(limit * 4, 40));
  if (error || !data) {
    console.warn(`[reviews:${source}] query failed:`, error?.message);
    return { scanned: 0, updated: 0, failed: 0 };
  }

  const resolvedMap = await loadResolvedCategoryMap().catch(() => new Map<string, string>());
  let updated = 0;
  let failed = 0;
  let scanned = 0;
  for (const r of data as { offer_id: number; reviews_uk: unknown; display_title_uk: string | null }[]) {
    if (!hasBudget() || updated + failed >= limit) break;
    if (reviewsLen(r.reviews_uk) >= reviewCountFor(r.offer_id)) continue;
    scanned += 1;
    const cat =
      resolvedMap.get(`${source}:${r.offer_id}`) ||
      (await findOfferById(r.offer_id).catch(() => null))?.categorySlug ||
      "other";
    const res = await generateReviewsOnlyForOffer(source, r.offer_id, cat);
    if (res.ok) {
      updated += 1;
      console.info(`[reviews:${source}] offer=${r.offer_id} count=${res.count}`);
    } else {
      failed += 1;
      console.warn(`[reviews:${source}] offer=${r.offer_id} fail=${res.error}`);
    }
  }
  return { scanned, updated, failed };
}
