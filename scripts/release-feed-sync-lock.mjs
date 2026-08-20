/**
 * Release feed_sync_lock if this run still holds it (GHA timeout / SIGKILL leftover).
 * Holder: FEED_SYNC_LOCK_HOLDER, else gha:${GITHUB_RUN_ID}.
 * No-op when secrets are missing or the row is held by someone else.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env };
const envPath = resolve(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    const key = m[1].trim();
    if (!env[key]) env[key] = v;
  }
}

const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const holder =
  env.FEED_SYNC_LOCK_HOLDER ||
  (env.GITHUB_RUN_ID ? `gha-${env.GITHUB_RUN_ID}` : "");

if (!url || !key) {
  console.warn("release-feed-sync-lock: SUPABASE_URL / SERVICE_ROLE_KEY missing — skip");
  process.exit(0);
}
if (!holder) {
  console.warn("release-feed-sync-lock: holder unknown — skip");
  process.exit(0);
}

const r = await fetch(`${url}/rest/v1/feed_sync_lock?id=eq.1&holder=eq.${encodeURIComponent(holder)}`, {
  method: "PATCH",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  body: JSON.stringify({
    holder: null,
    locked_at: null,
    expires_at: "1970-01-01T00:00:00.000Z",
  }),
});
const text = await r.text();
console.log(`release-feed-sync-lock holder=${holder} HTTP ${r.status} ${text.slice(0, 200)}`);
if (!r.ok) process.exit(1);
