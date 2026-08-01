/**
 * Regen a fixed matrix of offers (mixed sources) and print workers.dev links.
 * Usage: npx tsx scripts/test-batch-matrix.ts
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

/** 10 offers: mixed partner + category */
const MATRIX: Array<{ source: OfferSource; offerId: number; note: string }> = [
  { source: "cpa_tl", offerId: 100127, note: "home-climate / appliance" },
  { source: "cpa_tl", offerId: 1170, note: "hracky" },
  { source: "cpa_tl", offerId: 145, note: "obleceni" },
  { source: "cpa_tl", offerId: 3554, note: "modni-doplnky" },
  { source: "kma", offerId: 7784, note: "zrak" },
  { source: "kma", offerId: 6821, note: "prostata" },
  { source: "m1_top", offerId: 6338, note: "prostata" },
  { source: "cpagetti", offerId: 7191, note: "prostate (UA tail)" },
  { source: "adcombo", offerId: 40576, note: "klouby" },
  { source: "shakes", offerId: 14451, note: "prostate (UA tail)" },
];

const { getOrGenerateProductContent, PIPELINE_VERSION, deriveContentTier } = await import(
  "../src/lib/ai-content.server.ts"
);
const { loadOffers } = await import("../src/lib/offers.server.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

console.log(`\n=== batch matrix — ${PIPELINE_VERSION} ===\n`);

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
    .select("display_title_uk,description_html_uk,faq_uk,qa_status_uk,qa_reason_uk")
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
    faq_first: (faq[0] as { q?: string })?.q ?? null,
    cyrillic: hasCyr,
  });
}

console.log("\n=== LINKS FOR REVIEW ===\n");
for (const r of rows) {
  console.log(`${r.url}`);
  console.log(`  ${r.source}:${r.offerId} | ${r.category} | ${r.display_title} | tier=${r.tier} faq=${r.faq_count} cyr=${r.cyrillic}`);
  console.log("");
}
