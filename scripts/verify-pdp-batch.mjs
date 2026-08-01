/**
 * Quick PDP verification from DB (post-regen).
 * Usage: npx tsx scripts/verify-pdp-batch.mjs
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

const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
const { pickReviews, audienceFor } = await import("../src/lib/reviews.ts");
const { hasGermanLocaleLeak } = await import("../src/lib/locale-leak-cz.ts");
const { extractDeliveryH2Text } = await import("../src/lib/pdp-html-variants.ts");

const CITY_RE = /Praha|Cluj|Timișoara|Iași|Constanța|Brașov/i;
const CH_CITY_RE = /\b(Bern|Basel|Genf|Luzern|Lausanne)\b/;

const FIXTURES = [
  ["m1_top", 6654, "zrak"],
  ["kma", 7865, "krevni-tlak"],
  ["kma", 6423, "anti-aging"],
  ["kma", 9108, "intimate-comfort"],
];

const batchPath = resolve(root, "scripts/.cache/batch-generate-2026-06-28T12-08-15.json");
const batch = JSON.parse(readFileSync(batchPath, "utf8"));
const batchOffers = batch.results.map((r) => [r.source, r.id, r.category]);

async function check([source, id, category]) {
  const { data: row } = await supabaseAdmin
    .from("product_content")
    .select("display_title_uk,description_html_uk,faq_uk")
    .eq("source", source)
    .eq("offer_id", id)
    .maybeSingle();
  const html = row?.description_html_uk ?? "";
  const faq = Array.isArray(row?.faq_uk) ? row.faq_uk : [];
  const reviews = pickReviews(id, 5, "ro", audienceFor(category), category);
  const blob = `${row?.display_title_uk ?? ""}${html}${JSON.stringify(faq)}`;
  const issues = [];
  if (html.length < 400) issues.push(`html-short:${html.length}`);
  if (faq.length < 1) issues.push("faq-empty");
  if (reviews.length === 0) issues.push("reviews-empty");
  if (!CITY_RE.test(html)) issues.push("no-ro-cities");
  if (CH_CITY_RE.test(html)) issues.push("ch-cities");
  if (hasGermanLocaleLeak(blob)) issues.push("de-leak");
  if (!/<h2/i.test(html)) issues.push("no-h2");
  return {
    key: `${source}:${id}`,
    category,
    html_len: html.length,
    faq_count: faq.length,
    reviews_count: reviews.length,
    h2: (html.match(/<h2[^>]*>([^<]*(?:comanzi|livrare)[^<]*)<\/h2>/i) ?? [])[1]?.trim() ?? null,
    pass: issues.length === 0,
    issues,
  };
}

const all = [...FIXTURES, ...batchOffers.filter((o) => !FIXTURES.some((f) => f[0] === o[0] && f[1] === o[1]))];
const results = [];
for (const o of all) results.push(await check(o));

const pass = results.filter((r) => r.pass).length;
console.log(JSON.stringify({ pass, total: results.length, results }, null, 2));
process.exit(pass === results.length ? 0 : 1);
