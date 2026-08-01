/**
 * Force-regen AI content for offers whose content predates injectable image_facts.
 *
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/regen-stale-image-facts-content-local.ts
 *   ... -- --source=shakes --limit=20 --concurrency=2 --pause-ms=1000
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

function arg(name: string): string | null {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

const sourceFilter = arg("source")?.trim().toLowerCase() ?? null;
const limit = Number(arg("limit") || "0");
const concurrency = Math.min(3, Math.max(1, Number(arg("concurrency") || "2")));
const pauseMs = Number(arg("pause-ms") || "800");

const SOURCES: Record<
  string,
  { table: string; hasActive: boolean }
> = {
  shakes: { table: "shakes_offers", hasActive: true },
  cpa_tl: { table: "cpa_tl_offers", hasActive: true },
  kma: { table: "kma_offers", hasActive: true },
  m1_top: { table: "m1_offers", hasActive: false },
  cpagetti: { table: "cpagetti_offers", hasActive: false },
  adcombo: { table: "adcombo_offers", hasActive: false },
};

function isComplete(row: {
  display_title_uk: string | null;
  description_html_uk: string | null;
  faq_uk: unknown;
}): boolean {
  const faqLen = Array.isArray(row.faq_uk) ? row.faq_uk.length : 0;
  return Boolean(row.display_title_uk && row.description_html_uk && faqLen >= 3);
}

function hasInjectableFacts(facts: unknown): boolean {
  if (!facts || typeof facts !== "object") return false;
  const f = facts as Record<string, unknown>;
  return Boolean(f.releaseForm || f.productType || f.packaging);
}

const { createClient } = await import("@supabase/supabase-js");
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

type Job = { source: string; offerId: number };

const jobs: Job[] = [];
const sources = sourceFilter ? [sourceFilter] : Object.keys(SOURCES);

for (const source of sources) {
  const meta = SOURCES[source];
  if (!meta) {
    console.error(`Unknown source ${source}`);
    process.exit(1);
  }
  let q = sb.from(meta.table).select("offer_id");
  if (meta.hasActive) q = q.eq("is_active", true);
  const { data: offers } = await q;
  const ids = (offers ?? []).map((o) => o.offer_id as number);
  if (!ids.length) continue;

  const { data: content } = await sb
    .from("product_content")
    .select("offer_id, display_title_uk, description_html_uk, faq_uk, generated_at")
    .eq("source", source)
    .in("offer_id", ids);

  const { data: facts } = await sb
    .from("offer_image_facts")
    .select("offer_id, status, updated_at, facts")
    .eq("source", source)
    .in("offer_id", ids);

  const contentById = new Map((content ?? []).map((r) => [r.offer_id as number, r]));
  const factsById = new Map((facts ?? []).map((r) => [r.offer_id as number, r]));

  for (const id of ids) {
    const c = contentById.get(id);
    if (!c || !isComplete(c)) continue;
    const f = factsById.get(id);
    if (!f || f.status !== "ok" || !hasInjectableFacts(f.facts)) continue;
    const gen = c.generated_at ? Date.parse(String(c.generated_at)) : 0;
    const factAt = f.updated_at ? Date.parse(String(f.updated_at)) : 0;
    // Stale: content older than facts (or missing generated_at)
    if (gen && factAt && gen >= factAt) continue;
    jobs.push({ source, offerId: id });
  }
}

const queue = Number.isFinite(limit) && limit > 0 ? jobs.slice(0, limit) : jobs;

console.error(
  `Regen stale-vs-image-facts — jobs=${jobs.length} queue=${queue.length} concurrency=${concurrency}`,
);

const { getOrGenerateProductContentDetailed } = await import(
  pathToFileURL(resolve(root, "src/lib/ai-content.server.ts")).href
);

const results: Array<{
  source: string;
  offerId: number;
  ok: boolean;
  status: string;
  saved: boolean;
  error: string | null;
  elapsed_ms: number;
}> = [];

let okCount = 0;
let failCount = 0;
let idx = 0;

async function one(job: Job) {
  const n = ++idx;
  const started = Date.now();
  console.error(`\n[${n}/${queue.length}] ${job.source}:${job.offerId}`);
  try {
    const generated = await getOrGenerateProductContentDetailed(
      job.source,
      job.offerId,
      "uk",
      "other",
      { forceRegen: true },
    );
    const ok =
      generated.status === "generated" || generated.status === "cache_hit";
    if (ok) okCount += 1;
    else failCount += 1;
    const row = {
      source: job.source,
      offerId: job.offerId,
      ok,
      status: generated.status,
      saved: Boolean(generated.saved),
      error: generated.error ?? null,
      elapsed_ms: Date.now() - started,
    };
    results.push(row);
    console.error(
      `  status=${row.status} saved=${row.saved} ms=${row.elapsed_ms} err=${row.error ?? "-"}`,
    );
  } catch (err) {
    failCount += 1;
    const message = err instanceof Error ? err.message : String(err);
    results.push({
      source: job.source,
      offerId: job.offerId,
      ok: false,
      status: "exception",
      saved: false,
      error: message.slice(0, 300),
      elapsed_ms: Date.now() - started,
    });
    console.error(`  FAIL ${message}`);
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
const outPath = resolve(outDir, `regen-stale-image-facts-${stamp}.json`);
writeFileSync(
  outPath,
  JSON.stringify(
    {
      totalJobs: jobs.length,
      processed: results.length,
      okCount,
      failCount,
      results,
    },
    null,
    2,
  ),
  "utf8",
);

console.error(`\nDone ok=${okCount} fail=${failCount} processed=${results.length}`);
console.error(`Wrote ${outPath}`);
