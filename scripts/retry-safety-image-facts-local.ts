/**
 * Force re-extract offer_image_facts rows that failed with free-model safety/parse.
 *
 *   $env:IMAGE_FACTS_MAX_LLM_PER_DAY="500"
 *   $env:IMAGE_FACTS_MAX_PAID_PER_DAY="50"
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/retry-safety-image-facts-local.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  if (process.env[key] !== undefined && process.env[key] !== "") continue;
  let v = m[2].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  process.env[key] = v;
}

process.env.IMAGE_FACTS_SMOKE = "1";

function arg(name: string): string | null {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

const limit = Number(arg("limit") || "0");
const concurrency = Math.min(2, Math.max(1, Number(arg("concurrency") || "1")));
const pauseMs = Number(arg("pause-ms") || "600");

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const { data, error } = await sb
  .from("offer_image_facts")
  .select("source,offer_id,status,error,llm_attempts")
  .in("status", ["thin", "fetch_error", "exhausted"]);
if (error) throw error;

const jobs = (data ?? []).filter((r) => {
  const e = String(r.error ?? "").toLowerCase();
  return (
    e.includes("user safety") ||
    e.includes("failed to parse llm json") ||
    e.includes("safety") ||
    e.includes("refus")
  );
});

const queue = Number.isFinite(limit) && limit > 0 ? jobs.slice(0, limit) : jobs;

console.error(
  `Retry safety/parse image-facts — queue=${queue.length} concurrency=${concurrency} maxPaid=${process.env.IMAGE_FACTS_MAX_PAID_PER_DAY}`,
);

const { extractAndStoreImageFacts } = await import(
  pathToFileURL(resolve(root, "src/lib/image-facts.server.ts")).href
);

const results: Array<{
  source: string;
  offerId: number;
  status: string;
  method: string;
  error: string | null;
  tokens: number;
}> = [];

let okCount = 0;
let failCount = 0;
let idx = 0;

async function one(job: { source: string; offer_id: number }) {
  const n = ++idx;
  console.error(`\n[${n}/${queue.length}] ${job.source}:${job.offer_id}`);
  try {
    const row = await extractAndStoreImageFacts({
      source: job.source as "cpagetti",
      offerId: job.offer_id,
      writeDb: true,
      smoke: true,
      force: true,
    });
    if (row.status === "ok") okCount += 1;
    else failCount += 1;
    console.error(
      `  status=${row.status} method=${row.method} tokens=${row.usage?.total_tokens ?? 0} err=${row.error ?? "-"}`,
    );
    results.push({
      source: job.source,
      offerId: job.offer_id,
      status: row.status,
      method: row.method,
      error: row.error ?? null,
      tokens: row.usage?.total_tokens ?? 0,
    });
  } catch (err) {
    failCount += 1;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  EXC ${msg}`);
    results.push({
      source: job.source,
      offerId: job.offer_id,
      status: "exception",
      method: "none",
      error: msg.slice(0, 200),
      tokens: 0,
    });
  }
}

for (let i = 0; i < queue.length; i += concurrency) {
  const batch = queue.slice(i, i + concurrency);
  await Promise.all(batch.map((j) => one(j)));
  if (pauseMs > 0 && i + concurrency < queue.length) {
    await new Promise((r) => setTimeout(r, pauseMs));
  }
}

const outDir = resolve(root, "scripts/out");
mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = resolve(outDir, `retry-safety-image-facts-${stamp}.json`);
writeFileSync(
  outPath,
  JSON.stringify({ processed: results.length, okCount, failCount, results }, null, 2),
  "utf8",
);
console.error(`\nDone ok=${okCount} fail=${failCount}`);
console.error(`Wrote ${outPath}`);
