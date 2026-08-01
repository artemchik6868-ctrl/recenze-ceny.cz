// Manual backfill endpoint. Hit it repeatedly (cron or by hand) to generate
// missing product content for all active offers. Each call is capped so it
// fits inside a Worker request window — keep calling until `generated` settles to 0.

import { createFileRoute } from "@tanstack/react-router";
import {
  generateMissingContent,
  recomputeFormKinds,
  resetContentIndexCache,
} from "@/lib/content-backfill.server";
import { checkHookSecret } from "@/lib/hook-auth";
import type { OfferSource } from "@/lib/types";

const SOURCES: OfferSource[] = ["cpa_tl", "kma", "m1_top", "cpagetti", "adcombo", "shakes", "terraleads"];

async function run(request: Request) {
  const unauthorized = checkHookSecret(request);
  if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  const onlyParam = url.searchParams.get("source") as OfferSource | null;
  const task = url.searchParams.get("task"); // "ai" | "form" | null=all (ai)
  const deadlineMs = Number(url.searchParams.get("deadline_ms") ?? "55000");
  const sources = onlyParam ? [onlyParam] : SOURCES;
  const regenMissingQa = url.searchParams.get("regen_missing_qa") === "1";
  const forceRegen = url.searchParams.get("force_regen") === "1";
  const categorySlug = url.searchParams.get("category_slug") ?? undefined;
  const aiLimit = Number(url.searchParams.get("ai_limit") ?? (forceRegen ? "4" : "12"));

  const started = Date.now();
  const out: Record<string, unknown> = {};
  let timedOut = false;
  const reserveMs = 3500;
  const generationDeadlineAt = started + deadlineMs - reserveMs;
  const remainingMs = () => Math.max(0, deadlineMs - (Date.now() - started));
  const withDeadline = async <T>(p: Promise<T>): Promise<T | { timeout: true }> => {
    const remaining = Math.max(0, remainingMs() - reserveMs);
    if (remaining <= 0) {
      timedOut = true;
      return { timeout: true };
    }
    // Work already respects deadlineAt; do not hard-abort mid-write.
    // Clear the race timer so it does not retain the request closure.
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        p,
        new Promise<{ timeout: true }>((r) => {
          timer = setTimeout(() => {
            timedOut = true;
            r({ timeout: true });
          }, remaining);
        }),
      ]);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  };

  resetContentIndexCache(sources);
  try {
    for (const source of sources) {
      if (remainingMs() <= reserveMs) {
        timedOut = true;
        out[source] = { skipped: "deadline" };
        continue;
      }
      try {
        if (task === "form") {
          const force = url.searchParams.get("force") === "1";
          const formLimit = Number(url.searchParams.get("form_limit") ?? "300");
          out[source] = { form: await withDeadline(recomputeFormKinds(source, formLimit, { force, deadlineAt: generationDeadlineAt })) };
        } else {
          if (remainingMs() < 25000) {
            timedOut = true;
            out[source] = { skipped: "deadline" };
            continue;
          }
          out[source] = {
            content: await withDeadline(
              generateMissingContent(source, aiLimit, {
                regenMissingQa,
                forceRegen,
                categorySlug,
                deadlineAt: generationDeadlineAt,
                onlyMissing: !forceRegen,
                regenStale: forceRegen,
                drainMode: true,
              }),
            ),
          };
        }
      } catch (err) {
        out[source] = { error: err instanceof Error ? err.message : String(err) };
      }
    }
    return Response.json({ ok: true, elapsed_ms: Date.now() - started, timedOut, ...out });
  } finally {
    resetContentIndexCache(sources);
  }
}


export const Route = createFileRoute("/api/public/hooks/backfill-content")({
  server: {
    handlers: {
      POST: ({ request }) => run(request),
      GET: ({ request }) => run(request),
    },
  },
});
