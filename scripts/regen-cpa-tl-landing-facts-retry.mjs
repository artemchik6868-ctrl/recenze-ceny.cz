/**
 * Retry specific CPA.tl offer IDs via local forceRegen (landing inject on).
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/regen-cpa-tl-landing-facts-retry.mjs
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

const IDS = process.argv.slice(2).map(Number).filter((n) => n > 0);
if (!IDS.length) {
  console.error("Usage: ... regen-cpa-tl-landing-facts-retry.mjs <id> [id...]");
  process.exit(1);
}

const { getOrGenerateProductContentDetailed } = await import(
  "../src/lib/ai-content.server.ts"
);

const results = [];
for (const offerId of IDS) {
  const started = Date.now();
  console.error(`\n=== retry cpa_tl:${offerId} ===`);
  let row = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const generated = await getOrGenerateProductContentDetailed(
        "cpa_tl",
        offerId,
        "uk",
        "other",
        { forceRegen: true },
      );
      const html = generated.content?.description_html ?? "";
      row = {
        offerId,
        ok: generated.status === "generated" || generated.status === "cache_hit",
        status: generated.status,
        error: generated.error ?? null,
        displayTitle: generated.content?.display_title ?? null,
        htmlLen: html.length,
        hasSlozeni: /složen/i.test(html),
        elapsed_ms: Date.now() - started,
      };
      console.error(
        `attempt=${attempt} ok=${row.ok} status=${row.status} hasSlozeni=${row.hasSlozeni} ms=${row.elapsed_ms}`,
      );
      if (row.ok) break;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`attempt=${attempt} FAIL: ${message}`);
      row = { offerId, ok: false, error: message, elapsed_ms: Date.now() - started };
      await new Promise((r) => setTimeout(r, 20_000 * attempt));
    }
  }
  results.push(row);
  await new Promise((r) => setTimeout(r, 5000));
}

mkdirSync(resolve(root, "scripts/out"), { recursive: true });
const outPath = resolve(root, "scripts/out/regen-cpa-tl-landing-facts-retry.json");
writeFileSync(outPath, JSON.stringify({ results }, null, 2), "utf8");
console.log(JSON.stringify({ results }, null, 2));
console.error(`Wrote ${outPath}`);
