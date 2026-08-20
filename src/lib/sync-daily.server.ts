import { retireFeedWave } from "./feed-sync-wave.server";
import type { OfferSource } from "./types";

export type DailySyncSourceResult = {
  sync: Record<string, unknown> | { error: string };
  content: { skipped: string };
};

export type DailySyncResult = {
  ok: true;
  elapsed_ms: number;
  timedOut: boolean;
  skipped?: string;
  sources: Partial<Record<OfferSource, DailySyncSourceResult>>;
  remaining_work: OfferSource[];
  wave: {
    wave_id: string;
    pending: OfferSource[];
    active_source: OfferSource | null;
    waveDone: boolean;
  };
};

/**
 * Worker cron no longer paginates CPA feeds (Node/GHA does).
 * This hook retires leftover wave state and tells callers to use sync-feeds-local.
 */
export async function runDailySync(
  _opts: { deadlineMs?: number; forceSeed?: boolean } = {},
): Promise<DailySyncResult> {
  const started = Date.now();
  const wave = await retireFeedWave("feed sync moved to Node/GHA");
  return {
    ok: true,
    elapsed_ms: Date.now() - started,
    timedOut: false,
    skipped: "feed_sync_moved_to_node",
    sources: {},
    remaining_work: [],
    wave: {
      wave_id: wave.wave_id,
      pending: [],
      active_source: null,
      waveDone: true,
    },
  };
}
