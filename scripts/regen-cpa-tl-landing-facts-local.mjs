/**
 * Local force-regen for all CPA.tl CZ-landing offers.
 * Uses prod inject path (CPA_TL_LANDING_FACTS_LIVE=llm) once per offer — no Worker 1102.
 *
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/regen-cpa-tl-landing-facts-local.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  process.env[m[1].trim()] = v;
}

process.env.CPA_TL_LANDING_FACTS_LIVE = "llm";
process.env.CPA_TL_LANDING_FACTS_LLM = "1";

const IDS = [
  2685, 8917, 9177, 9178, 9181, 10739, 13070, 13631, 17769, 17811, 17818, 18531,
  18532, 18677, 19114, 19175, 19495, 19809, 20980, 21110, 21180, 21417, 21743,
  22853, 23135, 23334, 23351, 23352, 23353, 23354, 23355, 23409, 23419, 23632,
  23680, 23980,
];

const { getOrGenerateProductContentDetailed } = await import(
  "../src/lib/ai-content.server.ts"
);

const results = [];
console.error(`Local regen: ${IDS.length} offers`);

for (let i = 0; i < IDS.length; i++) {
  const offerId = IDS[i];
  const started = Date.now();
  console.error(`\n=== ${i + 1}/${IDS.length} cpa_tl:${offerId} ===`);
  try {
    const generated = await getOrGenerateProductContentDetailed(
      "cpa_tl",
      offerId,
      "uk",
      "other",
      { forceRegen: true },
    );
    const html = generated.content?.description_html ?? "";
    const row = {
      offerId,
      ok: generated.status === "generated" || generated.status === "cache_hit",
      status: generated.status,
      saved: generated.saved,
      error: generated.error ?? null,
      displayTitle: generated.content?.display_title ?? null,
      htmlLen: html.length,
      hasSlozeni: /složen/i.test(html),
      hasNavod: /návod|použití/i.test(html),
      elapsed_ms: Date.now() - started,
      metrics: generated.metrics ?? null,
    };
    results.push(row);
    console.error(
      `ok=${row.ok} status=${row.status} hasSlozeni=${row.hasSlozeni} htmlLen=${row.htmlLen} ms=${row.elapsed_ms}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({ offerId, ok: false, error: message, elapsed_ms: Date.now() - started });
    console.error(`FAIL: ${message}`);
  }
  await new Promise((r) => setTimeout(r, 1500));
}

const ok = results.filter((r) => r.ok).length;
const withSlozeni = results.filter((r) => r.hasSlozeni).length;
const failed = results.filter((r) => !r.ok).map((r) => r.offerId);

mkdirSync(resolve(root, "scripts/out"), { recursive: true });
const outPath = resolve(root, "scripts/out/regen-cpa-tl-landing-facts-local.json");
writeFileSync(
  outPath,
  JSON.stringify({ ok, withSlozeni, total: results.length, failed, results }, null, 2),
  "utf8",
);
console.log(JSON.stringify({ ok, withSlozeni, total: results.length, failed }, null, 2));
console.error(`Wrote ${outPath}`);
