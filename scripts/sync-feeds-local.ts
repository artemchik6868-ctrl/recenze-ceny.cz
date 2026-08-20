/**
 * Offline CPA feed ingest — fetch partner APIs in Node (no CF subrequest cap),
 * filter MARKET_GEO, upsert CZ rows. Worker cron no longer paginates feeds.
 *
 * Usage:
 *   npx tsx scripts/sync-feeds-local.ts
 *
 * Requires .env / CI: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CPA API keys.
 * Exit 0 only when the lock was acquired and every source succeeded.
 * Writes .feed-sync-result.json for Telegram / GHA.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PIPELINE_SOURCES, syncAllFeedsExclusive } from "../src/lib/content-pipeline.server";
import type { OfferSource } from "../src/lib/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const RESULT_PATH = resolve(root, ".feed-sync-result.json");

function loadEnvIntoProcess(): void {
  try {
    const raw = readFileSync(resolve(root, ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      const key = m[1].trim();
      if (!(key in process.env) || process.env[key] === "") {
        process.env[key] = v;
      }
    }
  } catch {
    /* CI injects env without .env */
  }
}

type ResultFile = {
  ok: boolean;
  lock: "acquired" | "busy";
  elapsed_ms: number;
  failed: string[];
  sources: Record<string, Record<string, unknown> | { error: string }>;
};

function writeResult(result: ResultFile): void {
  try {
    writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2), "utf8");
  } catch (e) {
    console.warn("[sync-feeds-local] could not write result file:", e);
  }
}

function summarizeSource(
  source: OfferSource,
  row: Record<string, unknown> | { error: string },
): string {
  if ("error" in row && typeof row.error === "string") return `${source}: error`;
  if ("skipped" in row && typeof row.skipped === "string") return `${source}: skipped=${row.skipped}`;
  const fetched = row.fetched ?? "-";
  const allowed = row.allowed ?? row.ua ?? "-";
  const deactivated = row.deactivated ?? "-";
  return `${source}: fetched=${fetched} allowed=${allowed} deactivated=${deactivated}`;
}

async function main(): Promise<void> {
  loadEnvIntoProcess();
  const holder = process.env.GITHUB_RUN_ID
    ? `gha:${process.env.GITHUB_RUN_ID}`
    : `local:${process.pid}`;
  console.info(`[sync-feeds-local] start holder=${holder}`);
  const result = await syncAllFeedsExclusive(holder);
  const payload: ResultFile = {
    ok: result.lock === "acquired" && result.failed.length === 0,
    lock: result.lock,
    elapsed_ms: result.elapsed_ms,
    failed: result.lock === "busy" ? ["lock_busy"] : result.failed,
    sources: result.sync,
  };
  writeResult(payload);

  for (const source of PIPELINE_SOURCES) {
    console.info(`  ${summarizeSource(source, result.sync[source])}`);
  }
  console.info(
    `[sync-feeds-local] done ok=${payload.ok} lock=${result.lock} elapsed=${result.elapsed_ms}ms failed=${payload.failed.join(",") || "none"}`,
  );

  if (result.lock === "busy") {
    console.error("[sync-feeds-local] lock busy — another ingest holds feed_sync_lock");
    process.exitCode = 1;
    return;
  }
  if (result.failed.length > 0) {
    console.error(`[sync-feeds-local] source failures: ${result.failed.join(", ")}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  const message = e instanceof Error ? e.message : String(e);
  console.error("[sync-feeds-local] fatal:", message);
  writeResult({
    ok: false,
    lock: "acquired",
    elapsed_ms: 0,
    failed: [message],
    sources: {},
  });
  process.exit(1);
});
