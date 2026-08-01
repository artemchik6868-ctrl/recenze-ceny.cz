/**
 * E2E: simulate a new offer (no product_content) and verify sync → generate paths.
 *
 * Usage:
 *   npm run test:pipeline-e2e -- --source=kma
 *   npm run test:pipeline-e2e -- --matrix
 *   npm run test:pipeline-e2e -- --source=all
 *   npm run test:pipeline-e2e -- --source=kma --worker-only
 *   npm run test:pipeline-e2e -- --matrix --worker-only --base=https://recenze-ceny.cz
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import type { OfferSource } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = resolve(root, "scripts/.cache");

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1].trim()] = v;
  }
  return env;
}

const env = loadEnv();
for (const [k, v] of Object.entries(env)) {
  if (!(k in process.env) || process.env[k] === "") process.env[k] = v;
}

const sb = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const ALL_SOURCES: OfferSource[] = [
  "cpa_tl",
  "kma",
  "m1_top",
  "cpagetti",
  "adcombo",
  "shakes",
];

const MATRIX_SOURCES: OfferSource[] = ["cpa_tl", "kma", "cpagetti"];

const TEST_OFFER_ID: Record<OfferSource, number> = {
  cpa_tl: 999991,
  kma: 999992,
  m1_top: 999993,
  cpagetti: 999994,
  adcombo: 999995,
  shakes: 999996,

};

const TABLE: Record<OfferSource, string> = {
  cpa_tl: "cpa_tl_offers",
  kma: "kma_offers",
  m1_top: "m1_offers",
  cpagetti: "cpagetti_offers",
  adcombo: "adcombo_offers",
  shakes: "shakes_offers",

};

const CATEGORY: Record<OfferSource, string> = {
  cpa_tl: "cukrovka",
  kma: "cukrovka",
  m1_top: "cukrovka",
  cpagetti: "cukrovka",
  adcombo: "cukrovka",
  shakes: "cukrovka",

};

function parseArgs() {
  const sourceArg = process.argv.find((a) => a.startsWith("--source="))?.split("=")[1];
  const matrix = process.argv.includes("--matrix");
  const workerOnly = process.argv.includes("--worker-only");
  const skipCleanup = process.argv.includes("--skip-cleanup");
  const fullCron = process.argv.includes("--full-cron");
  const base =
    process.argv.find((a) => a.startsWith("--base="))?.slice(7) ??
    env.DE_SYNC_BASE ??
    env.CZ_WORKERS_DEV_BASE ??
    "https://recenze-ceny.cz";

  let sources: OfferSource[];
  if (matrix) sources = MATRIX_SOURCES;
  else if (sourceArg === "all") sources = ALL_SOURCES;
  else if (sourceArg && ALL_SOURCES.includes(sourceArg as OfferSource)) {
    sources = [sourceArg as OfferSource];
  } else {
    sources = MATRIX_SOURCES;
  }

  return { sources, workerOnly, skipCleanup, base, fullCron: fullCron || matrix };
}

function buildSyntheticRow(source: OfferSource, offerId: number) {
  const now = new Date().toISOString();
  const title = "TestPipeline — Tabletten Testprodukt";
  const raw = { title, name: title, description: "Tabletten Nahrungsergänzungsmittel Diabetes" };
  const base = {
    offer_id: offerId,
    category: CATEGORY[source],
    raw,
    is_active: true,
    synced_at: now,
  };
  if (source === "kma") return { ...base, name: title, logo: null };
  if (source === "m1_top") return { ...base, name: title, picture_url: null };
  return { ...base, title, picture_url: null };
}

async function deleteContentArtifacts(source: OfferSource, offerId: number) {
  await sb.from("product_content").delete().eq("source", source).eq("offer_id", offerId);
  await sb.from("product_briefs").delete().eq("source", source).eq("offer_id", offerId);
}

async function setupOffer(source: OfferSource) {
  const offerId = TEST_OFFER_ID[source];
  const table = TABLE[source];
  const row = buildSyntheticRow(source, offerId);
  const { error } = await sb.from(table).upsert(row as never, { onConflict: "offer_id" });
  if (error) throw new Error(`setup ${source} upsert: ${error.message}`);
  await deleteContentArtifacts(source, offerId);
  return offerId;
}

async function cleanupOffer(source: OfferSource) {
  const offerId = TEST_OFFER_ID[source];
  const table = TABLE[source];
  await sb.from(table).update({ is_active: false }).eq("offer_id", offerId);
  await deleteContentArtifacts(source, offerId);
}

type ContentRow = {
  display_title_uk: string | null;
  description_html_uk: string | null;
  faq_uk: unknown;
};

function isComplete(row: ContentRow | null): boolean {
  if (!row) return false;
  const faqLen = Array.isArray(row.faq_uk) ? row.faq_uk.length : 0;
  return Boolean(
    row.display_title_uk &&
      row.description_html_uk &&
      row.description_html_uk.length >= 400 &&
      faqLen >= 3,
  );
}

async function fetchContent(source: OfferSource, offerId: number) {
  const { data } = await sb
    .from("product_content")
    .select("display_title_uk, description_html_uk, faq_uk")
    .eq("source", source)
    .eq("offer_id", offerId)
    .maybeSingle();
  return data as ContentRow | null;
}

async function pollContent(source: OfferSource, offerId: number, maxMs = 180_000) {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    const row = await fetchContent(source, offerId);
    if (isComplete(row)) return { ok: true as const, row, waited_ms: Date.now() - started };
    await new Promise((r) => setTimeout(r, 5000));
  }
  return { ok: false as const, row: await fetchContent(source, offerId), waited_ms: maxMs };
}

async function callHook(
  base: string,
  hook: "content-drain" | "backfill-content",
  query: Record<string, string>,
) {
  const secret = env.HOOK_SECRET;
  if (!secret) throw new Error("HOOK_SECRET missing");
  const params = new URLSearchParams({ secret, ...query });
  const paths = {
    "content-drain": "/api/public/hooks/content-drain",
    "backfill-content": "/api/public/hooks/backfill-content",
  };
  const url = `${base}${paths[hook]}?${params.toString()}`;
  const started = Date.now();
  const res = await fetch(url, { signal: AbortSignal.timeout(200_000) });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 2000) };
  }
  return { status: res.status, elapsed_ms: Date.now() - started, body: json };
}

function summarizeRetryBody(body: unknown, source: OfferSource) {
  const b = body as {
    elapsed_ms?: number;
    totalGenerated?: number;
    totalFailed?: number;
    totalMissing?: number;
    sources?: Partial<
      Record<
        OfferSource,
        {
          missingRemaining?: number;
          content?: { totalGenerated?: number; totalFailed?: number };
        }
      >
    >;
  };
  const src = b.sources?.[source];
  return {
    elapsed_ms: b.elapsed_ms,
    totalGenerated: b.totalGenerated,
    totalFailed: b.totalFailed,
    totalMissing: b.totalMissing,
    sourceGenerated: src?.content?.totalGenerated,
    sourceFailed: src?.content?.totalFailed,
    missingRemaining: src?.missingRemaining,
  };
}

function backfillContentStats(body: unknown, source: OfferSource) {
  const b = body as Record<string, { content?: { generated?: number; failed?: number } } | undefined>;
  const slot = b[source]?.content;
  return { generated: slot?.generated, failed: slot?.failed };
}

async function runLocalGenerate(source: OfferSource) {
  const { generateNewContent } = await import("../src/lib/content-backfill.server.ts");
  const started = Date.now();
  const result = await generateNewContent(source, { deadlineMs: 110_000 });
  const offerId = TEST_OFFER_ID[source];
  const poll = await pollContent(source, offerId, 60_000);
  return {
    elapsed_ms: Date.now() - started,
    generate: {
      totalGenerated: result.content.totalGenerated,
      totalFailed: result.content.totalFailed,
      missingRemaining: result.missingRemaining,
      timedOut: result.timedOut,
    },
    content_ok: poll.ok,
    waited_ms: poll.waited_ms,
  };
}

async function runWorkerRetry(source: OfferSource, base: string, fullCron: boolean) {
  await deleteContentArtifacts(source, TEST_OFFER_ID[source]);
  const query: Record<string, string> = { deadline_ms: "120000" };
  if (!fullCron) query.sources = source;
  const hook = await callHook(base, "content-drain", query);
  const poll = await pollContent(source, TEST_OFFER_ID[source]);
  return {
    hook,
    retry: summarizeRetryBody(hook.body, source),
    content_ok: poll.ok,
    waited_ms: poll.waited_ms,
  };
}

async function runWorkerAiOnly(source: OfferSource, base: string) {
  await deleteContentArtifacts(source, TEST_OFFER_ID[source]);
  const hook = await callHook(base, "backfill-content", {
    source,
    task: "ai",
    ai_limit: "2",
    deadline_ms: "120000",
  });
  const poll = await pollContent(source, TEST_OFFER_ID[source]);
  const stats = backfillContentStats(hook.body, source);
  return {
    hook,
    generated: stats.generated,
    failed: stats.failed,
    content_ok: poll.ok,
    waited_ms: poll.waited_ms,
  };
}

async function runSource(
  source: OfferSource,
  opts: { workerOnly: boolean; base: string; fullCron: boolean },
) {
  const offerId = TEST_OFFER_ID[source];
  console.log(`\n=== ${source}:${offerId} ===`);
  await setupOffer(source);

  const result: Record<string, unknown> = { source, offerId };

  if (!opts.workerOnly) {
    console.log(`[A] local generateNewContent…`);
    result.runA = await runLocalGenerate(source);
    console.log(`[A] content_ok=${(result.runA as { content_ok: boolean }).content_ok}`, (result.runA as { generate: unknown }).generate);
    await deleteContentArtifacts(source, offerId);
  }

  console.log(`[B] worker retryMissingContent${opts.fullCron ? " (all sources)" : ` (sources=${source})`}…`);
  result.runB = await runWorkerRetry(source, opts.base, opts.fullCron);
  const runB = result.runB as { hook: { status: number }; content_ok: boolean; retry: unknown };
  console.log(`[B] status=${runB.hook.status} content_ok=${runB.content_ok}`, runB.retry);

  if (!runB.content_ok) {
    console.log(`[C] worker backfill-content AI-only…`);
    result.runC = await runWorkerAiOnly(source, opts.base);
    const runC = result.runC as { hook: { status: number }; content_ok: boolean; generated?: number; failed?: number };
    console.log(`[C] status=${runC.hook.status} content_ok=${runC.content_ok}`, {
      generated: runC.generated,
      failed: runC.failed,
    });
  }

  result.verdict =
    runB.content_ok || (result.runC as { content_ok?: boolean } | undefined)?.content_ok
      ? "PASS"
      : "FAIL";

  return result;
}

async function main() {
  const { sources, workerOnly, skipCleanup, base, fullCron } = parseArgs();
  mkdirSync(cacheDir, { recursive: true });

  console.log(
    `Pipeline E2E — sources=${sources.join(",")} base=${base} workerOnly=${workerOnly} fullCron=${fullCron}`,
  );

  const report: { started_at: string; sources: Record<string, unknown>[] } = {
    started_at: new Date().toISOString(),
    sources: [],
  };

  for (const source of sources) {
    try {
      report.sources.push(await runSource(source, { workerOnly, base, fullCron }));
    } catch (err) {
      report.sources.push({
        source,
        error: err instanceof Error ? err.message : String(err),
        verdict: "ERROR",
      });
    }
  }

  if (!skipCleanup) {
    console.log("\n=== cleanup ===");
    for (const source of sources) {
      await cleanupOffer(source);
      console.log(`cleaned ${source}:${TEST_OFFER_ID[source]}`);
    }
  }

  const outPath = resolve(cacheDir, `pipeline-e2e-${Date.now()}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${outPath}`);

  const failed = report.sources.filter((r) => r.verdict !== "PASS");
  if (failed.length > 0) {
    console.error(`\n${failed.length} source(s) FAILED`);
    process.exit(1);
  }
  console.log("\nAll sources PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
