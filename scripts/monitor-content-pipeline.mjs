import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const env = {};
const envPath = resolve(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
  }
}

const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7) ??
  process.env.RO_SYNC_BASE ??
  env.RO_SYNC_BASE ??
  env.CZ_WORKERS_DEV_BASE ??
  "https://recenze-ceny.cz";
const secret = process.env.HOOK_SECRET ?? env.HOOK_SECRET;
const maxMissingContent = Number(
  process.argv.find((a) => a.startsWith("--max-missing-content="))?.slice(22) ??
    process.env.MAX_MISSING_CONTENT ??
    "0",
);
/** Max excess above MAX that self-heal will try to clear with one content-drain. */
const selfHealSlack = Number(
  process.argv.find((a) => a.startsWith("--self-heal-slack="))?.slice(18) ??
    process.env.SELF_HEAL_SLACK ??
    "3",
);

if (!secret) {
  console.error("HOOK_SECRET missing in environment or .env");
  process.exit(1);
}

const triggerDrain = process.argv.includes("--trigger-drain");
const selfHealDrain = process.argv.includes("--self-heal-drain");

function fetchJson(path) {
  const url = `${base}${path}?secret=${encodeURIComponent(secret)}`;
  const res = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `const res = await fetch(${JSON.stringify(url)}, { signal: AbortSignal.timeout(320000) });
const text = await res.text();
console.log(JSON.stringify({ status: res.status, body: text }));`,
    ],
    { encoding: "utf8" },
  );
  if (res.status !== 0) {
    throw new Error(res.stderr || res.stdout || `Fetch failed for ${path}`);
  }
  const payload = JSON.parse(res.stdout.trim());
  const body = JSON.parse(payload.body);
  return { status: payload.status, body };
}

function logStatus(label, statusRes) {
  const totals = statusRes.body?.totals ?? {};
  const ops = statusRes.body?.ops ?? {};
  const missingContent = Number(totals.missing_content ?? 0);
  const staleContent = Number(ops.stale_content ?? totals.stale_content ?? 0);
  const alerts = Array.isArray(statusRes.body?.alerts) ? statusRes.body.alerts : [];
  console.log(`${label}pipeline-status=${statusRes.status}`);
  console.log(`missing_content=${missingContent}`);
  console.log(`stale_content=${staleContent}`);
  console.log(`max_missing_content=${maxMissingContent}`);
  if (alerts.length) {
    console.log(`alerts=${alerts.join(" | ")}`);
  }
  return { missingContent, staleContent, alerts };
}

let statusRes = fetchJson("/api/public/hooks/pipeline-status");
let { missingContent, staleContent } = logStatus("", statusRes);

const shouldForceDrain = triggerDrain && missingContent > 0;
const healCeiling = maxMissingContent + Math.max(0, selfHealSlack);
const shouldSelfHeal =
  selfHealDrain &&
  missingContent > maxMissingContent &&
  missingContent <= healCeiling &&
  staleContent === 0;

if (shouldForceDrain || shouldSelfHeal) {
  console.log(
    shouldSelfHeal
      ? `self-heal: missing=${missingContent} > max=${maxMissingContent} (≤${healCeiling}, stale=0) → content-drain once`
      : "triggering content-drain...",
  );
  const drainRes = fetchJson("/api/public/hooks/content-drain");
  console.log(`content-drain=${drainRes.status}`);
  console.log(JSON.stringify(drainRes.body, null, 2));
  statusRes = fetchJson("/api/public/hooks/pipeline-status");
  ({ missingContent, staleContent } = logStatus("post-drain ", statusRes));
}

if (missingContent > maxMissingContent) {
  process.exit(1);
}
