/**
 * Local smoke: live landing facts + force AI generate for 3 Shakes offers.
 * Same code path as Worker hook (LANDING_FACTS_LIVE=1).
 *
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/smoke-landing-facts-generate.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

process.env.LANDING_FACTS_LIVE = "1";

const IDS = [5911, 22128, 6247]; // Removio, Benaga, W-Loss CZ adaptive

const { loadLiveShakesLandingFacts } = await import("../src/lib/landing-facts.server.ts");
const { getOrGenerateProductContentDetailed } = await import("../src/lib/ai-content.server.ts");

const results = [];
for (const offerId of IDS) {
  const started = Date.now();
  console.error(`\n=== smoke shakes:${offerId} ===`);
  try {
    const landing = await loadLiveShakesLandingFacts(offerId);
    console.error(
      `landing status=${landing.status} lang=${landing.langHint} fetchMs=${landing.timing.fetchMs} json=${landing.jsonChars}`,
    );
    const genStarted = Date.now();
    const generated = await getOrGenerateProductContentDetailed("shakes", offerId, "uk", "other", {
      forceRegen: true,
    });
    const genMs = Date.now() - genStarted;
    const html = generated.content?.description_html ?? "";
    const row = {
      offerId,
      ok: generated.status === "generated",
      elapsed_ms: Date.now() - started,
      landing: {
        status: landing.status,
        langHint: landing.langHint,
        sourceUrl: landing.sourceUrl,
        jsonChars: landing.jsonChars,
        fullTextChars: landing.fullTextChars,
        facts: landing.facts,
        timing: landing.timing,
        error: landing.error ?? null,
        promptBlock: landing.promptBlock,
      },
      generate: {
        status: generated.status,
        error: generated.error ?? null,
        genMs,
        tokens: generated.metrics?.totalTokens ?? null,
        displayTitle: generated.content?.display_title ?? null,
        htmlLen: html.length,
        hasSlozeni: /složen/i.test(html),
        hasFormHint: /gel|kapsle|kapky|krém/i.test(html),
        htmlPreview: html.slice(0, 400),
      },
    };
    results.push(row);
    console.error(
      `generate status=${row.generate.status} genMs=${genMs} totalMs=${row.elapsed_ms} htmlLen=${row.generate.htmlLen}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({ offerId, ok: false, error: message, elapsed_ms: Date.now() - started });
    console.error(`FAILED ${offerId}:`, message);
  }
}

mkdirSync(resolve(root, "scripts/out"), { recursive: true });
const outPath = resolve(root, "scripts/out/smoke-landing-facts-generate.json");
writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
console.log(JSON.stringify(results, null, 2));
console.error(`\nWrote ${outPath}`);
