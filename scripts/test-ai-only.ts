/**
 * Batch regen + report for v57 ai-only pipeline.
 * Usage: npx tsx scripts/test-ai-only.ts --offers=21180,2976,1170,145
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

const source = (process.argv.find((a) => a.startsWith("--source="))?.split("=")[1] ?? "cpa_tl") as OfferSource;
const offers = (process.argv.find((a) => a.startsWith("--offers="))?.split("=")[1] ?? "21180,2976,1170,145")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter(Boolean);

const { getOrGenerateProductContent, PIPELINE_VERSION, deriveContentTier } = await import(
  "../src/lib/ai-content.server.ts"
);
const { loadOffers } = await import("../src/lib/offers.server.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

console.log(`\n=== ai-only test — pipeline=${PIPELINE_VERSION} source=${source} ===\n`);

type Row = {
  offer_id: number;
  display_title_uk: string | null;
  description_html_uk: string | null;
  faq_uk: unknown;
  qa_status_uk: string | null;
  qa_reason_uk: string | null;
  generated_at: string | null;
};

const results: Array<Record<string, unknown>> = [];
const allOffers = await loadOffers();

for (const offerId of offers) {
  const offer = allOffers.find((o) => o.id === offerId && o.source === source) ?? null;
  if (!offer) {
    console.log(`${offerId}: offer not found for source=${source}`);
    continue;
  }
  console.log(`--- Regen ${source}:${offerId} (${offer.categorySlug}) ---`);
  const started = Date.now();
  const out = await getOrGenerateProductContent(source, offerId, "uk", offer.categorySlug, {
    forceRegen: true,
  });
  const ms = Date.now() - started;

  const { data: row } = await supabaseAdmin
    .from("product_content")
    .select(
      "offer_id,display_title_uk,description_html_uk,faq_uk,qa_status_uk,qa_reason_uk,generated_at",
    )
    .eq("source", source)
    .eq("offer_id", offerId)
    .maybeSingle();

  const pc = row as Row | null;
  const html = pc?.description_html_uk ?? "";
  const faq = Array.isArray(pc?.faq_uk) ? pc!.faq_uk : [];
  const tier = deriveContentTier(pc?.qa_status_uk, pc?.qa_reason_uk, html);
  const hasCyr = /[\u0400-\u04FF]/.test(`${pc?.display_title_uk ?? ""}${html}`);

  const entry = {
    source,
    offer_id: offerId,
    slug: offer.slug,
    url: `https://recenze-ceny.cz/${offer.categorySlug}/${offer.slug}`,
    ms,
    tier,
    qa_status: pc?.qa_status_uk,
    qa_reason: pc?.qa_reason_uk,
    html_len: html.length,
    faq_count: faq.length,
    display_title: pc?.display_title_uk,
    html_head: html.slice(0, 120),
    faq_first_q: (faq[0] as { q?: string })?.q ?? null,
    cyrillic: hasCyr,
    content_tier_returned: out?.content_tier ?? null,
  };
  results.push(entry);
  console.log(JSON.stringify(entry, null, 2));
}

console.log("\n=== SUMMARY ===");
for (const r of results) {
  console.log(
    `${r.source}:${r.offer_id} [${r.slug}] tier=${r.tier} html=${r.html_len} faq=${r.faq_count} cyr=${r.cyrillic} title=${String(r.display_title).slice(0, 45)}`,
  );
}
