/** Resolve catalogue-first-seen timestamp; falls back to last sync time. */
export function resolveFirstSeenAt(row: {
  first_seen_at?: string | null;
  synced_at: string;
}): string {
  return row.first_seen_at ?? row.synced_at;
}

/** PostgREST / Postgres error when migration 20260613130000 was not applied yet. */
export function isMissingFirstSeenColumnError(message: string): boolean {
  return (
    /first_seen_at/i.test(message) &&
    (/does not exist/i.test(message) ||
      /Could not find/i.test(message) ||
      /column/i.test(message))
  );
}
