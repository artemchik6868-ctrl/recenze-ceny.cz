import { createFileRoute } from "@tanstack/react-router";
import { checkHookSecret } from "@/lib/hook-auth";
import {
  extractAndStoreImageFacts,
  drainOfferImageFacts,
  IMAGE_FACTS_DRAIN_DEADLINE_MS,
} from "@/lib/image-facts.server";
import { isImageFactsSource } from "@/lib/image-facts";
import type { OfferSource } from "@/lib/types";

/**
 * Smoke / tiny drain for product-image vision facts.
 *
 *   GET .../smoke-image-facts?secret=...&source=shakes&offer_id=12197
 *   GET .../smoke-image-facts?secret=...&source=shakes&offer_id=12197&write_db=0
 *   GET .../smoke-image-facts?secret=...&drain=1&limit=3
 *
 * Does NOT require IMAGE_FACTS_ENABLED (sets smoke mode). Mass cron stays off.
 */
async function run(request: Request) {
  const unauthorized = checkHookSecret(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const drain = url.searchParams.get("drain") === "1";

  if (drain) {
    const prevSmoke = process.env.IMAGE_FACTS_SMOKE;
    const prevEnabled = process.env.IMAGE_FACTS_ENABLED;
    // Tiny manual drain for worker test — temporarily allow enabled path.
    process.env.IMAGE_FACTS_SMOKE = "1";
    process.env.IMAGE_FACTS_ENABLED = "1";
    try {
      const deadlineMs = Number(
        url.searchParams.get("deadline_ms") ?? String(IMAGE_FACTS_DRAIN_DEADLINE_MS),
      );
      const limit = Number(url.searchParams.get("limit") ?? "3");
      const cap = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 5) : 3;
      const result = await drainOfferImageFacts({
        deadlineMs: Number.isFinite(deadlineMs) ? deadlineMs : IMAGE_FACTS_DRAIN_DEADLINE_MS,
        limit: cap,
      });
      return Response.json({ ok: true, mode: "drain", ...result });
    } finally {
      if (prevSmoke === undefined) delete process.env.IMAGE_FACTS_SMOKE;
      else process.env.IMAGE_FACTS_SMOKE = prevSmoke;
      if (prevEnabled === undefined) delete process.env.IMAGE_FACTS_ENABLED;
      else process.env.IMAGE_FACTS_ENABLED = prevEnabled;
    }
  }

  const offerId = Number(url.searchParams.get("offer_id") || "");
  if (!Number.isFinite(offerId) || offerId <= 0) {
    return Response.json({ ok: false, error: "offer_id required" }, { status: 400 });
  }

  const sourceRaw = String(url.searchParams.get("source") || "shakes")
    .trim()
    .toLowerCase();
  if (!isImageFactsSource(sourceRaw)) {
    return Response.json(
      {
        ok: false,
        error: "source must be one of cpa_tl|kma|m1_top|cpagetti|adcombo|shakes",
      },
      { status: 400 },
    );
  }
  const source = sourceRaw as OfferSource;
  const writeDb = url.searchParams.get("write_db") !== "0";
  const force = url.searchParams.get("force") === "1";

  const started = Date.now();
  const prevSmoke = process.env.IMAGE_FACTS_SMOKE;
  process.env.IMAGE_FACTS_SMOKE = "1";

  try {
    const row = await extractAndStoreImageFacts({
      source,
      offerId,
      writeDb,
      smoke: true,
      force,
    });
    return Response.json({
      ok: row.status === "ok",
      mode: "extract",
      source,
      offerId,
      force,
      elapsed_ms: Date.now() - started,
      status: row.status,
      method: row.method,
      model: row.model ?? null,
      generationId: row.generationId ?? null,
      imageUrl: row.imageUrl,
      imageHash: row.imageHash,
      jsonChars: row.jsonChars,
      llmAttempts: row.llmAttempts,
      timing: row.timing,
      usage: row.usage ?? null,
      facts: row.facts,
      promptBlock: row.promptBlock,
      error: row.error ?? null,
      wroteDb: row.wroteDb,
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        elapsed_ms: Date.now() - started,
      },
      { status: 500 },
    );
  } finally {
    if (prevSmoke === undefined) delete process.env.IMAGE_FACTS_SMOKE;
    else process.env.IMAGE_FACTS_SMOKE = prevSmoke;
  }
}

export const Route = createFileRoute("/api/public/hooks/smoke-image-facts")({
  server: {
    handlers: {
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request),
    },
  },
});
