/**
 * Regenerate AI content for all offers that already have HTML (pilot batches + fixes).
 * Usage: npx tsx scripts/regen-existing-content.ts [--dry-run]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OfferSource } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const dryRun = process.argv.includes("--dry-run");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
const { loadOffers } = await import("../src/lib/offers.server.ts");
const { getOrGenerateProductContent, PIPELINE_VERSION } = await import("../src/lib/ai-content.server.ts");

const { data } = await supabaseAdmin
  .from("product_content")
  .select("source,offer_id")
  .not("description_html_uk", "is", null);

const rows = (data ?? []) as { source: OfferSource; offer_id: number }[];
const offers = await loadOffers();
const byKey = new Map(offers.map((o) => [`${o.source}:${o.id}`, o]));

console.log(`\n=== regen-existing-content pipeline=${PIPELINE_VERSION} rows=${rows.length} dry=${dryRun} ===\n`);

let ok = 0;
let fail = 0;
for (const row of rows) {
  const key = `${row.source}:${row.offer_id}`;
  const offer = byKey.get(key);
  if (!offer) {
    console.log(`SKIP ${key} — not in catalog`);
    continue;
  }
  if (dryRun) {
    console.log(`DRY ${key} ${offer.categorySlug}`);
    ok += 1;
    continue;
  }
  try {
    const out = await getOrGenerateProductContent(row.source, row.offer_id, "uk", offer.categorySlug, {
      forceRegen: true,
    });
    if (out?.description_html && out.description_html.length >= 400) {
      ok += 1;
      console.log(`OK ${key} html=${out.description_html.length} tier=${out.content_tier}`);
    } else {
      fail += 1;
      console.log(`FAIL ${key}`);
    }
  } catch (err) {
    fail += 1;
    console.log(`ERR ${key}: ${err}`);
  }
}
console.log(`\nDone ok=${ok} fail=${fail}`);
