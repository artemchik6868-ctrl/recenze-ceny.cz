/**
 * Tier / QA reason distribution in product_content.
 *
 * Usage:
 *   node scripts/audit-tiers.mjs
 *   node scripts/audit-tiers.mjs --source=cpa_tl
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
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1].trim()] = v;
  }
  return env;
}

const FALLBACK_MARKERS = [
  "componenti attivi in sinergia",
  "formula con estratti vegetali per supporto quotidiano",
  "disponibile per l'ordine in italia",
];

const env = loadEnv();
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const sourceArg = process.argv.find((a) => a.startsWith("--source="))?.split("=")[1] ?? null;

let q = sb.from("product_content").select(
  "source,offer_id,qa_status_uk,qa_reason_uk,form_kind,description_html_uk,display_title_uk",
);
if (sourceArg) q = q.eq("source", sourceArg);

const { data, error } = await q;
if (error) {
  console.error(error.message);
  process.exit(1);
}

const rows = data ?? [];
const byReason = new Map();
let fallbackHtml = 0;
let total = rows.length;

for (const r of rows) {
  const key = `${r.qa_status_uk ?? "null"}|${r.qa_reason_uk ?? "null"}|${r.form_kind ?? "?"}`;
  byReason.set(key, (byReason.get(key) ?? 0) + 1);
  const html = (r.description_html_uk ?? "").toLowerCase();
  if (FALLBACK_MARKERS.some((m) => html.includes(m))) fallbackHtml += 1;
}

console.log(`\nproduct_content rows: ${total}${sourceArg ? ` (source=${sourceArg})` : ""}`);
console.log(`fallback-template HTML markers: ${fallbackHtml} (${total ? Math.round((fallbackHtml / total) * 100) : 0}%)\n`);

const sorted = [...byReason.entries()].sort((a, b) => b[1] - a[1]);
console.log("qa_status | qa_reason | form_kind | count");
console.log("-".repeat(60));
for (const [key, count] of sorted.slice(0, 25)) {
  const [status, reason, form] = key.split("|");
  console.log(`${status} | ${reason} | ${form} | ${count}`);
}
