/**
 * Resubmit sitemap.xml to Google Search Console (Sitemaps API).
 * Requires HOOK_SECRET in .env (or --secret=...).
 * Same SA setup as seo:indexing-retry (Owner in GSC + Search Console API).
 *
 * Usage:
 *   node scripts/run-submit-sitemap.mjs
 *   node scripts/run-submit-sitemap.mjs --dry-run=1
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7)?.replace(/\/$/, "") ||
  "https://recenze-ceny.cz";
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

const params = new URLSearchParams();
if (dryRun) params.set("dry_run", "1");
const qs = params.toString();
const url = `${base}/api/public/hooks/submit-sitemap${qs ? `?${qs}` : ""}`;
const res = await fetch(url, { headers: { Authorization: `Bearer ${secret}` } });
const json = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`FAIL status=${res.status}`, json);
  process.exit(1);
}
console.log(JSON.stringify(json, null, 2));
