/**
 * Pick N random offer_image_facts rows with status=ok for regen.
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/pick-random-image-facts-ok.ts -- --n=6
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

const nArg = process.argv.find((a) => a.startsWith("--n="));
const n = Math.min(20, Math.max(1, Number(nArg?.slice(4) ?? "6") || 6));
const exclude = new Set([
  "shakes:12197",
  "shakes:14345",
  "shakes:12889",
  "shakes:12905",
  "shakes:15648",
  "m1_top:6819",
  "m1_top:3639",
  "cpa_tl:23351",
  "cpa_tl:21743",
  "cpa_tl:21433",
  "kma:10314",
  "kma:9021",
  "adcombo:40695",
]);

const { supabaseAdmin } = await import(
  pathToFileURL(resolve(root, "src/integrations/supabase/client.server.ts")).href
);
const { data, error } = await supabaseAdmin
  .from("offer_image_facts")
  .select("source,offer_id")
  .eq("status", "ok");
if (error) throw new Error(error.message);

const pool = (data ?? [])
  .map((r: { source: string; offer_id: number }) => `${r.source}:${r.offer_id}`)
  .filter((k: string) => !exclude.has(k));

for (let i = pool.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [pool[i], pool[j]] = [pool[j], pool[i]];
}

const picks = pool.slice(0, n);
console.log(picks.join(" "));
console.error(`picked ${picks.length} of ${pool.length} eligible`);
