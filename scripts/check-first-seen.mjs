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

const tables = ["cpa_tl_offers", "kma_offers", "m1_offers", "cpagetti_offers"];

for (const table of tables) {
  const { data, error } = await sb
    .from(table)
    .select("offer_id,first_seen_at,synced_at")
    .limit(1);
  if (error) {
    console.log(`${table}: ERROR ${error.message}`);
  } else {
    console.log(`${table}: OK`, data?.[0] ?? "(empty)");
  }
}
