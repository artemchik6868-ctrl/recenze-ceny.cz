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
  process.env[m[1].trim()] = v;
}

const { supabaseAdmin } = await import(
  pathToFileURL(resolve(root, "src/integrations/supabase/client.server.ts")).href
);
const db = supabaseAdmin as unknown as { from: (t: string) => any };

const { data: budget } = await db.from("image_facts_daily_budget").select("*");
const { data: rows } = await db
  .from("offer_image_facts")
  .select("source,offer_id,method,status,llm_attempts");

const byMethod: Record<string, number> = {};
for (const r of rows ?? []) {
  byMethod[r.method] = (byMethod[r.method] || 0) + 1;
}

// Known paid usage from batch2 smoke JSON (Gemini 2.5 Flash list prices)
const FLASH_IN = 0.3 / 1_000_000;
const FLASH_OUT = 2.5 / 1_000_000;
const paidUsage = [
  { name: "adcombo:40600 CardioViva", prompt: 2637, completion: 132 },
  { name: "adcombo:39220 Tvidler", prompt: 2638, completion: 120 },
];
let paidUsd = 0;
for (const p of paidUsage) {
  const c = p.prompt * FLASH_IN + p.completion * FLASH_OUT;
  paidUsd += c;
  console.log(`${p.name}: $${c.toFixed(6)}`);
}

console.log(JSON.stringify({ budget, byMethod, rowCount: (rows ?? []).length, paidUsdEst: Number(paidUsd.toFixed(6)) }, null, 2));
