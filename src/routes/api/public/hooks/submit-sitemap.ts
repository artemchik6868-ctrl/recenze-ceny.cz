// Resubmit sitemap.xml to Google Search Console (Sitemaps API).
// Weekly cron: Mon 07:00 UTC via scheduled-tick. Call manually after big catalog changes.
//
// Query params:
//   dry_run — 1: only GET sitemap status from GSC (no submit)

import { createFileRoute } from "@tanstack/react-router";
import { checkHookSecret } from "@/lib/hook-auth";
import { runSitemapSubmit } from "@/lib/gsc-sitemap.server";

async function run(request: Request) {
  const unauthorized = checkHookSecret(request);
  if (unauthorized) return unauthorized;

  const dryRun = new URL(request.url).searchParams.get("dry_run") === "1";

  try {
    const result = await runSitemapSubmit({ dryRun });
    console.info(
      `[submit-sitemap] ok=${result.ok} submitted=${result.submitted} dryRun=${result.dryRun} errors=${result.status?.errors ?? "-"} warnings=${result.status?.warnings ?? "-"}`,
    );
    return Response.json(result, { status: result.ok || result.skipped ? 200 : 502 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[submit-sitemap] failed:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/submit-sitemap")({
  server: {
    handlers: {
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request),
    },
  },
});
