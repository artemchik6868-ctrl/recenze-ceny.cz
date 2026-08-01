/**
 * Verify DB inject for one CPA.tl offer (no live flags).
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/verify-cpa-tl-landing-facts-db.ts
 */
import { readFileSync } from "node:fs";
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

delete process.env.CPA_TL_LANDING_FACTS_LIVE;
delete process.env.CPA_TL_LANDING_FACTS_LLM;

const offerId = Number(process.argv[2] || "21180");

const {
  getInjectableCpaTlLandingFacts,
  getCpaTlLandingFactsFromDb,
  getCpaTlLandingUrlHashForSourceHash,
} = await import("../src/lib/landing-facts.server.ts");
const { getOrGenerateProductContentDetailed } = await import("../src/lib/ai-content.server.ts");

const row = await getCpaTlLandingFactsFromDb(offerId);
const injectable = await getInjectableCpaTlLandingFacts(offerId);
const urlHash = await getCpaTlLandingUrlHashForSourceHash(offerId);

console.error(
  JSON.stringify(
    {
      offerId,
      dbStatus: row?.status ?? null,
      urlHash,
      hasPromptBlock: !!injectable.promptBlock,
      shelf: injectable.shelf,
      ingredients: injectable.facts?.ingredients?.length ?? 0,
    },
    null,
    2,
  ),
);

const generated = await getOrGenerateProductContentDetailed("cpa_tl", offerId, "uk", "other", {
  forceRegen: true,
});
const html = generated.content?.description_html ?? "";
console.log(
  JSON.stringify({
    ok: generated.status === "generated",
    status: generated.status,
    hasSlozeni: /složen/i.test(html),
    displayTitle: generated.content?.display_title ?? null,
    htmlLen: html.length,
  }),
);
