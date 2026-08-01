/**
 * Seed shakes_landing_facts for a few offers (LLM extract + upsert).
 *
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/seed-landing-facts.ts
 */
import { readFileSync } from "node:fs";
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

const IDS = process.argv.slice(2).map(Number).filter((n) => n > 0);
const offerIds = IDS.length ? IDS : [14771, 15648, 17620];

const { extractAndStoreShakesLandingFacts } = await import(
  pathToFileURL(resolve(root, "src/lib/landing-facts.server.ts")).href
);

for (const id of offerIds) {
  console.error(`\n=== extract+store ${id} ===`);
  const r = await extractAndStoreShakesLandingFacts(id);
  console.error(
    `status=${r.status} lang=${r.langHint} json=${r.jsonChars} injectable=${!!r.promptBlock} err=${r.error ?? "-"}`,
  );
}
