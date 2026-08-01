// Manual content-drain trigger — safety retry for sources with missing AI content.

import { createFileRoute } from "@tanstack/react-router";
import {
  retryMissingContent,
  PIPELINE_SOURCES,
  CONTENT_DRAIN_DEADLINE_MS,
} from "@/lib/content-pipeline.server";
import { checkHookSecret } from "@/lib/hook-auth";
import type { OfferSource } from "@/lib/types";

function parseSources(param: string | null): OfferSource[] | undefined {
  if (!param?.trim()) return undefined;
  const allowed = new Set<string>(PIPELINE_SOURCES);
  const list = param
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is OfferSource => allowed.has(s));
  return list.length > 0 ? list : undefined;
}

async function run(request: Request) {
  const unauthorized = checkHookSecret(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const deadlineMs = Number(url.searchParams.get("deadline_ms") ?? String(CONTENT_DRAIN_DEADLINE_MS));
  const sources = parseSources(url.searchParams.get("sources"));

  try {
    const result = await retryMissingContent({ deadlineMs, sources });
    console.info(
      `[content-drain] elapsed=${result.elapsed_ms}ms generated=${result.totalGenerated} failed=${result.totalFailed} missing=${result.totalMissing}`,
    );
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[content-drain] failed:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/content-drain")({
  server: {
    handlers: {
      POST: ({ request }) => run(request),
      GET: ({ request }) => run(request),
    },
  },
});
