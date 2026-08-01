/**
 * Backfill AI content for all sources, one source at a time.
 * For bulk without Worker limits use: npm run generate:local
 * Usage: node scripts/run-all-backfill.mjs
 */
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const runner = resolve(__dirname, "run-backfill.mjs");

function run(args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [runner, ...args], { stdio: "inherit" });
    child.on("close", (code) => (code === 0 ? resolvePromise() : reject(new Error(`exit ${code}: ${args.join(" ")}`))));
  });
}

const SOURCES = ["m1_top", "cpa_tl", "kma"];

console.log("=== AI content backfill ===");
for (const source of SOURCES) {
  console.log(`\n>>> ${source} (task=ai)`);
  await run([`--source=${source}`, "--task=ai", "--ai-limit=4", "--max-rounds=40"]);
}

console.log("\n=== Final status ===");
await new Promise((resolvePromise, reject) => {
  const child = spawn(process.execPath, [resolve(__dirname, "backfill-status.mjs")], { stdio: "inherit" });
  child.on("close", (code) => (code === 0 ? resolvePromise() : reject(new Error(`status exit ${code}`))));
});
