import { createFileRoute } from "@tanstack/react-router";
import { getPipelineStatus } from "@/lib/pipeline-status.server";
import { checkHookSecret } from "@/lib/hook-auth";

async function run(request: Request) {
  const unauthorized = checkHookSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const status = await getPipelineStatus();
    return Response.json(status, { status: status.ok ? 200 : 503 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[pipeline-status] failed:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/pipeline-status")({
  server: {
    handlers: {
      POST: ({ request }) => run(request),
      GET: ({ request }) => run(request),
    },
  },
});
