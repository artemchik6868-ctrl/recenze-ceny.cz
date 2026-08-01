/**
 * CH ops health check — pipeline, content audit, smoke, secrets, cron, TerraLeads probe.
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

process.stdout.write("terraleads-api... ");
const tl = run("node scripts/terraleads-test-api.mjs offer");
const tlBlocked = tl.out.includes("403");
console.log(tlBlocked ? "BLOCKED (403 offer/list)" : tl.ok ? "OK" : "FAIL");
steps.push({
  name: "terraleads-api",
  ok: tl.ok,
  blocked: tlBlocked,
  action: tlBlocked
    ? "Ask TerraLeads manager to enable Offer API for user_id, then: npm run sync:terraleads"
    : null,
  tail: tl.out.split("\n").slice(-4).join("\n"),
});

const report = {
  checkedAt: new Date().toISOString(),
  steps,
  autonomousReady: failed === 0,
  blockers: tlBlocked ? ["terraleads: offer/list 403 — catalog API disabled"] : [],
  cron: ["0 2 * * * sync-daily", "*/30 * * * * content-drain"],
  monitorCommands: [
    "npm run ops:health",
    "npm run status:pipeline",
    "npm run audit:product-content-cz",
  ],
  burstCommands: [
    "npm run ops:burst-drain",
    "npm run generate:local -- --task=ai --only-missing=true",
    "npm run sync:drain",
  ],
};

const outPath = resolve(cacheDir, "ops-health-ch.json");
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
console.log(`\nWrote ${outPath}`);
console.log(`\nops-health-ch: ${failed === 0 ? "OK" : `FAIL (${failed} step(s))`}`);
if (tlBlocked) console.log("TerraLeads: enable Offer API with manager — ip/get works, offer/list 403");
process.exit(failed > 0 ? 1 : 0);
