/**
 * Ensure Workers Logs observability survives Nitro's .output/server/wrangler.json.
 * Usage: node scripts/ensure-wrangler-observability.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = resolve(root, ".output", "server", "wrangler.json");

const OBSERVABILITY = {
  enabled: true,
  head_sampling_rate: 0.05,
};

if (!existsSync(outPath)) {
  console.warn("ensure-wrangler-observability: no .output/server/wrangler.json yet (run build first)");
  process.exit(0);
}

const cfg = JSON.parse(readFileSync(outPath, "utf8"));
const prev = JSON.stringify(cfg.observability ?? null);
cfg.observability = OBSERVABILITY;
writeFileSync(outPath, `${JSON.stringify(cfg, null, 2)}\n`);
console.log(
  `ensure-wrangler-observability: observability ${prev} → ${JSON.stringify(OBSERVABILITY)}`,
);
