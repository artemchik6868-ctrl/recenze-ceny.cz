/** Pure feed-sync safety helpers (no I/O). */

export const DEACTIVATE_DROP_RATIO = 0.3;
export const DEACTIVATE_DROP_MIN_PREVIOUS = 10;
/** Alert when a partner table has not been synced this long (daily GHA + slack). */
export const FEED_SYNC_STALE_MS = 36 * 60 * 60 * 1000;

export function shouldDeactivateCatalog(opts: {
  previousActive: number;
  incomingAllowed: number;
  dropRatio?: number;
  minPrevious?: number;
}): { ok: true } | { ok: false; reason: string } {
  const dropRatio = opts.dropRatio ?? DEACTIVATE_DROP_RATIO;
  const minPrevious = opts.minPrevious ?? DEACTIVATE_DROP_MIN_PREVIOUS;
  const previous = opts.previousActive;
  const incoming = opts.incomingAllowed;

  if (incoming <= 0 && previous > 0) {
    return { ok: false, reason: `incomingAllowed=0 previousActive=${previous}` };
  }
  if (previous < minPrevious) return { ok: true };
  const floor = previous * (1 - dropRatio);
  if (incoming < floor) {
    return {
      ok: false,
      reason: `allowed ${incoming} < ${(1 - dropRatio) * 100}% of active ${previous}`,
    };
  }
  return { ok: true };
}

export function isFeedPageExhausted(opts: {
  httpStatus: number;
  pageLength: number;
  pageSize: number;
  offset?: number;
  total?: number | null;
}): boolean {
  if (opts.httpStatus !== 200) return false;
  if (opts.pageLength < opts.pageSize) return true;
  if (
    opts.total != null &&
    Number.isFinite(opts.total) &&
    opts.offset != null &&
    opts.offset + opts.pageLength >= opts.total
  ) {
    return true;
  }
  return false;
}

/** Empty page in the middle of a known catalog is an error, not EOF. */
export function emptyPageBeforeEndError(opts: {
  offset: number;
  pageLength: number;
  total?: number | null;
}): string | null {
  if (opts.pageLength > 0) return null;
  if (opts.offset === 0) return null;
  if (opts.total != null && Number.isFinite(opts.total) && opts.offset < opts.total) {
    return `empty page at offset=${opts.offset} before total=${opts.total}`;
  }
  return null;
}

/** Page sizes to try when CPAgetti 500s on a large page (payload too heavy). */
export const CPAGETTI_PAGE_LIMITS = [100, 10, 1] as const;

export function nextCpagettiPageLimit(limit: number): number | null {
  const i = (CPAGETTI_PAGE_LIMITS as readonly number[]).indexOf(limit);
  if (i < 0) return CPAGETTI_PAGE_LIMITS[1];
  if (i >= CPAGETTI_PAGE_LIMITS.length - 1) return null;
  return CPAGETTI_PAGE_LIMITS[i + 1];
}

/** Incomplete page list (poison skips) must not deactivate unseen live rows. */
export function shouldDeactivateAfterSkips(skippedOffsets: number): boolean {
  return skippedOffsets <= 0;
}

/** Record a poison feed offset (limit=1 still 5xx). Idempotent. */
export function recordCpagettiSkippedOffset(
  list: readonly number[],
  offset: number,
): number[] {
  if (list.includes(offset)) return [...list];
  return [...list, offset];
}

/** Drop offsets recovered by a later limit=1 fetch. */
export function recoverCpagettiSkippedOffsets(
  list: readonly number[],
  recovered: readonly number[],
): number[] {
  const drop = new Set(recovered);
  return list.filter((offset) => !drop.has(offset));
}

/**
 * After limit=1 still 5xx, a full-backoff retry that returns 200 is not a skip.
 * Non-200 (including 5xx) still counts as poison.
 */
export function shouldCountCpagettiPoisonSkip(retryStatus: number): boolean {
  return retryStatus !== 200;
}

/** Telegram / log suffix: skippedOffsets=1 offsets=847 */
export function formatCpagettiSkipSuffix(opts: {
  skippedOffsets?: unknown;
  skippedOffsetList?: unknown;
}): string {
  const list = Array.isArray(opts.skippedOffsetList)
    ? opts.skippedOffsetList.map((n) => Number(n)).filter((n) => Number.isFinite(n))
    : [];
  const n =
    typeof opts.skippedOffsets === "number" && Number.isFinite(opts.skippedOffsets)
      ? opts.skippedOffsets
      : list.length;
  if (n <= 0) return "";
  const ids = list.length > 0 ? ` offsets=${list.join(",")}` : "";
  return ` skippedOffsets=${n}${ids}`;
}

export function parseCpagettiFeedJson(text: string): {
  offers: unknown[];
  total: number | null;
} {
  let json: { response?: unknown; info?: { total?: number | string } };
  try {
    json = JSON.parse(text) as { response?: unknown; info?: { total?: number | string } };
  } catch {
    throw new Error("CPAgetti feed: non-JSON response");
  }
  const resp = json?.response;
  let offers: unknown[] = [];
  if (Array.isArray(resp)) offers = resp;
  else if (resp && typeof resp === "object") offers = Object.values(resp);
  const rawTotal = json?.info?.total;
  const total =
    rawTotal != null && Number.isFinite(Number(rawTotal)) ? Number(rawTotal) : null;
  return { offers, total };
}

const SECRET_QUERY_KEYS = ["token", "api_key", "key", "secret", "password"];

export function redactSecretsInUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const k of SECRET_QUERY_KEYS) {
      if (u.searchParams.has(k)) u.searchParams.set(k, "***");
    }
    return u.toString();
  } catch {
    return "[unparseable-url]";
  }
}

export function feedSyncSourceHasError(
  result: Record<string, unknown> | { error: string },
): boolean {
  return typeof (result as { error?: unknown }).error === "string";
}

/**
 * Source did not finish a complete catalog pass.
 * Must not mark the UTC day done (GHA retries), and must not deactivate.
 */
export function feedSyncSourceIsIncomplete(
  result: Record<string, unknown> | { error: string },
): boolean {
  if (feedSyncSourceHasError(result)) return false;
  const row = result as Record<string, unknown>;
  if (typeof row.skipped === "string" && row.skipped.length > 0) return true;
  if (typeof row.skippedOffsets === "number" && row.skippedOffsets > 0) return true;
  return false;
}
