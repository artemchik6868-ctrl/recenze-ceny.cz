/**
 * Local smoke: vision image-facts for a few offers.
 *
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/smoke-image-facts.ts
 *   ... -- --source=shakes --ids=12197,12619 --write-db
 *   ... -- --source=cpa_tl --limit=3
 *
 * Sets IMAGE_FACTS_SMOKE=1 so mass IMAGE_FACTS_ENABLED can stay off.
 *
 * Rollout checklist (Phase 1–3):
 * - Errors: fetch_error / gateway / parse rates; circuit breaker trips
 * - Stability: % ok vs thin/exhausted; spot-check 10–20 facts JSON
 * - Load: ms/offer (preflight + llm); Worker timeouts on Phase 2
 * - Cost: method=free|paid, usage tokens; compare image_facts_daily_budget vs OpenRouter dashboard
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  // Keep process env overrides (e.g. IMAGE_FACTS_MAX_LLM_PER_DAY=200 for local drain).
  if (process.env[key] !== undefined && process.env[key] !== "") continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[key] = v;
}

process.env.IMAGE_FACTS_SMOKE = "1";

function arg(name: string): string | null {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

const source = (arg("source") || "shakes").trim().toLowerCase();
const idsRaw = arg("ids");
const limit = Number(arg("limit") || "5");
const writeDb = hasFlag("write-db");
const force = hasFlag("force");

const DEFAULT_IDS: Record<string, number[]> = {
  shakes: [12197, 12619, 11937],
  cpa_tl: [9177, 22853, 17811],
  m1_top: [],
  kma: [],
  cpagetti: [],
  adcombo: [],
};

const ids = idsRaw
  ? idsRaw
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
  : (DEFAULT_IDS[source] ?? []).slice(0, Number.isFinite(limit) ? limit : 5);

if (!ids.length) {
  console.error(
    `No offer ids. Pass --ids=1,2,3 or add defaults for source=${source}.`,
  );
  process.exit(1);
}

const { extractAndStoreImageFacts } = await import(
  pathToFileURL(resolve(root, "src/lib/image-facts.server.ts")).href
);
const { imageFactsHaveContent } = await import(
  pathToFileURL(resolve(root, "src/lib/image-facts.ts")).href
);

/** Gemini 2.5 Flash list prices (USD / token) for paid-fallback estimate only. */
const FLASH_IN = 0.3 / 1_000_000;
const FLASH_OUT = 2.5 / 1_000_000;

const results = [];
let totalTokens = 0;
let estUsdPaid = 0;

for (const offerId of ids.slice(0, Math.max(1, limit))) {
  console.error(`\n=== image-facts ${source}:${offerId} writeDb=${writeDb} force=${force} ===`);
  const row = await extractAndStoreImageFacts({
    source: source as "shakes",
    offerId,
    writeDb,
    smoke: true,
    force,
  });
  const tokens = row.usage?.total_tokens ?? 0;
  totalTokens += tokens;
  const paidCost =
    row.method === "paid"
      ? (row.usage?.prompt_tokens ?? 0) * FLASH_IN +
        (row.usage?.completion_tokens ?? 0) * FLASH_OUT
      : 0;
  estUsdPaid += paidCost;
  const summary = {
    source,
    offerId,
    status: row.status,
    method: row.method,
    model: row.model ?? null,
    generationId: row.generationId ?? null,
    imageUrl: row.imageUrl,
    imageHash: row.imageHash,
    jsonChars: row.jsonChars,
    llmAttempts: row.llmAttempts,
    timing: row.timing,
    usage: row.usage ?? null,
    estUsdPaid: Number(paidCost.toFixed(6)),
    hasContent: imageFactsHaveContent(row.facts),
    facts: row.facts,
    promptBlock: row.promptBlock,
    error: row.error ?? null,
    wroteDb: row.wroteDb,
  };
  results.push(summary);
  console.error(
    `status=${row.status} method=${row.method} model=${row.model ?? "-"} gen=${row.generationId ?? "-"} tokens=${tokens} preflightMs=${row.timing.preflightMs} llmMs=${row.timing.llmMs} err=${row.error ?? "-"}`,
  );
  if (row.facts) {
    console.error(
      `  type=${row.facts.productType} form=${row.facts.releaseForm} pack=${row.facts.packaging}`,
    );
  }
}

mkdirSync(resolve(root, "scripts/out"), { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = resolve(root, `scripts/out/smoke-image-facts-${source}-${stamp}.json`);
const payload = {
  source,
  writeDb,
  totalTokens,
  estUsdPaid: Number(estUsdPaid.toFixed(6)),
  results,
};
writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
console.log(JSON.stringify(payload, null, 2));
console.error(`\nWrote ${outPath}`);
