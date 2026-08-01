import { createFileRoute } from "@tanstack/react-router";
import { checkHookSecret } from "@/lib/hook-auth";
import {
  drainCpaTlLandingFacts,
  drainM1TopLandingFacts,
  drainShakesLandingFacts,
  LANDING_FACTS_DRAIN_DEADLINE_MS,
} from "@/lib/landing-facts.server";

/**
 * Drain: LLM extract + upsert landing facts for pending active offers.
 *
 *   GET /api/public/hooks/landing-facts-drain?secret=...&deadline_ms=30000&limit=5
 *   GET ...&source=shakes|m1_top|cpa_tl|all  (default: all)
 */
async function run(request: Request) {
  const unauthorized = checkHookSecret(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const deadlineMs = Number(
    url.searchParams.get("deadline_ms") ?? String(LANDING_FACTS_DRAIN_DEADLINE_MS),
  );
  const limit = Number(url.searchParams.get("limit") ?? "5");
  const sourceRaw = String(url.searchParams.get("source") ?? "all")
    .trim()
    .toLowerCase();
  const source =
    sourceRaw === "shakes" ||
    sourceRaw === "m1_top" ||
    sourceRaw === "cpa_tl" ||
    sourceRaw === "all"
      ? sourceRaw
      : "all";
  const budget = Number.isFinite(deadlineMs) ? deadlineMs : LANDING_FACTS_DRAIN_DEADLINE_MS;
  const cap = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 20) : 5;

  try {
    if (source === "shakes") {
      const result = await drainShakesLandingFacts({ deadlineMs: budget, limit: cap });
      console.info(
        `[landing-facts-drain] shakes processed=${result.processed} ok=${result.okCount} failed=${result.failed} remaining=${result.remaining} ms=${result.elapsed_ms}`,
      );
      return Response.json({ source: "shakes", ...result });
    }
    if (source === "m1_top") {
      const result = await drainM1TopLandingFacts({ deadlineMs: budget, limit: cap });
      console.info(
        `[landing-facts-drain] m1_top processed=${result.processed} ok=${result.okCount} failed=${result.failed} remaining=${result.remaining} ms=${result.elapsed_ms}`,
      );
      return Response.json({ source: "m1_top", ...result });
    }
    if (source === "cpa_tl") {
      const result = await drainCpaTlLandingFacts({ deadlineMs: budget, limit: cap });
      console.info(
        `[landing-facts-drain] cpa_tl processed=${result.processed} ok=${result.okCount} failed=${result.failed} remaining=${result.remaining} ms=${result.elapsed_ms}`,
      );
      return Response.json({ source: "cpa_tl", ...result });
    }

    const third = Math.max(5_000, Math.floor(budget / 3));
    const perLimit = Math.max(1, Math.ceil(cap / 3));
    const shakes = await drainShakesLandingFacts({ deadlineMs: third, limit: perLimit });
    const afterShakes = Math.max(5_000, budget - shakes.elapsed_ms);
    const m1Budget = Math.max(5_000, Math.floor(afterShakes / 2));
    const m1 = await drainM1TopLandingFacts({ deadlineMs: m1Budget, limit: perLimit });
    const cpaBudget = Math.max(5_000, budget - shakes.elapsed_ms - m1.elapsed_ms);
    const cpa = await drainCpaTlLandingFacts({ deadlineMs: cpaBudget, limit: perLimit });
    console.info(
      `[landing-facts-drain] all shakes ok=${shakes.okCount}/${shakes.processed} m1 ok=${m1.okCount}/${m1.processed} cpa_tl ok=${cpa.okCount}/${cpa.processed}`,
    );
    return Response.json({
      ok: true,
      source: "all",
      elapsed_ms: shakes.elapsed_ms + m1.elapsed_ms + cpa.elapsed_ms,
      shakes,
      m1_top: m1,
      cpa_tl: cpa,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[landing-facts-drain] failed:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/landing-facts-drain")({
  server: {
    handlers: {
      GET: ({ request }) => run(request),
      POST: ({ request }) => run(request),
    },
  },
});
