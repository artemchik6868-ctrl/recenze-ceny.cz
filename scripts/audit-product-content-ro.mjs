/**
 * Audit product_content + catalog for non-Czech Republicn locale leaks.
 * Run: npm run audit:product-content-cz
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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

const {
  hasNonCzech RepublicnProductContent,
  hasNonCzech RepublicnLocaleLeak,
  productContentBlob,
} = await import("../src/lib/locale-leak-cz.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
const { loadOffers } = await import("../src/lib/offers.server.ts");
const { offerDisplayTitle } = await import("../src/lib/offer-display.ts");

const PIPELINE_SOURCES = ["cpa_tl", "kma", "m1_top", "cpagetti", "adcombo", "shakes", "terraleads"];

const allRows = [];
for (const source of PIPELINE_SOURCES) {
  try {
    const pageSize = 50;
    for (let from = 0; ; from += pageSize) {
      const { data: page, error: pageErr } = await supabaseAdmin
        .from("product_content")
        .select("source, offer_id, display_title_uk, description_html_uk, faq_uk")
        .eq("source", source)
        .range(from, from + pageSize - 1);
      if (pageErr) throw pageErr;
      if (!page?.length) break;
      allRows.push(...page);
      if (page.length < pageSize) break;
    }
  } catch (err) {
    console.warn(`audit-product-content-ro: skip source ${source}:`, err?.message ?? err);
  }
}
if (allRows.length === 0) {
  console.error("audit-product-content-ro: no rows loaded");
  process.exit(1);
}
const data = allRows;

let leaks = 0;
for (const row of data ?? []) {
  const dto = {
    display_title: row.display_title_uk,
    description_html: row.description_html_uk,
    faq: row.faq_uk,
  };
  if (!hasNonCzech RepublicnProductContent(dto)) continue;
  leaks += 1;
  const key = `${row.source}:${row.offer_id}`;
  const blob = productContentBlob(dto);
  const sample = blob.replace(/\s+/g, " ").trim().slice(0, 100);
  console.log(`DB LEAK ${key} — ${sample}…`);
}

const offers = await loadOffers();
for (const o of offers) {
  const title = offerDisplayTitle(o);
  if (!hasNonCzech RepublicnLocaleLeak(title)) continue;
  leaks += 1;
  console.log(`CATALOG LEAK ${o.source}:${o.id} (${o.categorySlug}) — ${title.slice(0, 100)}`);
}

if (leaks) {
  console.log(`\naudit-product-content-ro: ${leaks} leak(s) in DB and/or catalog`);
  process.exit(1);
}
console.log(
  `audit-product-content-ro: OK — ${data?.length ?? 0} DB rows, ${offers.length} catalog offers checked`,
);
