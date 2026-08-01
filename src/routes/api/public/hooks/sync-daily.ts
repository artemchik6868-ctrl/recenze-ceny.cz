// Daily feed-sync wave: seed queue + drain one work unit per call.
// AI content is deferred to content-drain (separate cron slots).
//
// Production cron: Cloudflare Cron Trigger runs tasks/scheduled-tick.ts every 30 min.
// 02:00 UTC seeds the wave and drains one unit; later */30 ticks continue the wave
// until empty, then run landing-facts + content-drain. 06:00 = indexing-retry.
// Mon 07:00 UTC = GSC sitemap resubmit (submit-sitemap hook).
//
// Disable any legacy HandyHost/ISPmanager cron for this hook to avoid duplicate runs.
//
// Manual test (one unit):
//   curl "https://recenze-ceny.cz/api/public/hooks/sync-daily?secret=$HOOK_SECRET"
// Call repeatedly (or wait for cron) until remaining_work is empty.
// Force a fresh wave: ?force_seed=1

import { createFileRoute } from "@tanstack/react-router";
import { runDailySync } from "@/lib/sync-daily.server";
import { checkHookSecret } from "@/lib/hook-auth";

async function run(request: Request) {
  const unauthorized = checkHookSecret(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const forceSeed = url.searchParams.get("force_seed") === "1";

  try {
    const result = await runDailySync({ forceSeed });
    console.info(
      `[sync-daily] done elapsed=${result.elapsed_ms}ms timedOut=${result.timedOut} remaining=${result.remaining_work.join(",") || "none"} wave=${result.wave.wave_id}`,
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
