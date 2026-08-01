import {
  ensureWave,
  drainNextFeedUnit,
  isWaveActive,
  loadWave,
  type FeedUnitResult,
} from "./feed-sync-wave.server";
import type { OfferSource } from "./types";

export type DailySyncSourceResult = {
  sync: Record<string, unknown> | { error: string };
  content: { skipped: string };
};

export type DailySyncResult = {
  ok: true;
  elapsed_ms: number;
  timedOut: boolean;
  sources: Partial<Record<OfferSource, DailySyncSourceResult>>;
  remaining_work: OfferSource[];
  wave: {
    wave_id: string;
    pending: OfferSource[];
    active_source: OfferSource | null;
    waveDone: boolean;
  };
  unit: FeedUnitResult;
};

/**
 * Seed (if needed) and drain one feed-sync work unit.
 * AI content is intentionally not generated here — content-drain handles it.
 */
export async function runDailySync(
  opts: { deadlineMs?: number; forceSeed?: boolean } = {},
): Promise<DailySyncResult> {
  const started = Date.now();
  void opts.deadlineMs; // kept for hook API compatibility; units are budget-isolated

  await ensureWave({ force: opts.forceSeed === true });
  const unit = await drainNextFeedUnit();
  const state = await loadWave();

  const sources: Partial<Record<OfferSource, DailySyncSourceResult>> = {};
  if (unit.source) {
    sources[unit.source] = {
      sync: unit.ok ? unit.stats : { error: unit.error ?? "unknown" },
      content: { skipped: "deferred_to_content_drain" },
    };
  }

  const remaining_work: OfferSource[] = [
    ...(state.active_source ? [state.active_source] : []),
    ...state.pending,
  ];

  console.info(
    `[sync-daily] unit source=${unit.source ?? "none"} ok=${unit.ok} waveDone=${unit.waveDone} remaining=${remaining_work.join(",") || "none"} elapsed=${Date.now() - started}ms`,
  );

  return {
    ok: true,
    elapsed_ms: Date.now() - started,
    timedOut: isWaveActive(state),
    sources,
    remaining_work,
    wave: {
      wave_id: state.wave_id,
      pending: state.pending,
      active_source: state.active_source,
      waveDone: !isWaveActive(state),
    },
    unit,
  };
}
