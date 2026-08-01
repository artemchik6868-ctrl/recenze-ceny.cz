import { readFileSync, writeFileSync } from "fs";
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
const skip = new Set([5911, 22128, 6247]);

function absUrl(url) {
  if (!url) return null;
  const u = String(url).trim();
  return /^https?:\/\//i.test(u) ? u : `https://${u.replace(/^\/+/, "")}`;
}

const { data } = await sb.from("shakes_offers").select("offer_id,title,raw").eq("is_active", true).limit(400);
const picks = [];
const stems = new Set();
for (const row of data || []) {
  if (skip.has(row.offer_id)) continue;
  const landings = (row.raw || {}).landings || [];
  const adapts = landings.filter((l) => String(l.type || "").includes(ADAPTIVE) && l.url);
  const cz = adapts.find((l) => /^cz/i.test(String(l.url)));
  if (!cz) continue;
  const stem = String(row.title).toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 10);
  if (!stem || stems.has(stem)) continue;
  stems.add(stem);
  picks.push({ id: row.offer_id, title: row.title, url: absUrl(cz.url) });
  if (picks.length >= 5) break;
}
writeFileSync("scripts/out/smoke5-ids.json", JSON.stringify(picks, null, 2));
console.log(JSON.stringify(picks, null, 2));
