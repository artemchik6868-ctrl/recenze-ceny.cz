// Emergency Worker-side feed ingest. Prefer Node: `npx tsx scripts/sync-feeds-local.ts`.
// Locked so it cannot run deactivate in parallel with GHA.
//
//   curl "https://recenze-ceny.cz/api/public/hooks/sync-feeds?secret=$HOOK_SECRET"

import { createFileRoute } from "@tanstack/react-router";
import { syncAllFeedsExclusive } from "@/lib/content-pipeline.server";
import { checkHookSecret } from "@/lib/hook-auth";

async function run(request: Request) {
  const unauthorized = checkHookSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await syncAllFeedsExclusive("worker:sync-feeds");
    if (result.lock === "busy") {
      return Response.json({ ok: false, error: "lock_busy" }, { status: 409 });
    }
    console.info(
      `[sync-feeds] done elapsed=${result.elapsed_ms}ms failed=${result.failed.join(",") || "none"}`,
    );
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-feeds] failed:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/sync-feeds")({
  server: {
    handlers: {
      POST: ({ request }) => run(request),
      GET: ({ request }) => run(request),
    },
  },
});
