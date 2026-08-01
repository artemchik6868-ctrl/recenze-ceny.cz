/**
 * Regenerate fixed batch of 10 test offers (EUR storefront).
 * Usage: npx tsx scripts/regen-batch-10.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OfferSource } from "../src/lib/types";

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

const TARGETS: Array<{ source: OfferSource; id: number; url: string }> = [
  { source: "shakes", id: 16556, url: "https://recenze-ceny.cz/fungus/benaga-s16556" },
  { source: "kma", id: 6897, url: "https://recenze-ceny.cz/diabetes-care/dia-k6897" },
  { source: "shakes", id: 15292, url: "https://recenze-ceny.cz/weight-management/abslim-s15292" },
  { source: "cpagetti", id: 6115, url: "https://recenze-ceny.cz/weight-management/fortunella-g6115" },
  { source: "cpagetti", id: 12183, url: "https://recenze-ceny.cz/cystitis/cystiolla-g12183" },
  { source: "m1_top", id: 5801, url: "https://recenze-ceny.cz/blood-pressure/tonerin-m5801" },
  { source: "kma", id: 11535, url: "https://recenze-ceny.cz/blood-pressure/cardioser-k11535" },
  { source: "adcombo", id: 34548, url: "https://recenze-ceny.cz/weight-management/apolloss-a34548" },
  { source: "shakes", id: 12905, url: "https://recenze-ceny.cz/weight-management/abslim-s12905" },
  { source: "kma", id: 11003, url: "https://recenze-ceny.cz/anti-aging/eudalie-k11003" },
];

const LEV_RE = /\bлв\.?\b|BGN/i;
const EUR_RE = /€/;

const { getOrGenerateProductContentDetailed, PIPELINE_VERSION } = await import(
  "../src/lib/ai-content.server.ts"
);
const { loadOffers } = await import("../src/lib/offers.server.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

const offers = await loadOffers();
console.log(`pipeline=${PIPELINE_VERSION} — regen ${TARGETS.length} offers\n`);

type Result = {
  key: string;
  url: string;
  ms: number;
  gen_status: string;
  display_title: string | null;
  meta_title: string | null;
  meta_desc: string | null;
  qa_status: string | null;
  qa_reason: string | null;
  html_len: number;
  faq_count: number;
  has_lev: boolean;
  has_eur: boolean;
  error?: string;
};

const results: Result[] = [];

for (const t of TARGETS) {
  const key = `${t.source}:${t.id}`;
  console.log(`--- ${key} ---`);
  const offer = offers.find((o) => o.source === t.source && o.id === t.id);
  if (!offer) {
    results.push({
      key,
      url: t.url,
      ms: 0,
      gen_status: "failed",
      display_title: null,
      meta_title: null,
      meta_desc: null,
      qa_status: null,
      qa_reason: null,
      html_len: 0,
      faq_count: 0,
      has_lev: false,
      has_eur: false,
      error: "offer not found",
    });
    console.log("ERROR: offer not found\n");
    continue;
  }

  const t0 = Date.now();
  let genStatus = "failed";
  try {
    const gen = await getOrGenerateProductContentDetailed(
      t.source,
      t.id,
      "uk",
      offer.categorySlug,
      { forceRegen: true },
    );
    genStatus = gen.status;
  } catch (err) {
    results.push({
      key,
      url: t.url,
      ms: Date.now() - t0,
      gen_status: "failed",
      display_title: null,
      meta_title: null,
      meta_desc: null,
      qa_status: null,
      qa_reason: null,
      html_len: 0,
      faq_count: 0,
      has_lev: false,
      has_eur: false,
      error: String(err),
    });
    console.log(`ERROR: ${err}\n`);
    continue;
  }

  const { data } = await supabaseAdmin
    .from("product_content")
    .select(
      "display_title_uk,title_uk,meta_desc_uk,description_html_uk,faq_uk,qa_status_uk,qa_reason_uk",
    )
    .eq("source", t.source)
    .eq("offer_id", t.id)
    .maybeSingle();

  const html = data?.description_html_uk ?? "";
  const faq = Array.isArray(data?.faq_uk) ? data!.faq_uk : [];
  const blob = `${data?.title_uk ?? ""}${data?.meta_desc_uk ?? ""}${html}`;
  const entry: Result = {
    key,
    url: t.url,
    ms: Date.now() - t0,
    gen_status: genStatus,
    display_title: data?.display_title_uk ?? null,
    meta_title: data?.title_uk ?? null,
    meta_desc: data?.meta_desc_uk ?? null,
    qa_status: data?.qa_status_uk ?? null,
    qa_reason: data?.qa_reason_uk ?? null,
    html_len: html.length,
    faq_count: faq.length,
    has_lev: LEV_RE.test(blob),
    has_eur: EUR_RE.test(blob),
  };
  results.push(entry);

  console.log(`ms: ${entry.ms}`);
  console.log(`display_title: ${entry.display_title}`);
  console.log(`meta_title: ${entry.meta_title}`);
  console.log(`qa: ${entry.qa_status} | ${entry.qa_reason}`);
  console.log(`html_len: ${entry.html_len} faq: ${entry.faq_count} lev: ${entry.has_lev} eur: ${entry.has_eur}\n`);
}

const report = {
  generated_at: new Date().toISOString(),
  pipeline: PIPELINE_VERSION,
  total: results.length,
  ok: results.filter((r) => r.gen_status !== "failed" && !r.error).length,
  with_lev: results.filter((r) => r.has_lev).length,
  with_eur: results.filter((r) => r.has_eur).length,
  results,
};

const cacheDir = resolve(root, "scripts/.cache");
mkdirSync(cacheDir, { recursive: true });
const outPath = resolve(cacheDir, "batch-regen-10-eur.json");
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

console.log("=== SUMMARY ===");
for (const r of results) {
  const cur = r.has_lev ? "LEV!" : r.has_eur ? "EUR ok" : "no price";
  console.log(`${r.key} qa=${r.qa_status} ${cur} | ${r.url}`);
}
console.log(`\nWrote ${outPath}`);
console.log(`Done ${report.ok}/${report.total} | lev=${report.with_lev} eur=${report.with_eur}`);
