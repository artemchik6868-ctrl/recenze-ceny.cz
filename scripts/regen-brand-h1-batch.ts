/**
 * Force-regen AI content for offers with truncated H1 brands (user QA batch).
 * Usage: npx tsx scripts/regen-brand-h1-batch.ts
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
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[m[1].trim()] = v;
}

/** slug → expected brand (for QA log) */
const TARGETS: { slug: string; source: OfferSource; id: number; expectedBrand: string; categorySlug: string }[] = [
  { slug: "spicure-g15805", source: "cpagetti", id: 15805, expectedBrand: "INSPICURE", categorySlug: "cukrovka" },
  { slug: "iftmax-m7077", source: "m1_top", id: 7077, expectedBrand: "UPLIFTMAX", categorySlug: "potence" },
  { slug: "stalis-9160", source: "cpa_tl", id: 9160, expectedBrand: "PROSTALIS", categorySlug: "prostata" },
  { slug: "al-g15755", source: "cpagetti", id: 15755, expectedBrand: "GRAVITAL+", categorySlug: "hubnuti" },
  { slug: "pillar-10046", source: "cpa_tl", id: 10046, expectedBrand: "EROPILLAR", categorySlug: "potence" },
];

const { getOrGenerateProductContentDetailed, PIPELINE_VERSION } = await import(
  "../src/lib/ai-content.server.ts"
);
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

console.log(`pipeline=${PIPELINE_VERSION}\n`);

let failed = 0;
for (const t of TARGETS) {
  console.log(`--- ${t.slug} (expected brand: ${t.expectedBrand}) ---`);
  const t0 = Date.now();
  try {
    const gen = await getOrGenerateProductContentDetailed(
      t.source,
      t.id,
      "uk",
      t.categorySlug,
      { forceRegen: true },
    );
    console.log(`status: ${gen.status} saved: ${gen.saved} ms: ${Date.now() - t0}`);

    const { data } = await supabaseAdmin
      .from("product_content")
      .select("display_title_uk,title_uk,subtitle_uk,qa_status_uk,qa_reason_uk")
      .eq("source", t.source)
      .eq("offer_id", t.id)
      .maybeSingle();

    const display = data?.display_title_uk ?? "";
    const brandPart = display.split(/\s+[—–-]\s+/u)[0]?.trim() ?? display;
    const ok = brandPart.toUpperCase().includes(t.expectedBrand.replace(/\+$/, "").toUpperCase());
    console.log(`display_title_uk: ${display}`);
    console.log(`meta_title_uk: ${data?.title_uk ?? ""}`);
    console.log(`subtitle_uk: ${data?.subtitle_uk ?? ""}`);
    console.log(`qa: ${data?.qa_status_uk} | ${data?.qa_reason_uk ?? ""}`);
    console.log(`brand check: ${ok ? "OK" : "FAIL"} (got «${brandPart}»)\n`);
    if (!ok) failed += 1;
  } catch (err) {
    console.error(`ERROR: ${err instanceof Error ? err.message : err}\n`);
    failed += 1;
  }
}

if (failed) process.exit(1);
console.log("All brand checks passed.");
