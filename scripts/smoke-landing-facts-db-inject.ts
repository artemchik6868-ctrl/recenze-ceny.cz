/**
 * Local verify: DB landing facts inject path (no live fetch).
 * Assumes facts already drained for IDS.
 *
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/smoke-landing-facts-db-inject.ts
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

// Ensure DB path (not live)
delete process.env.LANDING_FACTS_LIVE;
delete process.env.LANDING_FACTS_LLM;

const IDS = [14771, 15648, 17620]; // Hondroine, Removio, Balancio — rich landings from earlier smokes

const { getInjectableShakesLandingFacts, getShakesLandingFactsFromDb } = await import(
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
  const row = await getShakesLandingFactsFromDb(offerId);
  const inj = await getInjectableShakesLandingFacts(offerId);
  console.error(
    `\n=== DB inject ${offerId} status=${row?.status} inject=${!!inj.promptBlock} shelf=${inj.shelf} ===`,
  );
  const gen = await getOrGenerateProductContentDetailed("shakes", offerId, "uk", "other", {
    forceRegen: true,
  });
  const offer = await findOfferById(offerId);
  const html = gen.content?.description_html ?? "";
  results.push({
    offerId,
    slug: offer?.slug ?? null,
    url: offer?.slug ? `https://recenze-ceny.cz/product/${offer.slug}` : null,
    dbStatus: row?.status ?? null,
    injected: !!inj.promptBlock,
    shelf: inj.shelf,
    generate: gen.status,
    displayTitle: gen.content?.display_title ?? null,
    hasSlozeni: /složen/i.test(html),
    htmlPreview: html.slice(0, 280),
  });
  console.error(`generate=${gen.status} title=${gen.content?.display_title}`);
}

mkdirSync(resolve(root, "scripts/out"), { recursive: true });
const outPath = resolve(root, "scripts/out/smoke-landing-facts-db-inject.json");
writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
console.log(JSON.stringify(results, null, 2));
console.error(`Wrote ${outPath}`);
