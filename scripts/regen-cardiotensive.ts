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

const source = "cpagetti" as const;
const id = 14935;

const { getOrGenerateProductContentDetailed, PIPELINE_VERSION } = await import(
  "../src/lib/ai-content.server.ts"
);
const { loadOffers } = await import("../src/lib/offers.server.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

const offer = (await loadOffers()).find((o) => o.source === source && o.id === id);
if (!offer) {
  console.error("Cardiotensive (cpagetti:14935) not found");
  process.exit(1);
}

console.log(`pipeline=${PIPELINE_VERSION} — regen Cardiotensive (cpagetti:14935)\n`);
const t0 = Date.now();
const gen = await getOrGenerateProductContentDetailed(source, id, "uk", offer.categorySlug, {
  forceRegen: true,
});

const { data } = await supabaseAdmin
  .from("product_content")
  .select(
    "display_title_uk,title_uk,meta_desc_uk,description_html_uk,faq_uk,qa_status_uk,qa_reason_uk",
  )
  .eq("source", source)
  .eq("offer_id", id)
  .maybeSingle();

const html = data?.description_html_uk ?? "";
const faq = Array.isArray(data?.faq_uk) ? data!.faq_uk : [];
const h2s = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)].map((m) => m[1].trim());
const blob = `${data?.display_title_uk ?? ""}${data?.title_uk ?? ""}${html}`;

console.log(`status: ${gen.status}`);
console.log(`ms: ${Date.now() - t0}`);
console.log(`display_title: ${data?.display_title_uk ?? "—"}`);
console.log(`meta_title: ${data?.title_uk ?? "—"}`);
console.log(`qa: ${data?.qa_status_uk ?? "—"} | ${data?.qa_reason_uk ?? "—"}`);
console.log(`html_len: ${html.length} h2: ${h2s.length} faq: ${faq.length}`);
console.log(`h2s: ${h2s.join(" | ") || "—"}`);
console.log(`lev: ${/лв\.|BGN/i.test(blob)} eur: ${/€| EUR/i.test(blob)}`);
console.log(`url: https://recenze-ceny.cz/blood-pressure/cardiotensive-g14935`);
