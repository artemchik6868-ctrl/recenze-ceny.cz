import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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

const triggerDrain = process.argv.includes("--trigger-drain");
const selfHealDrain = process.argv.includes("--self-heal-drain");

/** Offers drain can actually generate — warehouse facts-blocked stock is not actionable. */
export function missingActionableCount(missingContent, factsPending) {
  return Math.max(0, Number(missingContent || 0) - Number(factsPending || 0));
}

export function shouldSelfHealBacklog({
  missingActionable,
  maxMissingContent,
  selfHealSlack,
  selfHealDrain,
}) {
  const healCeiling = maxMissingContent + Math.max(0, selfHealSlack);
  return (
    selfHealDrain &&
    missingActionable > maxMissingContent &&
    missingActionable <= healCeiling
  );
}

export function shouldFailPipelineHealth({ missingActionable, maxMissingContent }) {
  return missingActionable > maxMissingContent;
}

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
  const factsPending = Number(totals.facts_pending ?? 0);
  const missingActionable =
    totals.missing_actionable != null
      ? Number(totals.missing_actionable)
      : missingActionableCount(missingContent, factsPending);
  const staleContent = Number(ops.stale_content ?? totals.stale_content ?? 0);
  const alerts = Array.isArray(statusRes.body?.alerts) ? statusRes.body.alerts : [];
  console.log(`${label}pipeline-status=${statusRes.status}`);
  console.log(`missing_content=${missingContent}`);
  console.log(`facts_pending=${factsPending}`);
  console.log(`missing_actionable=${missingActionable}`);
  console.log(`stale_content=${staleContent}`);
  console.log(`max_missing_content=${maxMissingContent}`);
  if (alerts.length) {
    console.log(`alerts=${alerts.join(" | ")}`);
  }
  return { missingContent, factsPending, missingActionable, staleContent, alerts };
}

function main() {
  if (!secret) {
    console.error("HOOK_SECRET missing in environment or .env");
    process.exit(1);
  }

  let statusRes = fetchJson("/api/public/hooks/pipeline-status");
  let { missingActionable, staleContent } = logStatus("", statusRes);

  const shouldForceDrain = triggerDrain && missingActionable > 0;
  const healCeiling = maxMissingContent + Math.max(0, selfHealSlack);
  const shouldSelfHeal = shouldSelfHealBacklog({
    missingActionable,
    maxMissingContent,
    selfHealSlack,
    selfHealDrain,
  });

  if (shouldForceDrain || shouldSelfHeal) {
    console.log(
      shouldSelfHeal
        ? `self-heal: missing_actionable=${missingActionable} > max=${maxMissingContent} (≤${healCeiling}, stale=${staleContent}) → content-drain once`
        : "triggering content-drain...",
    );
    const drainRes = fetchJson("/api/public/hooks/content-drain");
    console.log(`content-drain=${drainRes.status}`);
    console.log(JSON.stringify(drainRes.body, null, 2));
    statusRes = fetchJson("/api/public/hooks/pipeline-status");
    ({ missingActionable, staleContent } = logStatus("post-drain ", statusRes));
  }

  if (shouldFailPipelineHealth({ missingActionable, maxMissingContent })) {
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
