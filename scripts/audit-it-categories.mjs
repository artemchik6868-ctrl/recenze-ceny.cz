/**
 * Category audit for IT storefront — lists active offers with computed slug/title
 * and flags suspicious nutra slug + device/non-nutra keywords in title.
 *
 * Usage:
 *   node scripts/audit-it-categories.mjs
 *   node scripts/audit-it-categories.mjs --suspicious-only
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import jiti from "jiti";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const raw = readFileSync(resolve(root, ".env"), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
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

const { classifyTitleFirst } = jiti(import.meta.url)("../src/lib/classify.ts");

const SUPPLEMENT_SLUGS = new Set([
  "cukrovka", "krevni-tlak", "detox", "klouby", "mens-vitality",
  "hubnuti", "prostata", "zrak", "intimate-comfort",
  "zdravi-zen", "plisen-nehtu", "krecove-zily", "lupenka", "alkoholismus",
  "odvykani-koureni", "cystitida", "sluch", "vboceny-palec", "vypadavani-vlasu",
  "zvetseni-penisu", "zvetseni-prsou", "papilomy", "anti-aging",
  "paraziti", "traveni", "jatra", "stres", "chrapani",
]);

const DEVICE_OR_NON_NUTRA = [
  /trimmer|epilat|depil|massag|массаж|масаж|binocul|monocul|telescop|бинокл|подзорн|лупа|magnif/i,
  /heated|подогрев|підігр|обогрев|heater|кондиционер|кондиціонер|увлажн|зволож/i,
  /тонометр|глюкометр|парктроник|парктронік|bluetooth|проигрыват|програвач|палатк|намет/i,
  /куртк|жилет|gilet|giacc|scarpe|shoes|boots|кроссов|кросів|игруш|іграш|toy\b/i,
];

const TABLES = {
  cpa_tl: { table: "cpa_tl_offers", titleCol: "title" },
  kma: { table: "kma_offers", titleCol: "name" },
  m1_top: { table: "m1_offers", titleCol: "name" },
  cpagetti: { table: "cpagetti_offers", titleCol: "title" },
};

const suspiciousOnly = process.argv.includes("--suspicious-only");

const env = loadEnv();
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function isSuspicious(slug, title) {
  if (!SUPPLEMENT_SLUGS.has(slug)) return false;
  return DEVICE_OR_NON_NUTRA.some((re) => re.test(title));
}

const rows = [];

for (const [source, { table, titleCol }] of Object.entries(TABLES)) {
  const { data, error } = await sb
    .from(table)
    .select(`offer_id,${titleCol},category,is_active`)
    .eq("is_active", true);
  if (error) {
    console.error(`Failed to read ${table}:`, error.message);
    continue;
  }
  for (const row of data ?? []) {
    const title = row[titleCol] ?? "";
    const feedCat = row.category ?? "";
    const slug = classifyTitleFirst(title, feedCat, "other");
    const flag = isSuspicious(slug, title);
    rows.push({
      source,
      offer_id: row.offer_id,
      title,
      feed_category: feedCat,
      category_slug: slug,
      suspicious: flag,
    });
  }
}

rows.sort((a, b) => a.category_slug.localeCompare(b.category_slug) || a.title.localeCompare(b.title));

const bySlug = new Map();
for (const r of rows) {
  bySlug.set(r.category_slug, (bySlug.get(r.category_slug) ?? 0) + 1);
}

console.log(`\n=== IT category audit (${rows.length} active offers) ===\n`);
console.log("Counts by category_slug:");
for (const [slug, count] of [...bySlug.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${slug.padEnd(22)} ${count}`);
}

const suspicious = rows.filter((r) => r.suspicious);
console.log(`\nSuspicious (nutra slug + device/non-nutra title): ${suspicious.length}`);
for (const r of suspicious) {
  console.log(`  [${r.source}:${r.offer_id}] ${r.category_slug} ← "${r.title}" (feed: ${r.feed_category})`);
}

const showcase = [
  [/trimmer|тримм|бров|sopraccigl/i, "osobni-pece"],
  [/binocul|бинокл|monocul|telescop/i, "optika"],
  [/жилет|gilet|heated.*vest|подогреv.*жилет|подогрев.*жилет/i, "vyhrivane-obleceni"],
];
console.log("\nSpot-check (plan examples):");
for (const [re, expected] of showcase) {
  const hits = rows.filter((r) => re.test(r.title));
  for (const r of hits.slice(0, 5)) {
    const ok = r.category_slug === expected ? "OK" : "MISMATCH";
    console.log(`  ${ok} expected=${expected} got=${r.category_slug} — ${r.title}`);
  }
}

if (!suspiciousOnly) {
  console.log("\n--- All offers (slug | title) ---");
  for (const r of rows) {
    if (suspiciousOnly && !r.suspicious) continue;
    console.log(`${r.category_slug}\t${r.source}:${r.offer_id}\t${r.title}`);
  }
}
