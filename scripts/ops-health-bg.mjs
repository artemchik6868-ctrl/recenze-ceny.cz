/**
 * Usage: npm run ops:health
 */
import { execSync, spawnSync } from "node:child_process";
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
  ["audit", "npm run audit:product-content-cz"],
  ["sitemap", "node scripts/check-sitemap-health.mjs"],
  ["seo", "node scripts/seo-preflight.mjs"],
  ["smoke", "npm run smoke:cz -- --base=https://recenze-ceny.cz"],
  ["secrets", "npm run verify:secrets"],
  ["cron", "node scripts/verify-cron-schedules.mjs"],
]) {
  process.stdout.write(`${name}... `);
  const r = run(cmd);
  console.log(r.ok ? "OK" : `FAIL (${r.status})`);
  steps.push({ name, ok: r.ok, status: r.status, tail: r.out.split("\n").slice(-5).join("\n") });
  if (!r.ok) failed += 1;
}

  cron: ["0 2 * * * sync-daily", "*/30 * * * * content-drain"],
  monitorCommands: [
    "npm run ops:health",
    "npm run status:pipeline",
    "npm run audit:product-content-cz",
    "node scripts/monitor-content-pipeline.mjs --max-missing-content=2",
  ],
  burstCommands: [
    "npm run sync:drain",
    "npm run generate:local -- --task=ai --only-missing=true",
    "npm run sync:daily",
  ],
};

const outPath = resolve(cacheDir, "ops-health-bg.json");
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
console.log(`\nWrote ${outPath}`);
console.log(`\nops-health-bg: ${failed === 0 ? "OK" : `FAIL (${failed} step(s))`}`);
process.exit(failed > 0 ? 1 : 0);
