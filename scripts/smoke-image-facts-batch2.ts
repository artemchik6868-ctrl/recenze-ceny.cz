/**
 * Second multi-source image-facts smoke batch (fresh SKUs).
 *
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/smoke-image-facts-batch2.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
process.env.IMAGE_FACTS_SMOKE = "1";

const BATCH: Array<{ source: string; offerId: number; expectHint: string }> = [
  // shakes
  { source: "shakes", offerId: 15648, expectHint: "Removio-like / papilloma gel if image matches" },
  { source: "shakes", offerId: 14943, expectHint: "Pulsero device/other or supplement" },
  { source: "shakes", offerId: 4201, expectHint: "known landing-facts SKU" },
  // cpa_tl
  { source: "cpa_tl", offerId: 23352, expectHint: "My Hero capsules oral" },
  { source: "cpa_tl", offerId: 21433, expectHint: "KETO capsules oral" },
  { source: "cpa_tl", offerId: 17811, expectHint: "Laser Light device/electronics" },
  // m1_top
  { source: "m1_top", offerId: 3639, expectHint: "Flexosamine gel topical" },
  { source: "m1_top", offerId: 5149, expectHint: "Formelan gel topical" },
  { source: "m1_top", offerId: 4823, expectHint: "Cardiotensive tablets oral" },
  { source: "m1_top", offerId: 7095, expectHint: "HELMIRON capsules oral" },
  // kma
  { source: "kma", offerId: 7306, expectHint: "Hondrofrost gel topical" },
  { source: "kma", offerId: 9225, expectHint: "Bullrun capsules oral" },
  { source: "kma", offerId: 7865, expectHint: "Cardiotensive tablets oral" },
  // adcombo
  { source: "adcombo", offerId: 40695, expectHint: "Revinelle tube cream topical" },
  { source: "adcombo", offerId: 40600, expectHint: "CardioViva jar oral" },
  { source: "adcombo", offerId: 39220, expectHint: "Tvidler device/other" },
];

const { extractAndStoreImageFacts } = await import(
  pathToFileURL(resolve(root, "src/lib/image-facts.server.ts")).href
);

const results = [];
let ok = 0;
let paid = 0;
let totalTokens = 0;
const mismatches: string[] = [];

for (const item of BATCH) {
  console.error(`\n=== ${item.source}:${item.offerId} (${item.expectHint}) ===`);
  try {
    const row = await extractAndStoreImageFacts({
      source: item.source as "shakes",
      offerId: item.offerId,
      writeDb: true,
      smoke: true,
    });
    totalTokens += row.usage?.total_tokens ?? 0;
    if (row.method === "paid") paid += 1;
    if (row.status === "ok") ok += 1;
    const f = row.facts;
    const line = `${item.source}:${item.offerId} → ${row.status} | ${f?.productType ?? "-"} | ${f?.application ?? "-"} | ${f?.releaseForm ?? "-"} | ${f?.packaging ?? "-"}`;
    console.error(line);
    if (f?.detectedText) console.error(`  text: ${String(f.detectedText).slice(0, 100)}`);
    if (f?.briefDescription) console.error(`  desc: ${f.briefDescription}`);
    if (row.error) console.error(`  err: ${row.error}`);

    // Soft sanity flags (not hard fail)
    const hint = item.expectHint.toLowerCase();
    if (row.status === "ok" && f) {
      if (hint.includes("gel") && f.releaseForm !== "gel" && f.application === "oral") {
        mismatches.push(`${item.source}:${item.offerId} expected gel topical-ish, got ${f.releaseForm}/${f.application}/${f.productType}`);
      }
      if (hint.includes("capsules") && f.releaseForm && !["kapsle", "tablety"].includes(f.releaseForm) && f.productType === "lokální přípravek") {
        mismatches.push(`${item.source}:${item.offerId} expected oral caps, got ${f.releaseForm}/${f.productType}`);
      }
      if ("primaryColor" in (f as object)) {
        mismatches.push(`${item.source}:${item.offerId} still has primaryColor`);
      }
    }

    results.push({
      ...item,
      status: row.status,
      method: row.method,
      facts: row.facts,
      error: row.error ?? null,
      timing: row.timing,
      usage: row.usage ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    results.push({ ...item, status: "error", error: message });
    console.error(`FAILED: ${message}`);
  }
}

mkdirSync(resolve(root, "scripts/out"), { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = resolve(root, `scripts/out/smoke-image-facts-batch2-${stamp}.json`);
const payload = {
  ok,
  total: BATCH.length,
  paidCalls: paid,
  totalTokens,
  estUsdPaid: 0,
  softMismatches: mismatches,
  results,
};
writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
console.log(JSON.stringify(payload, null, 2));
console.error(`\nWrote ${outPath}`);
console.error(`Summary: ${ok}/${BATCH.length} ok, paid=${paid}, tokens=${totalTokens}, softMismatches=${mismatches.length}`);
for (const m of mismatches) console.error(`  ! ${m}`);
