import { createFileRoute } from "@tanstack/react-router";
import { checkHookSecret } from "@/lib/hook-auth";
import {
  loadLiveShakesLandingFacts,
  loadLiveShakesLandingFactsWithLlm,
  loadLiveCpaTlLandingFacts,
  loadLiveCpaTlLandingFactsWithLlm,
} from "@/lib/landing-facts.server";
import { getOrGenerateProductContentDetailed } from "@/lib/ai-content.server";
import type { OfferSource } from "@/lib/types";

/**
 * Smoke: live landing fetch + compact facts + force AI generate.
 *
 *   GET /api/public/hooks/smoke-landing-facts?secret=...&offer_id=5911
 *   GET /api/public/hooks/smoke-landing-facts?secret=...&offer_id=5911&mode=llm
 *   GET /api/public/hooks/smoke-landing-facts?secret=...&source=cpa_tl&offer_id=21180&mode=llm
 *
 * Default source=shakes. For cpa_tl sets CPA_TL_LANDING_FACTS_LIVE / _LLM for this request.
 */
async function run(request: Request) {
  const unauthorized = checkHookSecret(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const offerId = Number(url.searchParams.get("offer_id") || "");
  if (!Number.isFinite(offerId) || offerId <= 0) {
    return Response.json({ ok: false, error: "offer_id required" }, { status: 400 });
  }

  const sourceRaw = String(url.searchParams.get("source") || "shakes")
    .trim()
    .toLowerCase();
  const source: OfferSource = sourceRaw === "cpa_tl" ? "cpa_tl" : "shakes";
  if (sourceRaw !== "shakes" && sourceRaw !== "cpa_tl") {
    return Response.json(
      { ok: false, error: "source must be shakes or cpa_tl" },
      { status: 400 },
    );
  }

  const mode = String(url.searchParams.get("mode") || "heuristic")
    .trim()
    .toLowerCase();
  const useLlm = mode === "llm";

  const started = Date.now();
  const prevLive = process.env.LANDING_FACTS_LIVE;
  const prevLlm = process.env.LANDING_FACTS_LLM;
  const prevCpaLive = process.env.CPA_TL_LANDING_FACTS_LIVE;
  const prevCpaLlm = process.env.CPA_TL_LANDING_FACTS_LLM;

  if (source === "shakes") {
    process.env.LANDING_FACTS_LIVE = useLlm ? "llm" : "1";
    if (useLlm) process.env.LANDING_FACTS_LLM = "1";
    else delete process.env.LANDING_FACTS_LLM;
  } else {
    process.env.CPA_TL_LANDING_FACTS_LIVE = useLlm ? "llm" : "1";
    if (useLlm) process.env.CPA_TL_LANDING_FACTS_LLM = "1";
    else delete process.env.CPA_TL_LANDING_FACTS_LLM;
  }

  try {
    // Skip a separate landing extract: getOrGenerate already injects live facts
    // when CPA_TL_LANDING_FACTS_* / LANDING_FACTS_* are set (avoids Worker 1102).
    const extractOnly = url.searchParams.get("extract_only") === "1";
    const landing = extractOnly
      ? source === "cpa_tl"
        ? useLlm
          ? await loadLiveCpaTlLandingFactsWithLlm(offerId)
          : await loadLiveCpaTlLandingFacts(offerId)
        : useLlm
          ? await loadLiveShakesLandingFactsWithLlm(offerId)
          : await loadLiveShakesLandingFacts(offerId)
      : null;

    const genStarted = Date.now();
    const generated = extractOnly
      ? null
      : await getOrGenerateProductContentDetailed(source, offerId, "uk", "other", {
          forceRegen: true,
        });
    const genMs = Date.now() - genStarted;
    const html = generated?.content?.description_html ?? "";

    return Response.json({
      ok: extractOnly
        ? landing?.status === "ok"
        : generated?.status === "generated" || generated?.status === "cache_hit",
      offerId,
      source,
      mode: useLlm ? "llm" : "heuristic",
      elapsed_ms: Date.now() - started,
      landing: landing
        ? {
            status: landing.status,
            langHint: landing.langHint,
            sourceUrl: landing.sourceUrl,
            jsonChars: landing.jsonChars,
            fullTextChars: landing.fullTextChars,
            method: landing.method ?? (useLlm ? "llm" : "heuristic"),
            usage: "usage" in landing ? landing.usage ?? null : null,
            facts: landing.facts,
            promptBlock: landing.promptBlock,
            timing: landing.timing,
            error: landing.error ?? null,
          }
        : {
            status: "injected_in_generate",
            note: "Landing facts loaded inside getOrGenerate (set extract_only=1 to inspect)",
          },
      generate: generated
        ? {
            status: generated.status,
            error: generated.error ?? null,
            saved: generated.saved,
            genMs,
            metrics: generated.metrics ?? null,
            displayTitle: generated.content?.display_title ?? null,
            htmlLen: html.length,
            htmlPreview: html.slice(0, 500),
            hasSlozeni: /složen/i.test(html),
            hasNavod: /návod|použití/i.test(html),
            hasFormHint: /gel|kapsle|kapky|krém/i.test(html),
          }
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[smoke-landing-facts] source=${source} offer=${offerId} mode=${mode} failed:`,
      message,
    );
    return Response.json(
      {
        ok: false,
        offerId,
        source,
        mode: useLlm ? "llm" : "heuristic",
        error: message,
        elapsed_ms: Date.now() - started,
      },
      { status: 500 },
    );
  } finally {
    if (prevLive === undefined) delete process.env.LANDING_FACTS_LIVE;
    else process.env.LANDING_FACTS_LIVE = prevLive;
    if (prevLlm === undefined) delete process.env.LANDING_FACTS_LLM;
    else process.env.LANDING_FACTS_LLM = prevLlm;
    if (prevCpaLive === undefined) delete process.env.CPA_TL_LANDING_FACTS_LIVE;
    else process.env.CPA_TL_LANDING_FACTS_LIVE = prevCpaLive;
    if (prevCpaLlm === undefined) delete process.env.CPA_TL_LANDING_FACTS_LLM;
    else process.env.CPA_TL_LANDING_FACTS_LLM = prevCpaLlm;
  }
}

export const Route = createFileRoute("/api/public/hooks/smoke-landing-facts")({
  server: {
    handlers: {
      GET: ({ request }) => run(request),
      POST: ({ request }) => run(request),
    },
  },
});
