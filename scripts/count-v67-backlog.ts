/**
 * Pre-flight: count offers needing v67 regen (stale brief + missing HTML).
 * Usage: npx tsx scripts/count-v67-backlog.ts
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OfferSource } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const { PIPELINE_VERSION } = await import("../src/lib/ai-content.server.ts");
const { countPendingContent } = await import("../src/lib/content-backfill.server.ts");
const { PIPELINE_SOURCES } = await import("../src/lib/content-pipeline.server.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

const TABLE: Record<OfferSource, string> = {
  cpa_tl: "cpa_tl_offers",
  kma: "kma_offers",
  m1_top: "m1_offers",
  cpagetti: "cpagetti_offers",
  adcombo: "adcombo_offers",
  shakes: "shakes_offers",
  terraleads: "terraleads_offers",
};

async function activeCount(source: OfferSource): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from(TABLE[source])
    .select("offer_id", { count: "exact", head: true })
    .eq("is_active", true);
  if (error) throw error;
  return count ?? 0;
}

const { data: briefs } = await supabaseAdmin
  .from("product_briefs")
  .select("source, offer_id, pipeline_version");
const staleBriefKeys = new Set<string>();
const briefKeys = new Set<string>();
for (const row of briefs ?? []) {
  const r = row as { source: string; offer_id: number; pipeline_version: string | null };
  const key = `${r.source}:${r.offer_id}`;
  briefKeys.add(key);
  if (r.pipeline_version !== PIPELINE_VERSION) staleBriefKeys.add(key);
}

const { data: withContent } = await supabaseAdmin
  .from("product_content")
  .select("source, offer_id")
  .not("description_html_uk", "is", null);
const noBriefKeys = new Set<string>();
for (const row of withContent ?? []) {
  const r = row as { source: string; offer_id: number };
  const key = `${r.source}:${r.offer_id}`;
  if (!briefKeys.has(key)) noBriefKeys.add(key);
}

console.log(`\n=== v67 backlog preflight — pipeline=${PIPELINE_VERSION} ===\n`);
console.log("source          active  missing  stale_brief  no_brief  est_backlog");
console.log("--------------  ------  -------  -----------  --------  -----------");

let totalMissing = 0;
let totalStaleBrief = 0;
let totalNoBrief = 0;
let totalEst = 0;

for (const source of PIPELINE_SOURCES) {
  const active = await activeCount(source);
  const missing = await countPendingContent(source);
  const staleBrief = [...staleBriefKeys].filter((k) => k.startsWith(`${source}:`)).length;
  const noBrief = [...noBriefKeys].filter((k) => k.startsWith(`${source}:`)).length;
  const est = missing + staleBrief;
  totalMissing += missing;
  totalStaleBrief += staleBrief;
  totalNoBrief += noBrief;
  totalEst += est;
  console.log(
    `${source.padEnd(14)}  ${String(active).padStart(6)}  ${String(missing).padStart(7)}  ${String(staleBrief).padStart(11)}  ${String(noBrief).padStart(8)}  ${String(est).padStart(11)}`,
  );
}

const estHours = ((totalEst * 18) / 3 / 3600).toFixed(1);
console.log("--------------  ------  -------  -----------  --------  -----------");
console.log(
  `${"TOTAL".padEnd(14)}  ${" ".repeat(6)}  ${String(totalMissing).padStart(7)}  ${String(totalStaleBrief).padStart(11)}  ${String(totalNoBrief).padStart(8)}  ${String(totalEst).padStart(11)}`,
);
console.log(`\nNote: est_backlog = missing + stale_brief (overlap possible; hash-stale adds more at runtime)`);
console.log(`Rough ETA @ concurrency=3, ~18s/offer: ~${estHours}h\n`);
