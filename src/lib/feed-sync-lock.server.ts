import { supabaseAdmin } from "@/integrations/supabase/client.server";

const LOCK_ID = 1;
/** Slightly above GHA job timeout (50m) so a killed runner expires before the next hourly backup. */
export const FEED_SYNC_LOCK_TTL_MS = 55 * 60 * 1000;

function isMissingLockTable(message: string): boolean {
  return (
    /feed_sync_lock/i.test(message) &&
    /does not exist|schema cache|PGRST205|Could not find/i.test(message)
  );
}

/**
 * Single-row CAS lock so Node/GHA and Worker hooks cannot deactivate in parallel.
 * If the migration is not applied yet, logs and proceeds (fail-open).
 */
export async function tryAcquireFeedSyncLock(
  holder: string,
  ttlMs = FEED_SYNC_LOCK_TTL_MS,
): Promise<boolean> {
  const now = new Date();
  const expires = new Date(now.getTime() + ttlMs).toISOString();
  const nowIso = now.toISOString();
  try {
    const { data, error } = await supabaseAdmin
      .from("feed_sync_lock")
      .update({
        holder,
        locked_at: nowIso,
        expires_at: expires,
      })
      .eq("id", LOCK_ID)
      .lt("expires_at", nowIso)
      .select("id");
    if (error) {
      if (isMissingLockTable(error.message)) {
        console.warn("[feed-sync] feed_sync_lock table missing — lock skipped");
        return true;
      }
      throw new Error(`acquire feed_sync_lock: ${error.message}`);
    }
    return Array.isArray(data) && data.length > 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isMissingLockTable(message)) {
      console.warn("[feed-sync] feed_sync_lock table missing — lock skipped");
      return true;
    }
    throw err;
  }
}

export async function releaseFeedSyncLock(holder: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from("feed_sync_lock")
      .update({
        holder: null,
        locked_at: null,
        expires_at: "1970-01-01T00:00:00.000Z",
      })
      .eq("id", LOCK_ID)
      .eq("holder", holder);
    if (error && !isMissingLockTable(error.message)) {
      console.warn(`[feed-sync] release lock failed: ${error.message}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!isMissingLockTable(message)) {
      console.warn(`[feed-sync] release lock failed: ${message}`);
    }
  }
}
