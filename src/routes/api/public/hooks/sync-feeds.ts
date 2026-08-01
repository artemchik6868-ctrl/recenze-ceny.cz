// Feed sync + generate missing AI content per source.
//
// Manual (until custom domain NS propagate):
//   curl "https://recenze-ceny.cz/api/public/hooks/sync-feeds?secret=$HOOK_SECRET"

import { createFileRoute } from "@tanstack/react-router";
import { syncAllFeeds, PIPELINE_SOURCES } from "@/lib/content-pipeline.server";
import { generateNewContent } from "@/lib/content-backfill.server";
import { checkHookSecret } from "@/lib/hook-auth";
import { ENABLE_AI_CONTENT } from "@/lib/market";

async function run(request: Request) {
  const unauthorized = checkHookSecret(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const deadlineMs = Number(url.searchParams.get("deadline_ms") ?? "55000");
  const perSourceMs = Math.max(15_000, Math.floor(deadlineMs / PIPELINE_SOURCES.length));

  try {
    const result = await syncAllFeeds();
    const content: Record<string, unknown> = {};

    if (ENABLE_AI_CONTENT) {
      for (const source of PIPELINE_SOURCES) {
        if (result.sync[source] && "error" in result.sync[source]) continue;
        content[source] = await generateNewContent(source, { deadlineMs: perSourceMs });
      }
    }

    console.info(`[sync-feeds] done elapsed=${result.elapsed_ms}ms`);
    return Response.json({ ...result, content });
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
