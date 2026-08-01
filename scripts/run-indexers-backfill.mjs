/**
 * Paginate notify-indexers-backfill until all product URLs are pinged.
 * Requires HOOK_SECRET in .env (or pass --secret=...).
 *
 * Usage:
 *   node scripts/run-indexers-backfill.mjs
 *   node scripts/run-indexers-backfill.mjs --providers=indexnow
 *   node scripts/run-indexers-backfill.mjs --base=https://recenze-ceny.cz
 *
 * Google Indexing API setup (one-time):
 *   1. GCP → IAM → Service Accounts → create SA with no roles needed
 *   2. Enable "Web Search Indexing API" + "Google Search Console API" for the project
 *   3. GSC → Settings → Users → add SA email as Owner
 *   4. Add GOOGLE_INDEXING_SA_JSON to .env and run npm run secrets:cloudflare
 *   5. npm run db:migrate && npm run seo:indexing-retry (smart retry for non-indexed URLs)
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7)?.replace(/\/$/, "") ||
  "https://recenze-ceny.cz";
const providers =
  process.argv.find((a) => a.startsWith("--providers="))?.slice(12) || "indexnow,google";
const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.slice(8) || "200");

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

let offset = 0;
let totalUrls = 0;
let pages = 0;

while (true) {
  const url = `${base}/api/public/hooks/notify-indexers-backfill?limit=${limit}&offset=${offset}&providers=${encodeURIComponent(providers)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${secret}` } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`FAIL offset=${offset} status=${res.status}`, json);
    process.exit(1);
  }
  pages += 1;
  totalUrls += json.urls ?? 0;
  console.log(
    `page ${pages}: offset=${offset} rows=${json.rows} urls=${json.urls} next=${json.next_offset ?? "done"}`,
  );
  if (json.next_offset == null) break;
  offset = json.next_offset;
  await new Promise((r) => setTimeout(r, 1500));
}

console.log(`\nBackfill complete: ${totalUrls} URLs notified via ${providers}`);
