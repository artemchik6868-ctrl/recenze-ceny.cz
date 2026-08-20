/**
 * Retires leftover pipeline_feed_wave only — does NOT ingest CPA feeds.
 * Daily ingest: health-check.yml job feed_sync. Manual: `npm run sync:feeds`.
 *
 * Usage: node scripts/trigger-sync-daily.mjs [--base=https://recenze-ceny.cz]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7) ??
  process.env.PL_SYNC_BASE ??
  process.env.CZ_WORKERS_DEV_BASE ??
  "https://recenze-ceny.cz";

const env = {};
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const secret = env.HOOK_SECRET;
if (!secret) {
  console.error("HOOK_SECRET missing in .env");
  process.exit(1);
}

const url = `${base}/api/public/hooks/sync-daily?secret=${encodeURIComponent(secret)}`;
console.log("Note: sync-daily does not ingest feeds (GHA does). This only retires leftover wave.");
console.log(`GET ${base}/api/public/hooks/sync-daily?secret=***`);
const started = Date.now();
const res = await fetch(url, { signal: AbortSignal.timeout(310_000) });
const text = await res.text();
console.log(`Status: ${res.status} (${Date.now() - started}ms)`);
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text.slice(0, 2000));
}
