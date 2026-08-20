// Feed ingest moved to Node/GHA (`scripts/sync-feeds-local.ts`).
// This hook only retires leftover pipeline_feed_wave state.
//
//   curl "https://recenze-ceny.cz/api/public/hooks/sync-daily?secret=$HOOK_SECRET"

import { createFileRoute } from "@tanstack/react-router";
import { runDailySync } from "@/lib/sync-daily.server";
import { checkHookSecret } from "@/lib/hook-auth";

async function run(request: Request) {
  const unauthorized = checkHookSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await runDailySync();
    console.info(
      `[sync-daily] skipped=${result.skipped} elapsed=${result.elapsed_ms}ms`,
    );
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-daily] failed:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/sync-daily")({
  server: {
    handlers: {
      POST: ({ request }) => run(request),
      GET: ({ request }) => run(request),
    },
  },
});
