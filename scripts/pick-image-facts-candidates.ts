/**
 * Phase 3: pick offers that have no offer_image_facts row yet.
 *
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/pick-image-facts-candidates.ts
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

const TABLES: Array<{
  source: string;
  table: string;
  imageCol: string;
  hasActive: boolean;
}> = [
  { source: "shakes", table: "shakes_offers", imageCol: "picture_url", hasActive: true },
  { source: "cpa_tl", table: "cpa_tl_offers", imageCol: "picture_url", hasActive: true },
  { source: "m1_top", table: "m1_offers", imageCol: "picture_url", hasActive: false },
  { source: "kma", table: "kma_offers", imageCol: "logo", hasActive: true },
  { source: "adcombo", table: "adcombo_offers", imageCol: "picture_url", hasActive: false },
  { source: "cpagetti", table: "cpagetti_offers", imageCol: "picture_url", hasActive: false },
];

const { data: existing, error: e1 } = await db.from("offer_image_facts").select("source,offer_id");
if (e1) throw new Error(e1.message);
const have = new Set(
  (existing ?? []).map((r: { source: string; offer_id: number }) => `${r.source}:${r.offer_id}`),
);

const picks: string[] = [];
for (const t of TABLES) {
  let q = db.from(t.table).select(`offer_id,${t.imageCol}`).not(t.imageCol, "is", null).neq(t.imageCol, "").limit(80);
  if (t.hasActive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) {
    console.error(t.source, error.message);
    continue;
  }
  let taken = 0;
  for (const row of data ?? []) {
    const id = Number(row.offer_id);
    const key = `${t.source}:${id}`;
    if (have.has(key)) continue;
    const img = String(row[t.imageCol] ?? "");
    if (!/^https:\/\//i.test(img)) continue;
    picks.push(key);
    taken += 1;
    if (taken >= 2) break;
  }
}

console.log(picks.join(","));
console.error(`picked ${picks.length}: ${picks.join(" ")}`);
