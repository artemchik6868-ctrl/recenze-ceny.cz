/** Shared content-gen failure cooldown / quarantine (backfill + pipeline-status). */

export const FAILURE_BASE_COOLDOWN_MS = 5 * 60 * 1000;
export const MAX_FAILURE_COOLDOWN_MS = 6 * 60 * 60 * 1000;
/** After this many fails, park the offer for a day so one poison ID cannot monopolize cron. */
export const QUARANTINE_AFTER_FAILS = 3;
export const QUARANTINE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
/** Align with health stale threshold (missing AI > 2h). */
export const CONTENT_STALE_MS = 2 * 60 * 60 * 1000;

export function computeFailureCooldownMs(failCount: number): number {
  if (failCount >= QUARANTINE_AFTER_FAILS) return QUARANTINE_COOLDOWN_MS;
  return Math.min(
    MAX_FAILURE_COOLDOWN_MS,
    FAILURE_BASE_COOLDOWN_MS * 2 ** Math.max(0, failCount - 1),
  );
}
