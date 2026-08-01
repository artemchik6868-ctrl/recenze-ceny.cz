/**
 * Second batch: 10 offers NOT in test-batch-matrix.ts — mixed partners/categories.
 * Usage: npx tsx scripts/test-batch-matrix-2.ts
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

const BASE = "https://espertirecensioni.agnzloysony.workers.dev";

/** 10 new offers — no overlap with batch 1 */
const MATRIX: Array<{ source: OfferSource; offerId: number; note: string }> = [
  { source: "cpa_tl", offerId: 23439, note: "joint-care supplement" },
  { source: "cpa_tl", offerId: 23417, note: "prostate-health supplement" },
  { source: "kma", offerId: 7306, note: "joint-care gel" },
  { source: "m1_top", offerId: 6848, note: "valgus spray (UA feed)" },
  { source: "m1_top", offerId: 6920, note: "zrak" },
  { source: "cpagetti", offerId: 7785, note: "joint EU + arthritis tail" },
  { source: "cpagetti", offerId: 8535, note: "vision Oculax EU" },
  { source: "adcombo", offerId: 39734, note: "prostate Low Price" },
  { source: "shakes", offerId: 14811, note: "joint Hondroine IT low" },
  { source: "shakes", offerId: 21328, note: "vision Reishield IT" },
];

const { getOrGenerateProductContent, PIPELINE_VERSION, deriveContentTier } = await import(
  "../src/lib/ai-content.server.ts"
);
const { loadOffers } = await import("../src/lib/offers.server.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

console.log(`\n=== batch matrix 2 — ${PIPELINE_VERSION} ===\n`);

const allOffers = await loadOffers();
const rows: Array<Record<string, unknown>> = [];

for (const { source, offerId, note } of MATRIX) {
  const offer = allOffers.find((o) => o.id === offerId && o.source === source);
  if (!offer) {
    console.log(`SKIP ${source}:${offerId} — not found`);
    continue;
  }
  console.log(`--- ${source}:${offerId} (${offer.categorySlug}) ${note} ---`);
  await getOrGenerateProductContent(source, offerId, "uk", offer.categorySlug, { forceRegen: true });

  const { data: row } = await supabaseAdmin
    .from("product_content")
    .select("display_title_uk,title_uk,subtitle_uk,meta_desc_uk,description_html_uk,faq_uk,qa_status_uk,qa_reason_uk")
    .eq("source", source)
    .eq("offer_id", offerId)
    .maybeSingle();

  const html = row?.description_html_uk ?? "";
  const faq = Array.isArray(row?.faq_uk) ? row!.faq_uk : [];
  const tier = deriveContentTier(row?.qa_status_uk, row?.qa_reason_uk, html);
  const hasCyr = /[\u0400-\u04FF]/.test(`${row?.display_title_uk ?? ""}${html}`);
  const url = `${BASE}/${offer.categorySlug}/${offer.slug}`;

  rows.push({
    source,
    offerId,
    category: offer.categorySlug,
    note,
    url,
    tier,
    html_len: html.length,
    faq_count: faq.length,
    display_title: row?.display_title_uk,
    title: row?.title_uk,
    subtitle: row?.subtitle_uk,
    meta_desc: row?.meta_desc_uk,
    cyrillic: hasCyr,
  });
}

console.log("\n=== LINKS FOR REVIEW ===\n");
for (const r of rows) {
  console.log(`${r.url}`);
  console.log(`  ${r.source}:${r.offerId} | ${r.category} | H1: ${r.display_title}`);
  console.log(`  title: ${r.title} | subtitle: ${r.subtitle}`);
  console.log(`  meta: ${r.meta_desc}`);
  console.log(`  tier=${r.tier} faq=${r.faq_count} cyr=${r.cyrillic}`);
  console.log("");
}
