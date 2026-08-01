// Daily GSC inspection + smart re-notify for non-indexed product URLs.
//
// Query params:
//   inspect_limit — max GSC URL Inspection calls (default 100)
//   notify_limit  — max URLs to re-ping IndexNow/Google (default 50, capped by Google 200/day)
//   dry_run       — 1: real GSC inspect (uses quota), no DB upserts, no re-notify pings

import { createFileRoute } from "@tanstack/react-router";
import { checkHookSecret } from "@/lib/hook-auth";
import { runIndexingRetry } from "@/lib/indexing-retry.server";

async function run(request: Request) {
  const unauthorized = checkHookSecret(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const inspectLimit = Math.min(500, Number(url.searchParams.get("inspect_limit") ?? "100"));
  const notifyLimit = Math.min(200, Number(url.searchParams.get("notify_limit") ?? "50"));
  const dryRun = url.searchParams.get("dry_run") === "1";

  try {
    const result = await runIndexingRetry({ inspectLimit, notifyLimit, dryRun });
    console.info(
      `[indexing-retry] inspected=${result.inspected} indexed=${result.indexedFound} notIndexed=${result.notIndexed} inspectErrors=${result.inspectErrors} retried=${result.retried} dryRun=${result.dryRun}`,
    );
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[indexing-retry] failed:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/indexing-retry")({
  server: {
    handlers: {
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request),
    },
  },
});
