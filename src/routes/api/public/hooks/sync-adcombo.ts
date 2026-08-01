import { createFileRoute } from "@tanstack/react-router";
import { syncAdcomboOffers } from "@/lib/adcombo-sync.server";
import { generateNewContent, purgeContaminatedRows } from "@/lib/content-backfill.server";
import { checkHookSecret } from "@/lib/hook-auth";

async function run(request: Request) {
  const unauthorized = checkHookSecret(request);
  if (unauthorized) return unauthorized;
  try {
    const result = await syncAdcomboOffers();
    await purgeContaminatedRows("adcombo", 300).catch((e) => console.warn("purge failed", e));
    const backfill = await generateNewContent("adcombo");
    return Response.json({
      ok: true,
      ...result,
      backfill,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("sync-adcombo failed:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/sync-adcombo")({
  server: {
    handlers: {
      POST: ({ request }) => run(request),
      GET: ({ request }) => run(request),
    },
  },
});
