import { createFileRoute } from "@tanstack/react-router";
import { syncShakesOffers } from "@/lib/shakes-sync.server";
import { generateNewContent, purgeContaminatedRows } from "@/lib/content-backfill.server";
import { checkHookSecret } from "@/lib/hook-auth";

async function run(request: Request) {
  const unauthorized = checkHookSecret(request);
  if (unauthorized) return unauthorized;
  try {
    const result = await syncShakesOffers();
    await purgeContaminatedRows("shakes", 300).catch((e) => console.warn("purge failed", e));
    const backfill = await generateNewContent("shakes");
    return Response.json({
      ok: true,
      ...result,
      backfill,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("sync-shakes failed:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/sync-shakes")({
  server: {
    handlers: {
      POST: ({ request }) => run(request),
      GET: ({ request }) => run(request),
    },
  },
});
