/** Pure half-hour workstream split for scheduled-tick (no server imports). */

export type ScheduledTickWorkstream = "facts" | "content";

/** True when this half-hour cron fired at top of hour (~:00 UTC). */
export function isTopOfHourUtc(minute: number): boolean {
  return minute < 20;
}

/**
 * After special hours / feed-wave: :00 = landing+image, :30 = content+reviews.
 * Keeps one cron trigger while giving content-drain a full wall budget.
 */
export function scheduledTickWorkstream(utcMinute: number): ScheduledTickWorkstream {
  return isTopOfHourUtc(utcMinute) ? "facts" : "content";
}
