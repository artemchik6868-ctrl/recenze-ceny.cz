/**
 * Trigger GSC inspection + smart indexer retry for non-indexed URLs.
 * Requires HOOK_SECRET in .env (or --secret=...).
 *
 * Setup (one-time, same SA as Indexing API):
 *   1. GCP → enable "Google Search Console API" (searchconsole.googleapis.com)
 *   2. SA must be Owner in GSC for recenze-ceny.cz
 *   3. npm run db:migrate  (indexing_status table)
 *   4. Weekly sitemap resubmit: /api/public/hooks/submit-sitemap (Mon 07:00 UTC cron)
 *
 * Usage:
 *   node scripts/run-indexing-retry.mjs
 *   node scripts/run-indexing-retry.mjs --dry-run=1
 *   node scripts/run-indexing-retry.mjs --inspect-limit=50 --notify-limit=30
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7)?.replace(/\/$/, "") ||
  "https://recenze-ceny.cz";
const inspectLimit = process.argv.find((a) => a.startsWith("--inspect-limit="))?.slice(16) || "100";
const notifyLimit = process.argv.find((a) => a.startsWith("--notify-limit="))?.slice(15) || "50";
const dryRun = process.argv.some((a) => a === "--dry-run=1" || a === "--dry-run");

let secret = process.argv.find((a) => a.startsWith("--secret="))?.slice(9);
if (!secret) {
  try {
    for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
      const m = line.match(/^HOOK_SECRET=(.*)$/);
      if (m) secret = m[1].trim().replace(/^"|"$/g, "");
    }
  } catch {
    /* no .env */
  }
}
if (!secret) {
  console.error("Missing HOOK_SECRET — set in .env or pass --secret=...");
  process.exit(1);
}

const params = new URLSearchParams({
  inspect_limit: inspectLimit,
  notify_limit: notifyLimit,
});
if (dryRun) params.set("dry_run", "1");

const url = `${base}/api/public/hooks/indexing-retry?${params.toString()}`;
const res = await fetch(url, { headers: { Authorization: `Bearer ${secret}` } });
const json = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`FAIL status=${res.status}`, json);
  process.exit(1);
}
console.log(JSON.stringify(json, null, 2));
