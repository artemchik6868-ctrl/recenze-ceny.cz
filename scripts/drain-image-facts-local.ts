/**
 * Local mass drain for remaining offer_image_facts.
 *
 *   $env:IMAGE_FACTS_MAX_LLM_PER_DAY="500"
 *   $env:IMAGE_FACTS_MAX_TOKENS_PER_DAY="800000"
 *   npm run smoke:image-facts  # no — use:
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/drain-image-facts-local.ts
 *
 * Optional: --source=shakes --limit=50 --concurrency=1 --pause-ms=500
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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

const sourceFilter = arg("source")?.trim().toLowerCase() ?? null;
const limit = Number(arg("limit") || "0"); // 0 = all
const pauseMs = Number(arg("pause-ms") || "400");
const concurrency = Math.min(3, Math.max(1, Number(arg("concurrency") || "1")));

const OFFER_TABLE: Record<
  string,
  { table: string; titleCol: string; imageCol: string; hasActive: boolean }
> = {
  shakes: { table: "shakes_offers", titleCol: "title", imageCol: "picture_url", hasActive: true },
  cpa_tl: { table: "cpa_tl_offers", titleCol: "title", imageCol: "picture_url", hasActive: true },
  m1_top: { table: "m1_offers", titleCol: "name", imageCol: "picture_url", hasActive: false },
  cpagetti: { table: "cpagetti_offers", titleCol: "title", imageCol: "picture_url", hasActive: false },
  adcombo: { table: "adcombo_offers", titleCol: "title", imageCol: "picture_url", hasActive: false },
  kma: { table: "kma_offers", titleCol: "name", imageCol: "logo", hasActive: true },
};

const SOURCES = sourceFilter
  ? [sourceFilter]
  : ["shakes", "cpa_tl", "kma", "m1_top", "cpagetti", "adcombo"];

const { createClient } = await import("@supabase/supabase-js");
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

type Candidate = { source: string; offerId: number; title: string; imageUrl: string };

const candidates: Candidate[] = [];

for (const source of SOURCES) {
  const meta = OFFER_TABLE[source];
  if (!meta) {
    console.error(`Unknown source ${source}`);
    process.exit(1);
  }
  let q = sb
    .from(meta.table)
    .select(`offer_id, ${meta.titleCol}, ${meta.imageCol}`)
    .not(meta.imageCol, "is", null)
    .limit(500);
  if (meta.hasActive) q = q.eq("is_active", true);
  const { data: offers, error } = await q;
  if (error) {
    console.error(`scan ${source}:`, error.message);
    continue;
  }
  const rows = offers ?? [];
  const ids = rows.map((r) => Number(r.offer_id)).filter(Number.isFinite);
  const { data: facts } = await sb
    .from("offer_image_facts")
    .select("offer_id, status, image_hash")
    .eq("source", source)
    .in("offer_id", ids.length ? ids : [-1]);
  const done = new Set(
    (facts ?? [])
      .filter((f) => f.status === "ok")
      .map((f) => f.offer_id as number),
  );
  for (const row of rows) {
    const offerId = Number(row.offer_id);
    const imageUrl = String(row[meta.imageCol] ?? "").trim();
    if (!imageUrl || done.has(offerId)) continue;
    // Skip terminal non-retry unless missing row (fetch_error with attempts can retry later;
    // for mass drain include non-ok so we fill gaps; skip if already ok only).
    const title = String(row[meta.titleCol] ?? "").trim() || `offer ${offerId}`;
    candidates.push({ source, offerId, title, imageUrl });
  }
}

const queue =
  Number.isFinite(limit) && limit > 0 ? candidates.slice(0, limit) : candidates;

console.error(
  `Local image-facts drain — candidates=${candidates.length} queue=${queue.length} concurrency=${concurrency} maxLlm/day=${process.env.IMAGE_FACTS_MAX_LLM_PER_DAY} maxTokens/day=${process.env.IMAGE_FACTS_MAX_TOKENS_PER_DAY}`,
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

async function one(c: Candidate) {
  const n = ++idx;
  console.error(`\n[${n}/${queue.length}] ${c.source}:${c.offerId} ${c.title.slice(0, 40)}`);
  try {
    const row = await extractAndStoreImageFacts({
      source: c.source as "shakes",
      offerId: c.offerId,
      writeDb: true,
      smoke: true,
      force: false,
    });
    const tokens = row.usage?.total_tokens ?? 0;
    if (row.status === "ok") okCount += 1;
    else failCount += 1;
    console.error(
      `  status=${row.status} method=${row.method} tokens=${tokens} err=${row.error ?? "-"}`,
    );
    results.push({
      source: c.source,
      offerId: c.offerId,
      status: row.status,
      method: row.method,
      error: row.error ?? null,
      tokens,
    });
    if (row.error?.startsWith("budget:")) {
      return "budget";
    }
  } catch (err) {
    failCount += 1;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  EXC ${msg}`);
    results.push({
      source: c.source,
      offerId: c.offerId,
      status: "exception",
      method: "none",
      error: msg.slice(0, 200),
      tokens: 0,
    });
  }
  return "ok";
}

let stop = false;
for (let i = 0; i < queue.length && !stop; i += concurrency) {
  const batch = queue.slice(i, i + concurrency);
  const outcomes = await Promise.all(batch.map((c) => one(c)));
  if (outcomes.includes("budget")) {
    console.error("\nStopped: daily budget gate hit.");
    stop = true;
    break;
  }
  if (pauseMs > 0 && i + concurrency < queue.length) {
    await new Promise((r) => setTimeout(r, pauseMs));
  }
}

const outDir = resolve(root, "scripts/out");
mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = resolve(outDir, `drain-image-facts-local-${stamp}.json`);
writeFileSync(
  outPath,
  JSON.stringify(
    {
      startedCandidates: candidates.length,
      processed: results.length,
      okCount,
      failCount,
      maxLlmPerDay: process.env.IMAGE_FACTS_MAX_LLM_PER_DAY,
      results,
    },
    null,
    2,
  ),
  "utf8",
);

console.error(`\nDone ok=${okCount} fail=${failCount} processed=${results.length}`);
console.error(`Wrote ${outPath}`);
