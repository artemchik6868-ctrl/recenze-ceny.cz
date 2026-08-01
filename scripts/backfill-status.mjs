/**
 * Report how many active offers still lack AI content.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const raw = readFileSync(resolve(root, ".env"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

const env = loadEnv();
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SOURCES = [
  { source: "cpa_tl", table: "cpa_tl_offers" },
  { source: "kma", table: "kma_offers" },
  { source: "m1_top", table: "m1_offers" },
  { source: "cpagetti", table: "cpagetti_offers" },
  { source: "adcombo", table: "adcombo_offers" },
  { source: "shakes", table: "shakes_offers" },

];

for (const { source, table } of SOURCES) {
  const { data: offers, error: oErr } = await sb
    .from(table)
    .select("offer_id")
    .eq("is_active", true);
  if (oErr) {
    console.log(`${source}: offers query error — ${oErr.message}`);
    continue;
  }
  const ids = (offers ?? []).map((r) => r.offer_id);

  const { data: content } = await sb
    .from("product_content")
    .select("offer_id, display_title_uk, title_ru, display_title_ru")
    .eq("source", source);
  const haveUk = new Set();
  const haveRu = new Set();
  for (const r of content ?? []) {
    if (r.display_title_uk) haveUk.add(r.offer_id);
    if (r.title_ru && r.display_title_ru) haveRu.add(r.offer_id);
  }
  const missingUk = ids.filter((id) => !haveUk.has(id)).length;
  const missingRu = ids.filter((id) => !haveRu.has(id)).length;
  const missingAny = ids.filter((id) => !haveUk.has(id) || !haveRu.has(id)).length;

  console.log(
    `${source}: active=${ids.length} missing_content=${missingAny} (uk=${missingUk} ru=${missingRu})`,
  );
}
