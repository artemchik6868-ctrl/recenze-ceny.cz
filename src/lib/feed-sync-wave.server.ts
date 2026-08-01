/**
 * Durable feed-sync wave: one work unit per Worker invocation so Cloudflare
 * subrequest budgets reset between partners / pagination chunks.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import { PIPELINE_SOURCES, SYNC_FNS } from "./content-pipeline.server";
import {
  syncCpagettiOffersChunk,
  type FeedPageCursor,
} from "./cpagetti-sync.server";
import {
  syncAdcomboOffersChunk,
  type AdcomboPageCursor,
} from "./adcombo-sync.server";
import type { OfferSource } from "./types";

const WAVE_ROW_ID = 1;
/** Reseed if an unfinished wave is older than this. */
export const WAVE_STALE_MS = 26 * 60 * 60 * 1000;

export type FeedWaveCursor = FeedPageCursor | AdcomboPageCursor;

export type FeedWaveState = {
  pending: OfferSource[];
  active_source: OfferSource | null;
  active_cursor: FeedWaveCursor | null;
  wave_id: string;
  started_at: string;
  updated_at: string;
  last_error: string | null;
  last_result: Record<string, unknown> | null;
};

export type FeedUnitResult = {
  ok: boolean;
  source: OfferSource | null;
  done: boolean;
  waveDone: boolean;
  stats: Record<string, unknown>;
  error?: string;
  pending: OfferSource[];
  active_source: OfferSource | null;
  wave_id: string;
};

function isOfferSource(v: string): v is OfferSource {
  return (PIPELINE_SOURCES as string[]).includes(v);
}

function parseCursor(raw: Json | null): FeedWaveCursor | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.kind !== "page" || typeof o.offset !== "number") return null;
  return raw as unknown as FeedWaveCursor;
}

function emptyState(partial?: Partial<FeedWaveState>): FeedWaveState {
  const now = new Date().toISOString();
  return {
    pending: [],
    active_source: null,
    active_cursor: null,
    wave_id: crypto.randomUUID(),
    started_at: now,
    updated_at: now,
    last_error: null,
    last_result: null,
    ...partial,
  };
}

export function isWaveActive(state: FeedWaveState): boolean {
  return Boolean(state.active_source) || state.pending.length > 0;
}

export async function loadWave(): Promise<FeedWaveState> {
  const { data, error } = await supabaseAdmin
    .from("pipeline_feed_wave")
    .select(
      "pending, active_source, active_cursor, wave_id, started_at, updated_at, last_error, last_result",
    )
    .eq("id", WAVE_ROW_ID)
    .maybeSingle();

  if (error) throw new Error(`load pipeline_feed_wave: ${error.message}`);
  if (!data) {
    return emptyState();
  }

  const rawPending = data.pending ?? [];
  const pending = rawPending.filter(isOfferSource);
  const active =
    data.active_source && isOfferSource(data.active_source) ? data.active_source : null;

  // Drop retired-partner errors so ops alerts stay clean after TerraLeads removal.
  let last_error = data.last_error ?? null;
  if (typeof last_error === "string" && /^terraleads:/i.test(last_error)) {
    last_error = null;
  }

  const state: FeedWaveState = {
    pending,
    active_source: active,
    active_cursor: active ? parseCursor(data.active_cursor) : null,
    wave_id: data.wave_id,
    started_at: data.started_at,
    updated_at: data.updated_at,
    last_error,
    last_result:
      data.last_result && typeof data.last_result === "object" && !Array.isArray(data.last_result)
        ? (data.last_result as Record<string, unknown>)
        : null,
  };

  const scrubbed =
    last_error !== (data.last_error ?? null) ||
    pending.length !== rawPending.length ||
    active !== (data.active_source ?? null);
  if (scrubbed) {
    await saveWave(state);
  }

  return state;
}

