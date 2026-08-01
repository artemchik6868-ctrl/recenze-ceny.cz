/**
 * Multi-source image-facts smoke batch (Phase 1 expanded).
 *
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/smoke-image-facts-batch.ts
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

/** Diverse forms / niches / networks — skip already-tested 12197/12619/11937. */
const BATCH: Array<{ source: string; offerId: number; expectHint: string }> = [
  { source: "shakes", offerId: 14771, expectHint: "Hondroine gel topical" },
  { source: "shakes", offerId: 12905, expectHint: "ABSlim drops oral" },
  { source: "shakes", offerId: 14211, expectHint: "Cordyceps capsules oral" },
  { source: "cpa_tl", offerId: 19175, expectHint: "Hondrofrost gel topical" },
  { source: "cpa_tl", offerId: 21180, expectHint: "ArtiZynt capsules oral" },
  { source: "cpa_tl", offerId: 2685, expectHint: "Dial Vision glasses other" },
  { source: "m1_top", offerId: 5486, expectHint: "ArtiZynt gel topical" },
  { source: "m1_top", offerId: 3261, expectHint: "IdealFit drops oral" },
  { source: "m1_top", offerId: 3896, expectHint: "Elesse cream topical/cosmetic" },
  { source: "kma", offerId: 9021, expectHint: "Removio gel topical" },
  { source: "kma", offerId: 9215, expectHint: "Hairstim spray topical" },
  { source: "kma", offerId: 9010, expectHint: "Fortolex cream topical" },
];

const { extractAndStoreImageFacts } = await import(
  pathToFileURL(resolve(root, "src/lib/image-facts.server.ts")).href
);

const results = [];
let ok = 0;
let paid = 0;
let totalTokens = 0;

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
    const summary = {
      ...item,
      status: row.status,
      method: row.method,
      facts: row.facts,
      error: row.error ?? null,
      timing: row.timing,
      usage: row.usage ?? null,
    };
    results.push(summary);
    console.error(
      `status=${row.status} method=${row.method} type=${row.facts?.productType} app=${row.facts?.application} form=${row.facts?.releaseForm} pack=${row.facts?.packaging}`,
    );
    if (row.facts?.detectedText) console.error(`  text: ${row.facts.detectedText}`);
    if (row.facts?.briefDescription) console.error(`  desc: ${row.facts.briefDescription}`);
    if (row.error) console.error(`  err: ${row.error}`);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    results.push({ ...item, status: "error", error: message });
    console.error(`FAILED: ${message}`);
  }
}

mkdirSync(resolve(root, "scripts/out"), { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = resolve(root, `scripts/out/smoke-image-facts-batch-${stamp}.json`);
const payload = {
  ok,
  total: BATCH.length,
  paidCalls: paid,
  totalTokens,
  estUsdPaid: 0,
  results,
};
writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
console.log(JSON.stringify(payload, null, 2));
console.error(`\nWrote ${outPath}`);
console.error(`Summary: ${ok}/${BATCH.length} ok, paid=${paid}, tokens=${totalTokens}`);
