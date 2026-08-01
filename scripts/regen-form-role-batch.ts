/**
 * Targeted persist + regen for form/role mismatch batch (user-reported URLs).
 * Usage: npx tsx scripts/regen-form-role-batch.ts [--dry-run]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyTitleFirst } from "../src/lib/classify";
import { resolveIntentListingSlug } from "../src/lib/catalog-shelf";
import { buildPartnerClassifyBlob } from "../src/lib/partner-feed-text";
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

const TARGET_KEYS: Array<[OfferSource, number]> = [
  ["shakes", 16086],
  ["shakes", 15906],
  ["cpa_tl", 1218],
  ["cpagetti", 16979],
  ["cpagetti", 16977],
  ["shakes", 18914],
  ["shakes", 18950],
  ["shakes", 18966],
];

const TABLE: Record<OfferSource, string> = {
  cpa_tl: "cpa_tl_offers",
  kma: "kma_offers",
  m1_top: "m1_offers",
  cpagetti: "cpagetti_offers",
  adcombo: "adcombo_offers",
  shakes: "shakes_offers",
  terraleads: "terraleads_offers",
};

async function loadRaw(source: OfferSource, offerId: number): Promise<unknown> {
  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
  const { data } = await supabaseAdmin
    .from(TABLE[source])
    .select("raw, category")
    .eq("offer_id", offerId)
    .maybeSingle();
  return data ?? null;
}

const { loadOffers } = await import("../src/lib/offers.server.ts");
const { loadResolvedCategoryMap, persistResolvedCategorySlug } = await import(
  "../src/lib/catalog-shelf.server.ts"
);
const { getOrGenerateProductContent } = await import("../src/lib/ai-content.server.ts");

const offers = await loadOffers();
const resolvedMap = await loadResolvedCategoryMap();
const byKey = new Map(offers.map((o) => [`${o.source}:${o.id}`, o]));

console.log(`\n=== regen-form-role-batch — ${TARGET_KEYS.length} targets (dry=${dryRun}) ===\n`);

let ok = 0;
for (const [source, id] of TARGET_KEYS) {
  const key = `${source}:${id}`;
  const o = byKey.get(key);
  if (!o) {
    console.log(`SKIP ${key} — offer not found`);
    continue;
  }
  const rawTitle = o.title || o.brand || "";
  const row = await loadRaw(source, id);
  const categoryField =
    (row as { category?: string | null } | null)?.category ?? o.categoryKey ?? o.categoryName ?? "";
  const blob = row?.raw
    ? buildPartnerClassifyBlob(source, row.raw, rawTitle, categoryField)
    : o.feedClassifyText || String(categoryField);
  const syncSlug = classifyTitleFirst(rawTitle, blob, "other");
  const persisted = resolvedMap.get(key);
  const expected = resolveIntentListingSlug({
    source,
    offerId: id,
    syncSlug,
    resolvedSlug: persisted,
    rawTitle,
    brand: o.brand,
    feedText: blob,
  });
  console.log(`${key} ${persisted ?? syncSlug} → ${expected} «${rawTitle.slice(0, 50)}»`);
  if (dryRun) {
    ok += 1;
    continue;
  }
  await persistResolvedCategorySlug(source, id, expected);
  const out = await getOrGenerateProductContent(source, id, "uk", expected, { forceRegen: true });
  if (out?.description_html) ok += 1;
}

console.log(`\nDone — ok=${ok}/${TARGET_KEYS.length}`);
