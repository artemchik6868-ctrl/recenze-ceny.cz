/**
 * Disabled: seeding pipeline_feed_wave against prod .env restarts Worker feed paging.
 * CPA ingest is GitHub Action feed-sync.yml (`npm run sync:feeds`).
 *
 * Override (dev DB only): FEED_WAVE_SMOKE=1 npx tsx scripts/smoke-feed-wave.mjs
 */
if (process.env.FEED_WAVE_SMOKE !== "1") {
  console.error(
    "smoke-feed-wave is disabled: it seeds pipeline_feed_wave (can hit prod if .env points there).\n" +
      "Ingest: npm run sync:feeds  (GitHub Action).\n" +
      "Force anyway: FEED_WAVE_SMOKE=1",
  );
  process.exit(1);
}

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  if (process.env[key] === undefined) {
    process.env[key] = m[2].trim().replace(/^"|"$/g, "");
  }
}

const {
  ensureWave,
  drainNextFeedUnit,
  getFeedWaveStatus,
} = await import("../src/lib/feed-sync-wave.server.ts");

const before = await getFeedWaveStatus();
console.log("before", JSON.stringify(before, null, 2));

const seeded = await ensureWave({ force: true });
console.log("seeded", seeded.wave_id, "pending", seeded.pending.length);

const started = Date.now();
const unit = await drainNextFeedUnit();
console.log(
  "unit",
  JSON.stringify(
    {
      ok: unit.ok,
      source: unit.source,
      done: unit.done,
      waveDone: unit.waveDone,
      error: unit.error,
      elapsed_ms: Date.now() - started,
      stats: unit.stats,
      pending: unit.pending,
    },
    null,
    2,
  ),
);

const after = await getFeedWaveStatus();
console.log("after", JSON.stringify(after, null, 2));
