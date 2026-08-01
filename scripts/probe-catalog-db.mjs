/** List active offers by category slug from Supabase (local .env). */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const tables = [
  { source: "cpa_tl", table: "cpa_tl_offers", title: "title" },
  { source: "kma", table: "kma_offers", title: "name" },
  { source: "m1_top", table: "m1_offers", title: "title" },
  { source: "cpagetti", table: "cpagetti_offers", title: "name" },
  { source: "adcombo", table: "adcombo_offers", title: "name" },
  { source: "shakes", table: "shakes_offers", title: "title" },
];

const { data: resolved } = await sb.from("offer_category_resolved").select("source, offer_id, shelf_slug");
const resMap = new Map((resolved ?? []).map((r) => [`${r.source}:${r.offer_id}`, r.shelf_slug]));

const byCat = new Map();
let total = 0;
for (const { source, table, title } of tables) {
  const { data } = await sb.from(table).select(`offer_id, ${title}, category`).eq("is_active", true);
  for (const row of data ?? []) {
    total++;
    const key = `${source}:${row.offer_id}`;
    const cat = resMap.get(key) ?? row.category ?? "sync-category";
    byCat.set(cat, (byCat.get(cat) ?? 0) + 1);
  }
}

console.log(`Active offers: ${total}`);
console.log("By category (resolved or sync):");
for (const [cat, n] of [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  console.log(`  ${cat}: ${n}`);
}

// Sample shakes titles with FR
const { data: shakes } = await sb.from("shakes_offers").select("offer_id, title").eq("is_active", true).limit(5);
console.log("\nSample shakes titles:");
for (const r of shakes ?? []) console.log(`  ${r.offer_id}: ${r.title}`);
