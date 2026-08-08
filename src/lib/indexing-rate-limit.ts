/**
 * IndexNow host rate-limit helpers (pure — no DB / fetch).
 * Hard errors page ops; 429 / rate_limited do not.
 */

export const INDEXNOW_CHUNK_SIZE = 20;
/** After a 429, skip IndexNow/Seznam for this long (shared via indexing_log). */
export const INDEXNOW_COOLDOWN_MS = 15 * 60 * 1000;
/** Sentinel URL stored when host enters cooldown (one row per event). */
export const INDEXNOW_COOLDOWN_SENTINEL = "https://recenze-ceny.cz/__indexnow_cooldown";

const RATE_LIMIT_RE = /\b429\b|TooManyRequests|rate[\s_-]?limit/i;

export function isIndexNowRateLimitHttpStatus(status: number): boolean {
  return status === 429;
}

export function isIndexNowRateLimitErrorText(error: string | null | undefined): boolean {
  if (!error) return false;
  return RATE_LIMIT_RE.test(String(error));
}

/** True when an indexing_log row should count as a hard (pageable) error. */
export function isHardIndexingLogError(opts: {
  status: string | null | undefined;
  error?: string | null;
}): boolean {
  const status = String(opts.status ?? "").toLowerCase();
  if (status === "rate_limited" || status === "skipped_quota" || status === "skipped_config") {
    return false;
  }
  if (status !== "error") return false;
  return !isIndexNowRateLimitErrorText(opts.error);
}

/** Parse Retry-After header (seconds or HTTP-date) → ms delay, else null. */
export function parseRetryAfterMs(
  header: string | null | undefined,
  nowMs = Date.now(),
): number | null {
  if (!header) return null;
  const trimmed = String(header).trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    const sec = Number(trimmed);
    if (!Number.isFinite(sec) || sec < 0) return null;
    return Math.min(sec * 1000, 60 * 60 * 1000);
  }
  const when = Date.parse(trimmed);
  if (!Number.isFinite(when)) return null;
  return Math.max(0, Math.min(when - nowMs, 60 * 60 * 1000));
}

export function cooldownUntilFromRetryAfter(
  retryAfterMs: number | null,
  nowMs = Date.now(),
  fallbackMs = INDEXNOW_COOLDOWN_MS,
): string {
  const ms = retryAfterMs != null && retryAfterMs > 0 ? retryAfterMs : fallbackMs;
  return new Date(nowMs + ms).toISOString();
}

export function formatCooldownError(untilIso: string): string {
  return `cooldown_until=${untilIso}`;
}

export function parseCooldownUntilIso(error: string | null | undefined): string | null {
  if (!error) return null;
  const m = String(error).match(/cooldown_until=(\S+)/);
  return m?.[1] ?? null;
}

/** True if cooldown marker says we are still in the quiet period. */
export function isCooldownActive(
  opts: {
    createdAt?: string | null;
    error?: string | null;
    cooldownMs?: number;
  },
  nowMs = Date.now(),
): boolean {
  const until = parseCooldownUntilIso(opts.error);
  if (until) {
    const ts = Date.parse(until);
    if (Number.isFinite(ts)) return nowMs < ts;
  }
  if (opts.createdAt) {
    const created = Date.parse(opts.createdAt);
    if (Number.isFinite(created)) {
      return nowMs < created + (opts.cooldownMs ?? INDEXNOW_COOLDOWN_MS);
    }
  }
  return false;
}

/** Prioritize preferred offer ids at the front of a drain queue (stable). */
export function prioritizeOfferIds(queue: number[], preferIds: number[]): number[] {
  if (!preferIds.length || !queue.length) return queue;
  const prefer = new Set(preferIds.filter((n) => Number.isFinite(n)));
  if (prefer.size === 0) return queue;
  const head: number[] = [];
  const rest: number[] = [];
  for (const id of queue) {
    if (prefer.has(id)) head.push(id);
    else rest.push(id);
  }
  return [...head, ...rest];
}
