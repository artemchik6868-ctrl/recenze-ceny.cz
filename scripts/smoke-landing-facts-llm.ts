/**
 * Test: LLM extract landing facts for 5 Shakes offers (no PDP generate).
 *
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/smoke-landing-facts-llm.ts
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

const IDS = [12197, 12619, 11937, 4201, 12889];

const { loadLiveShakesLandingFactsWithLlm } = await import(
  pathToFileURL(resolve(root, "src/lib/landing-facts.server.ts")).href
);
const { landingFactsAreRich } = await import(
  pathToFileURL(resolve(root, "src/lib/landing-facts.ts")).href
);

const FLASH_IN = 0.3 / 1_000_000;
const FLASH_OUT = 2.5 / 1_000_000;

const results = [];
let totalTokens = 0;
let estUsd = 0;

for (const offerId of IDS) {
  console.error(`\n=== LLM extract shakes:${offerId} ===`);
  const row = await loadLiveShakesLandingFactsWithLlm(offerId);
  const tokens = row.usage?.total_tokens ?? 0;
  const cost =
    (row.usage?.prompt_tokens ?? 0) * FLASH_IN + (row.usage?.completion_tokens ?? 0) * FLASH_OUT;
  totalTokens += tokens;
  estUsd += cost;
  const summary = {
    offerId,
    status: row.status,
    sourceUrl: row.sourceUrl,
    langHint: row.langHint,
    fullTextChars: row.fullTextChars,
    jsonChars: row.jsonChars,
    extractMs: row.timing.extractMs,
    fetchMs: row.timing.fetchMs,
    totalMs: row.timing.totalMs,
    usage: row.usage ?? null,
    estUsdListGeminiFlash: Number(cost.toFixed(6)),
    rich: landingFactsAreRich(row.facts),
    llmFacts: row.facts,
    heuristicFacts: row.heuristicFacts,
    promptBlock: row.promptBlock,
    error: row.error ?? null,
  };
  results.push(summary);
  console.error(
    `status=${row.status} rich=${summary.rich} ingredients=${row.facts?.ingredients?.length ?? 0} benefits=${row.facts?.benefits?.length ?? 0} tokens=${tokens} ms=${row.timing.extractMs}`,
  );
}

mkdirSync(resolve(root, "scripts/out"), { recursive: true });
const outPath = resolve(root, "scripts/out/smoke-landing-facts-llm.json");
writeFileSync(
  outPath,
  JSON.stringify({ totalTokens, estUsdListGeminiFlash: Number(estUsd.toFixed(6)), results }, null, 2),
  "utf8",
);
console.log(JSON.stringify({ totalTokens, estUsdListGeminiFlash: Number(estUsd.toFixed(6)), results }, null, 2));
console.error(`\nWrote ${outPath}`);
