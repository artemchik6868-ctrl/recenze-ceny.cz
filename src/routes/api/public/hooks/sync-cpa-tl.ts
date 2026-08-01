import { createFileRoute } from "@tanstack/react-router";
import { syncCpaTlOffers } from "@/lib/cpa-tl-sync.server";
import { generateNewContent, purgeContaminatedRows } from "@/lib/content-backfill.server";
import { checkHookSecret } from "@/lib/hook-auth";

async function run(request: Request) {
  const unauthorized = checkHookSecret(request);
  if (unauthorized) return unauthorized;
  try {
    const result = await syncCpaTlOffers();
    // Best-effort post-sync work — capped to fit the request window.
    await purgeContaminatedRows("cpa_tl", 300).catch((e) => console.warn("purge failed", e));
    const backfill = await generateNewContent("cpa_tl");
    return Response.json({
      ok: true,
      ...result,
      backfill,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("sync-cpa-tl failed:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/sync-cpa-tl")({
  server: {
    handlers: {
      POST: ({ request }) => run(request),
      GET: ({ request }) => run(request),
    },
  },
});
