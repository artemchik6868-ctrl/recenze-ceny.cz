/** Spot-check v4 regen results. Usage: npx tsx scripts/check-v4-skus.ts */
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
const { loadOffers } = await import("../src/lib/offers.server.ts");
const { detectProductFacts } = await import("../src/lib/product-facts.ts");

const JOBS: [string, number][] = [
  ["shakes", 22304],
  ["kma", 9108],
];

async function main(): Promise<void> {
  const offers = await loadOffers();
  for (const [src, id] of JOBS) {
    const offer = offers.find((o) => o.source === src && o.id === id);
    if (offer) {
      const facts = detectProductFacts(offer.title, offer.category ?? "", offer.description ?? "");
      console.log(`[facts] ${src}:${id} title=${JSON.stringify(offer.title)} kind=${facts.kind}`);
    }
    const { data, error } = await supabaseAdmin
      .from("product_content")
      .select(
        "title_uk, subtitle_uk, meta_desc_uk, display_title_uk, form_kind, description_html_uk",
      )
      .eq("source", src)
      .eq("offer_id", id)
      .maybeSingle();
    if (error) {
      console.log(`${src}:${id} error=${error.message}`);
      continue;
    }
    const html = (data?.description_html_uk ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
    console.log(`--- ${src}:${id} form=${data?.form_kind}`);
    console.log(`  title=${data?.title_uk}`);
    console.log(`  display=${data?.display_title_uk}`);
    console.log(`  subtitle=${data?.subtitle_uk}`);
    console.log(`  meta=${data?.meta_desc_uk}`);
    console.log(`  html=${html}`);
    const all = [
      data?.title_uk,
      data?.subtitle_uk,
      data?.meta_desc_uk,
      data?.display_title_uk,
      data?.description_html_uk,
    ].join(" ");
    const bad =
      src === "shakes"
        ? ["Sehkorrektur", "äußeren Anwendung", "Augenpflegeprodukt", "Augentropfen"]
        : ["Intimkomfort", "intimes Wohlbefinden", "NEM für Intimkomfort"];
    for (const b of bad) {
      if (all.includes(b) || all.toLowerCase().includes(b.toLowerCase())) {
        console.log(`  WARN: found «${b}»`);
      }
    }
  }
}

main();
