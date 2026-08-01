/**
 * Resume partial backfill: kma AI content only.
 */
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const runner = resolve(__dirname, "run-backfill.mjs");

function run(args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [runner, ...args], { stdio: "inherit" });
    child.on("close", (code) => (code === 0 ? resolvePromise() : reject(new Error(`exit ${code}`))));
  });
}

console.log(">>> kma (task=ai)");
await run(["--source=kma", "--task=ai", "--ai-limit=4", "--max-rounds=15"]);

console.log("\n=== Final status ===");
await new Promise((resolvePromise, reject) => {
  const child = spawn(process.execPath, [resolve(__dirname, "backfill-status.mjs")], { stdio: "inherit" });
  child.on("close", (code) => (code === 0 ? resolvePromise() : reject(new Error(`status exit ${code}`))));
});
