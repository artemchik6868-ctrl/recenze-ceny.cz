/** Local smoke: seed feed wave + drain one unit. Usage: npx tsx scripts/smoke-feed-wave.mjs */
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

if (!unit.ok) process.exit(1);
if (unit.source !== "cpa_tl") {
  console.warn("expected first source cpa_tl, got", unit.source);
}
if (after.pending.length !== 6) {
  console.warn("expected 6 pending after first unit, got", after.pending.length);
}
