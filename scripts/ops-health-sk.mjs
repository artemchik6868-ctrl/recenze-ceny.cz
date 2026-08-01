/**
 * SK ops health check — pipeline, content audit, smoke, secrets, cron.
 * Usage: npm run ops:health
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = resolve(root, "scripts", ".cache");
mkdirSync(cacheDir, { recursive: true });

function run(cmd, args = []) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: "utf8", shell: true });
  const out = (r.stdout || "") + (r.stderr || "");
  return { ok: r.status === 0, status: r.status ?? 1, out: out.trim() };
}

const steps = [];
let failed = 0;

for (const [name, cmd] of [
  ["pipeline", "npm run status:pipeline"],
  ["audit", "npm run audit:product-content-sk"],
  ["sitemap", "node scripts/check-sitemap-health.mjs"],
  ["seo", "node scripts/seo-preflight.mjs"],
  ["smoke", "npm run smoke:sk -- --base=https://skrecenzie.sk"],
  ["secrets", "npm run verify:secrets"],
  ["cron", "node scripts/verify-cron-schedules.mjs"],
]) {
  process.stdout.write(`${name}... `);
  const r = run(cmd);
  console.log(r.ok ? "OK" : `FAIL (${r.status})`);
  steps.push({ name, ok: r.ok, status: r.status, tail: r.out.split("\n").slice(-5).join("\n") });
  if (!r.ok) failed += 1;
}

writeFileSync(resolve(cacheDir, "ops-health-sk.json"), JSON.stringify({ at: new Date().toISOString(), failed, steps }, null, 2));

if (failed) {
  console.log(`\nops-health-sk: ${failed} step(s) failed`);
  process.exit(1);
}
console.log("\nops-health-sk: OK");
