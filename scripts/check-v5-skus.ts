/**
 * Smoke-check v5 regen SKUs.
 * Usage: npx tsx scripts/check-v5-skus.ts
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const SKUS = [
  { source: "m1_top", id: 4454, label: "ProstAktiv" },
  { source: "adcombo", id: 40524, label: "CardioViva" },
  { source: "kma", id: 4852, label: "Parazax" },
] as const;

const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
const { pickReviews, audienceFor } = await import("../src/lib/reviews.ts");
const { loadOffers } = await import("../src/lib/offers.server.ts");

const offers = await loadOffers();
let ok = true;

for (const sku of SKUS) {
  const offer = offers.find((o) => o.source === sku.source && o.id === sku.id);
  const { data } = await supabaseAdmin
    .from("product_content")
    .select("display_title_uk,description_html_uk")
    .eq("source", sku.source)
    .eq("offer_id", sku.id)
    .maybeSingle();

  const title = data?.display_title_uk ?? "";
  const html = data?.description_html_uk ?? "";
  const blob = `${title} ${html}`.toLowerCase();
  const reviews = offer
    ? pickReviews(sku.id, 5, "de", audienceFor(offer.categorySlug), offer.categorySlug)
    : [];

  console.log(`\n=== ${sku.label} (${sku.source}:${sku.id}) ===`);
  console.log(`title: ${title}`);
  console.log(`reviews: ${reviews.length}`);

  if (sku.label === "ProstAktiv") {
    const badBody = /\bcreme\b zur äußerlichen|creme zur äußeren|äußerlich auftragen/i.test(blob);
    const good = /kapsel/i.test(blob) && /einnahme/i.test(blob);
    console.log(`  Kapseln+Einnahme: ${good ? "OK" : "FAIL"}`);
    console.log(`  no topical Creme body: ${!badBody ? "OK" : "FAIL"}`);
    if (!good || badBody) ok = false;
  }
  if (sku.label === "CardioViva") {
    const bad = /highprice/i.test(title);
    console.log(`  no HighPrice in title: ${!bad ? "OK" : "FAIL"}`);
    if (bad) ok = false;
  }
  if (sku.label === "Parazax") {
    const deReviews = reviews.every((r) => r.text.trim().length > 20);
    console.log(`  5 DE reviews: ${reviews.length === 5 && deReviews ? "OK" : "FAIL"}`);
    if (reviews.length !== 5 || !deReviews) ok = false;
    if (reviews[0]) console.log(`  sample: ${reviews[0].text.slice(0, 80)}…`);
  }
}

console.log(`\n=== SMOKE ${ok ? "PASS" : "FAIL"} ===`);
process.exit(ok ? 0 : 1);
