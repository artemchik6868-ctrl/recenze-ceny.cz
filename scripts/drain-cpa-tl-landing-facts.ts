/**
 * Drain cpa_tl_landing_facts until queue empty.
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/drain-cpa-tl-landing-facts.ts
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

const { drainCpaTlLandingFacts } = await import("../src/lib/landing-facts.server.ts");

let remaining = Infinity;
for (let i = 0; i < 16 && remaining > 0; i++) {
  const r = await drainCpaTlLandingFacts({ deadlineMs: 180_000, limit: 6 });
  remaining = r.remaining;
  console.error(
    `round ${i + 1}: processed=${r.processed} ok=${r.okCount} failed=${r.failed} remaining=${r.remaining} ms=${r.elapsed_ms}`,
  );
  if (r.processed === 0) break;
}
console.log(JSON.stringify({ remaining }));
