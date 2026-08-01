import { createFileRoute } from "@tanstack/react-router";

/** Lightweight liveness probe — no Supabase / catalog I/O. */
function health() {
  return Response.json(
    { ok: true, t: Date.now() },
    {
      status: 200,
      headers: { "cache-control": "no-store" },
    },
  );
}

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: () => health(),
      HEAD: () => health(),
    },
  },
});
