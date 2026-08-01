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

const targets = [
  { source: "cpa_tl" as const, id: 23799, label: "Podagran" },
  { source: "m1_top" as const, id: 6044, label: "Cannabis Oil" },
];

const { getOrGenerateProductContentDetailed, PIPELINE_VERSION } = await import("../src/lib/ai-content.server.ts");
const { loadOffers } = await import("../src/lib/offers.server.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

const offers = await loadOffers();
console.log(`pipeline=${PIPELINE_VERSION}\n`);

for (const t of targets) {
  const offer = offers.find((o) => o.source === t.source && o.id === t.id);
  if (!offer) {
    console.log(`${t.label}: not found`);
    continue;
  }
  console.log(`--- ${t.label} ---`);
  const t0 = Date.now();
  await getOrGenerateProductContentDetailed(t.source, t.id, "uk", offer.categorySlug, { forceRegen: true });
  const { data } = await supabaseAdmin
    .from("product_content")
    .select("display_title_uk,title_uk,qa_status_uk,qa_reason_uk,description_html_uk")
    .eq("source", t.source)
    .eq("offer_id", t.id)
    .maybeSingle();
  const title = data?.display_title_uk ?? "";
  const ru = /(?:для|капсул|сироп от|гипертон|сустав|подагр|улучшения)/i.test(title);
  console.log(`ms: ${Date.now() - t0}`);
  console.log(`display_title: ${title}`);
  console.log(`meta_title: ${data?.title_uk}`);
  console.log(`qa: ${data?.qa_status_uk} | ${data?.qa_reason_uk}`);
  console.log(`html_len: ${(data?.description_html_uk ?? "").length} ru_in_title: ${ru}\n`);
}
