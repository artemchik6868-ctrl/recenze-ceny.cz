/**
 * Audit product_content + catalog for non-German locale leaks (PL/Cyrillic).
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
  hasNonGermanProductContent,
  hasNonGermanLocaleLeak,
  productContentBlob,
} = await import("../src/lib/locale-leak-de.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
const { loadOffers } = await import("../src/lib/offers.server.ts");
const { offerDisplayTitle } = await import("../src/lib/offer-display.ts");

const { data, error } = await supabaseAdmin
  .from("product_content")
  .select("source, offer_id, display_title_uk, description_html_uk, faq_uk");

if (error) {
  console.error("audit-product-content-de: DB error", error.message);
  process.exit(1);
}

let leaks = 0;
for (const row of data ?? []) {
  const dto = {
    display_title: row.display_title_uk,
    description_html: row.description_html_uk,
    faq: row.faq_uk,
  };
  if (!hasNonGermanProductContent(dto)) continue;
  leaks += 1;
  const key = `${row.source}:${row.offer_id}`;
  const blob = productContentBlob(dto);
  const sample = blob.replace(/\s+/g, " ").trim().slice(0, 100);
  console.log(`DB LEAK ${key} — ${sample}…`);
}

const offers = await loadOffers();
for (const o of offers) {
  const title = offerDisplayTitle(o);
  if (!hasNonGermanLocaleLeak(title)) continue;
  leaks += 1;
  console.log(`CATALOG LEAK ${o.source}:${o.id} (${o.categorySlug}) — ${title.slice(0, 100)}`);
}

if (leaks) {
  console.log(`\naudit-product-content-de: ${leaks} leak(s) in DB and/or catalog`);
  process.exit(1);
}
console.log(
  `audit-product-content-de: OK — ${data?.length ?? 0} DB rows, ${offers.length} catalog offers checked`,
);
