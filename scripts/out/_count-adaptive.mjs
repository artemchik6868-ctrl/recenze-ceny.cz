import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[m[1].trim()] = v;
}
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const ADAPTIVE = "\u0410\u0434\u0430\u043f\u0442\u0438\u0432";
const { data, count } = await sb.from("shakes_offers").select("offer_id,raw", { count: "exact" }).eq("is_active", true).limit(500);
let withAdaptiveCz = 0;
for (const row of data || []) {
  const landings = (row.raw || {}).landings || [];
  if (landings.some((l) => String(l.type||"").includes(ADAPTIVE) && /^cz/i.test(String(l.url||"")))) withAdaptiveCz++;
}
console.log(JSON.stringify({ active_sampled: (data||[]).length, active_count: count, withAdaptiveCz }));