async function saveWave(state: FeedWaveState): Promise<void> {
  const updated_at = new Date().toISOString();
  const { error } = await supabaseAdmin.from("pipeline_feed_wave").upsert(
    {
      id: WAVE_ROW_ID,
      pending: state.pending,
      active_source: state.active_source,
      active_cursor: (state.active_cursor ?? null) as Json | null,
      wave_id: state.wave_id,
      started_at: state.started_at,
      updated_at,
      last_error: state.last_error,
      last_result: (state.last_result ?? null) as Json | null,
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(`save pipeline_feed_wave: ${error.message}`);
  state.updated_at = updated_at;
}

/** Seed a new wave when idle or stale. Does not drain. */
export async function ensureWave(opts: { force?: boolean } = {}): Promise<FeedWaveState> {
  const state = await loadWave();
  const startedMs = Date.parse(state.started_at);
  const stale =
    isWaveActive(state) &&
    Number.isFinite(startedMs) &&
    Date.now() - startedMs > WAVE_STALE_MS;

  if (!opts.force && isWaveActive(state) && !stale) {
    return state;
  }

  const seeded = emptyState({
    pending: [...PIPELINE_SOURCES],
    active_source: null,
    active_cursor: null,
    last_error: stale ? `reseeded after stale wave (${state.wave_id})` : null,
  });
  await saveWave(seeded);
  console.info(
    `[feed-wave] seeded wave_id=${seeded.wave_id} sources=${seeded.pending.length}${stale ? " (stale reset)" : ""}`,
  );
  return seeded;
}

async function runChunkedSource(
  source: "cpagetti" | "adcombo",
  cursor: FeedWaveCursor | null,
): Promise<{ done: boolean; nextCursor?: FeedWaveCursor; stats: Record<string, unknown> }> {
  if (source === "cpagetti") {
    const result = await syncCpagettiOffersChunk({
      cursor: cursor && cursor.kind === "page" ? (cursor as FeedPageCursor) : null,
    });
    return {
      done: result.done,
      nextCursor: result.nextCursor,
      stats: result.stats,
    };
  }
  const result = await syncAdcomboOffersChunk({
    cursor: cursor && cursor.kind === "page" ? (cursor as AdcomboPageCursor) : null,
  });
  return {
    done: result.done,
    nextCursor: result.nextCursor,
    stats: result.stats,
  };
}

/**
 * Drain one work unit: either a full light-source sync, or one pagination chunk
 * of cpagetti/adcombo. Persists queue state. On error, leaves work in place.
 */
export async function drainNextFeedUnit(): Promise<FeedUnitResult> {
  let state = await loadWave();

  if (!isWaveActive(state)) {
    return {
      ok: true,
      source: null,
      done: true,
      waveDone: true,
      stats: { skipped: "wave_idle" },
      pending: [],
      active_source: null,
      wave_id: state.wave_id,
    };
  }

  let source = state.active_source;
  let cursor = state.active_cursor;

  if (!source) {
    source = state.pending[0] ?? null;
    if (!source) {
      return {
        ok: true,
        source: null,
        done: true,
        waveDone: true,
        stats: { skipped: "empty_pending" },
        pending: [],
        active_source: null,
        wave_id: state.wave_id,
      };
    }
    state.pending = state.pending.slice(1);
    state.active_source = source;
    state.active_cursor = null;
    cursor = null;
    await saveWave(state);
  }

  try {
    let done = false;
    let stats: Record<string, unknown> = {};

    if (source === "cpagetti" || source === "adcombo") {
      const chunk = await runChunkedSource(source, cursor);
      stats = chunk.stats;
      done = chunk.done;
      if (!done && chunk.nextCursor) {
        state.active_source = source;
        state.active_cursor = chunk.nextCursor;
        state.last_error = null;
        state.last_result = { source, ...stats };
        await saveWave(state);
        console.info(
          `[feed-wave] ${source} chunk progress fetched=${stats.fetched} pending=${state.pending.length}`,
        );
        return {
          ok: true,
          source,
          done: false,
          waveDone: false,
          stats,
          pending: state.pending,
          active_source: state.active_source,
          wave_id: state.wave_id,
        };
      }
    } else {
      stats = await SYNC_FNS[source]();
      done = true;
    }

    state.active_source = null;
    state.active_cursor = null;
    state.last_error = null;
    state.last_result = { source, ...stats };
    const waveDone = !isWaveActive(state);
    await saveWave(state);
    console.info(
      `[feed-wave] ${source} done waveDone=${waveDone} pending=${state.pending.join(",") || "none"}`,
    );
    return {
      ok: true,
      source,
      done,
      waveDone,
      stats,
      pending: state.pending,
      active_source: null,
      wave_id: state.wave_id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Skip this source for the rest of the wave (don't block content-drain forever).
    // Next ensureWave()/02:00 reseed will retry it with a fresh subrequest budget.
    state.active_source = null;
    state.active_cursor = null;
    state.last_error = `${source}: ${message}`;
    state.last_result = { source, error: message };
    const waveDone = !isWaveActive(state);
    await saveWave(state);
    console.warn(`[feed-wave] ${source} failed (skipped for this wave):`, message);
    return {
      ok: false,
      source,
      done: false,
      waveDone,
      stats: {},
      error: message,
      pending: state.pending,
      active_source: null,
      wave_id: state.wave_id,
    };
  }
}

export async function getFeedWaveStatus(): Promise<{
  active: boolean;
  pending: OfferSource[];
  active_source: OfferSource | null;
  has_cursor: boolean;
  wave_id: string;
  started_at: string;
  updated_at: string;
  last_error: string | null;
  last_result: Record<string, unknown> | null;
}> {
  const state = await loadWave();
  return {
    active: isWaveActive(state),
    pending: state.pending,
    active_source: state.active_source,
    has_cursor: Boolean(state.active_cursor),
    wave_id: state.wave_id,
    started_at: state.started_at,
    updated_at: state.updated_at,
    last_error: state.last_error,
    last_result: state.last_result,
  };
}
