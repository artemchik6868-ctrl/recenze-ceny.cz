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

const slug = process.argv[2] ?? "vigrandex-g16593";
const tables = [
  ["cpa_tl", "cpa_tl_offers"],
  ["kma", "kma_offers"],
  ["m1_top", "m1_offers"],
  ["cpagetti", "cpagetti_offers"],
];

for (const [source, table] of tables) {
  const { data: bySlug } = await sb.from(table).select("offer_id,slug,is_active,name").eq("slug", slug).maybeSingle();
  const m = slug.match(/-([kmg])?(\d+)$/);
  if (m) {
    const id = Number(m[2]);
    const { data: byId } = await sb.from(table).select("offer_id,slug,is_active,name").eq("offer_id", id).maybeSingle();
    console.log(`\n${source} id=${id}:`, byId ?? "not found");
  }
  if (bySlug) console.log(`${source} slug match:`, bySlug);
}

for (const [table, id] of [
  ["m1_offers", 5911],
  ["cpagetti_offers", 16593],
  ["kma_offers", 16593],
]) {
  const { data } = await sb.from(table).select("offer_id,name,is_active,category").eq("offer_id", id).maybeSingle();
  console.log(`\n${table} #${id}:`, data ?? "not found");
}

const { data: vigM1 } = await sb.from("m1_offers").select("offer_id,name,is_active,category").ilike("name", "%vigrandex%");
const { data: vigCp } = await sb.from("cpagetti_offers").select("offer_id,name,is_active,category").ilike("name", "%vigrandex%");
console.log("\nm1 vigrandex:", vigM1);
console.log("cpagetti vigrandex:", vigCp);

const { data: content } = await sb
  .from("product_content")
  .select("source,offer_id,display_title_uk")
  .or("and(source.eq.cpagetti,offer_id.eq.16593),and(source.eq.m1_top,offer_id.eq.5911)");
console.log("\nproduct_content:", content);

const { count: cpCount } = await sb.from("cpagetti_offers").select("*", { count: "exact", head: true }).eq("is_active", true);
console.log("active cpagetti count:", cpCount);

const { data: cpIds } = await sb.from("cpagetti_offers").select("offer_id,title,is_active").eq("is_active", true).order("offer_id");
const vigRow = cpIds?.find((r) => String(r.title).toLowerCase().includes("vigrandex"));
console.log("cpagetti vigrandex row:", vigRow);
console.log("has 16593:", cpIds?.some((r) => Number(r.offer_id) === 16593));
