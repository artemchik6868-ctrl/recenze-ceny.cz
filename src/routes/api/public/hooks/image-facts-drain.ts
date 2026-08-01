import { createFileRoute } from "@tanstack/react-router";
import { checkHookSecret } from "@/lib/hook-auth";
import {
  drainOfferImageFacts,
  IMAGE_FACTS_DRAIN_DEADLINE_MS,
} from "@/lib/image-facts.server";
import { isImageFactsEnabled } from "@/lib/image-facts";

/**
 * Manual drain for image-facts (requires IMAGE_FACTS_ENABLED=1).
 * Also runs from scheduled-tick (limit=3) when enabled.
 *
 *   GET .../image-facts-drain?secret=...&limit=3&deadline_ms=30000
 */
async function run(request: Request) {
  const unauthorized = checkHookSecret(request);
  if (unauthorized) return unauthorized;

  if (!isImageFactsEnabled()) {
    return Response.json({
      ok: false,
      error: "IMAGE_FACTS_ENABLED is off — refuse mass drain (use smoke-image-facts)",
    });
  }

  const url = new URL(request.url);
  const deadlineMs = Number(
    url.searchParams.get("deadline_ms") ?? String(IMAGE_FACTS_DRAIN_DEADLINE_MS),
  );
  const limit = Number(url.searchParams.get("limit") ?? "3");
  const cap = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 5) : 3;

  const result = await drainOfferImageFacts({
    deadlineMs: Number.isFinite(deadlineMs) ? deadlineMs : IMAGE_FACTS_DRAIN_DEADLINE_MS,
    limit: cap,
  });
  return Response.json({ ok: true, ...result });
}

export const Route = createFileRoute("/api/public/hooks/image-facts-drain")({
  server: {
    handlers: {
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request),
    },
  },
});
