/**
 * Test: extended LLM landing facts + force PDP regen for 5 Shakes offers.
 *
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/smoke-landing-facts-llm-regen.ts
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

process.env.LANDING_FACTS_LLM = "1";
process.env.LANDING_FACTS_LIVE = "llm";

// Batch 2: Hondrofrost, ABSlim, W-Loss, Pulsero, Insuvit (excl. prior smoke IDs)
const IDS = [8889, 13133, 13141, 13521, 13763];

const { loadLiveShakesLandingFactsWithLlm } = await import(
  pathToFileURL(resolve(root, "src/lib/landing-facts.server.ts")).href
);
const { getOrGenerateProductContentDetailed } = await import(
  pathToFileURL(resolve(root, "src/lib/ai-content.server.ts")).href
);
const { findOfferById } = await import(
  pathToFileURL(resolve(root, "src/lib/offers.server.ts")).href
);

const results = [];

for (const offerId of IDS) {
  console.error(`\n=== LLM facts + regen shakes:${offerId} ===`);
  const started = Date.now();
  const landing = await loadLiveShakesLandingFactsWithLlm(offerId);
  console.error(
    `facts status=${landing.status} form=${landing.facts?.form} role=${landing.facts?.role} app=${landing.facts?.application} steps=${landing.facts?.usageSteps?.length ?? 0} ing=${landing.facts?.ingredients?.length ?? 0} tokens=${landing.usage?.total_tokens}`,
  );

  const genStarted = Date.now();
  const generated = await getOrGenerateProductContentDetailed("shakes", offerId, "uk", "other", {
    forceRegen: true,
  });
  const genMs = Date.now() - genStarted;
  const html = generated.content?.description_html ?? "";
  const offer = await findOfferById(offerId);

  const row = {
    offerId,
    title: offer?.title ?? null,
    url: offer?.slug ? `https://recenze-ceny.cz/product/${offer.slug}` : null,
    elapsed_ms: Date.now() - started,
    landing: {
      status: landing.status,
      sourceUrl: landing.sourceUrl,
      jsonChars: landing.jsonChars,
      usage: landing.usage ?? null,
      timing: landing.timing,
      facts: landing.facts,
      promptBlock: landing.promptBlock,
      error: landing.error ?? null,
    },
    generate: {
      status: generated.status,
      error: generated.error ?? null,
      genMs,
      tokens: generated.metrics?.totalTokens ?? null,
      displayTitle: generated.content?.display_title ?? null,
      htmlLen: html.length,
      hasSlozeni: /složen/i.test(html),
      hasNavod: /návod|použití/i.test(html),
      hasFormHint: /gel|kapsle|kapky|krém/i.test(html),
      htmlPreview: html.slice(0, 450),
    },
  };
  results.push(row);
  console.error(
    `generate ${row.generate.status} genMs=${genMs} totalMs=${row.elapsed_ms} slozeni=${row.generate.hasSlozeni} navod=${row.generate.hasNavod}`,
  );
}

mkdirSync(resolve(root, "scripts/out"), { recursive: true });
const outPath = resolve(root, "scripts/out/smoke-landing-facts-llm-regen-batch2.json");
writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
console.log(JSON.stringify(results, null, 2));
console.error(`\nWrote ${outPath}`);
