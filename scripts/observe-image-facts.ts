/**
 * Phase 3 snapshot: offer_image_facts + image_facts_daily_budget.
 *
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/observe-image-facts.ts
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  const key = m[1].trim();
  if (!(key in process.env) || process.env[key] === "") process.env[key] = v;
}

const { supabaseAdmin } = await import(
  pathToFileURL(resolve(root, "src/integrations/supabase/client.server.ts")).href
);
const db = supabaseAdmin as unknown as { from: (t: string) => any };

const { data: budget, error: budgetErr } = await db
  .from("image_facts_daily_budget")
  .select("*")
  .order("day", { ascending: false });
if (budgetErr) throw new Error(budgetErr.message);

const { data: rows, error: rowsErr } = await db
  .from("offer_image_facts")
  .select("source,offer_id,status,method,error,llm_attempts,fail_count,facts,prompt_block")
  .order("updated_at", { ascending: false });
if (rowsErr) throw new Error(rowsErr.message);

const byStatus: Record<string, number> = {};
const byMethod: Record<string, number> = {};
const bySourceStatus: Record<string, number> = {};
const nonOkErrors: Record<string, number> = {};
let recoveredUrlOnly = 0;
const sampleOk: Array<{ key: string; facts: unknown }> = [];

for (const r of rows ?? []) {
  byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  byMethod[r.method] = (byMethod[r.method] || 0) + 1;
  const sk = `${r.source}:${r.status}`;
  bySourceStatus[sk] = (bySourceStatus[sk] || 0) + 1;
  if (r.error && String(r.error).includes("recovered:url_only")) recoveredUrlOnly += 1;
  if (r.error && r.status !== "ok") {
    const e = String(r.error).slice(0, 100);
    nonOkErrors[e] = (nonOkErrors[e] || 0) + 1;
  }
  if (r.status === "ok" && sampleOk.length < 12) {
    sampleOk.push({ key: `${r.source}:${r.offer_id}`, facts: r.facts });
  }
}

const total = (rows ?? []).length;
const ok = byStatus.ok || 0;

const out = {
  total,
  okRate: total ? Number((ok / total).toFixed(3)) : 0,
  byStatus,
  byMethod,
  bySourceStatus,
  recoveredUrlOnly,
  nonOkErrors,
  budget: budget ?? [],
  sampleOk,
};

console.log(JSON.stringify(out, null, 2));
