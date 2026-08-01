/** Drain remaining feed-wave units + check pipeline status + indexing dry_run. */
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

const { drainNextFeedUnit, getFeedWaveStatus } = await import(
  "../src/lib/feed-sync-wave.server.ts"
);
const { getPipelineStatus } = await import("../src/lib/pipeline-status.server.ts");
const { runIndexingRetry } = await import("../src/lib/indexing-retry.server.ts");

for (let i = 0; i < 20; i++) {
  const st = await getFeedWaveStatus();
  if (!st.active) {
    console.log(`wave idle after ${i} more units`);
    break;
  }
  const u = await drainNextFeedUnit();
  console.log(
    `drain ${i + 1} source=${u.source} ok=${u.ok} done=${u.done} waveDone=${u.waveDone} pending=${u.pending.length}${u.error ? ` error=${u.error}` : ""}`,
  );
  if (!u.ok) break;
}

const status = await getPipelineStatus();
console.log("pipeline feed_wave", JSON.stringify(status.feed_wave, null, 2));

console.log("indexing dry_run...");
const dry = await runIndexingRetry({ inspectLimit: 5, notifyLimit: 5, dryRun: true });
console.log("dry_run", JSON.stringify(dry, null, 2));

if (dry.inspected > 0 && dry.indexedFound === 0 && dry.notIndexed === 0 && dry.inspectErrors === 0) {
  console.error("FAIL: dry_run still looks fake (no indexed/notIndexed split)");
  process.exit(1);
}
console.log("OK");
