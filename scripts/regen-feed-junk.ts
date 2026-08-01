/**
 * Regen offers with affiliate feed markers (EU/IT/LOW/2.0) in brand or cached short fields.
 *
 * Usage:
 *   npx tsx scripts/regen-feed-junk.ts --dry-run
 *   npx tsx scripts/regen-feed-junk.ts
 *   npx tsx scripts/regen-feed-junk.ts --only=shakes:22018
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { containsAffiliateSkuTokens } from "../src/lib/brand-clean";
import type { OfferSource } from "../src/lib/types";

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

const dryRun = process.argv.includes("--dry-run");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const onlyKeys = onlyArg
  ? new Set(onlyArg.slice(7).split(",").map((s) => s.trim()).filter(Boolean))
  : null;

function fieldHasJunk(...values: Array<string | null | undefined>): boolean {
  return values.some((v) => containsAffiliateSkuTokens(v ?? ""));
}

const { loadOffers } = await import("../src/lib/offers.server.ts");
const { getOrGenerateProductContent, PIPELINE_VERSION } = await import(
  "../src/lib/ai-content.server.ts"
);
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

const offers = await loadOffers();
const byKey = new Map(offers.map((o) => [`${o.source}:${o.id}`, o]));

const { data: contentRows } = await supabaseAdmin
  .from("product_content")
  .select("source, offer_id, title_uk, meta_desc_uk, display_title_uk, subtitle_uk");

const contentByKey = new Map(
  (contentRows ?? []).map((r) => [
    `${r.source}:${r.offer_id}`,
    r as {
      title_uk: string | null;
      meta_desc_uk: string | null;
      display_title_uk: string | null;
      subtitle_uk: string | null;
    },
  ]),
);

const junkKeys = new Set<string>();

for (const o of offers) {
  const key = `${o.source}:${o.id}`;
  const row = contentByKey.get(key);
  const slugJunk = /\b(eu|it|low|high|price|top|vip|free|hold)-/i.test(o.slug) ||
    /-(eu|it|low|high|price|top|vip|free|hold)-/i.test(o.slug);
  const hit =
    slugJunk ||
    fieldHasJunk(row?.title_uk, row?.meta_desc_uk, row?.display_title_uk, row?.subtitle_uk);
  if (hit) junkKeys.add(key);
}

const targetKeys = onlyKeys
  ? [...onlyKeys].filter((k) => byKey.has(k))
  : [...junkKeys];

console.log(
  `\n=== regen-feed-junk — ${targetKeys.length} offers (dry=${dryRun}) pipeline=${PIPELINE_VERSION} ===\n`,
);

let ok = 0;
let skip = 0;
let fail = 0;

for (const key of targetKeys.sort()) {
  const offer = byKey.get(key);
  if (!offer) {
    console.log(`SKIP ${key} — not in catalog`);
    skip += 1;
    continue;
  }
  const row = contentByKey.get(key);
  console.log(`REGEN ${key}`);
  console.log(`  title: ${offer.title.slice(0, 60)}`);
  console.log(`  brand: ${offer.brand.slice(0, 40)}`);
  if (row?.display_title_uk) console.log(`  display: ${row.display_title_uk.slice(0, 60)}`);
  if (dryRun) {
    ok += 1;
    continue;
  }
  const [source, idStr] = key.split(":");
  const out = await getOrGenerateProductContent(
    source as OfferSource,
    Number(idStr),
    "uk",
    offer.categorySlug,
    { forceRegen: true },
  );
  if (out?.description_html && out.description_html.length >= 400) {
    ok += 1;
    console.log(`  OK   display=${out.display_title?.slice(0, 70)} title=${out.title?.slice(0, 60)}`);
  } else {
    fail += 1;
    console.log(`  FAIL tier=${out?.content_tier ?? "null"}`);
  }
}

console.log(`\nDone — ok=${ok} skip=${skip} fail=${fail}`);
