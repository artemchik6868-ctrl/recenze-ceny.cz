/**
 * Trigger a public hook on the AT worker.
 *
 * Usage:
 *   node scripts/trigger-hook.mjs content-drain
 *   node scripts/trigger-hook.mjs pipeline-status
 * Feed ingest is GHA (`npm run sync:feeds`), not a Worker hook.
 *
 * Default base: workers.dev URL until custom domain NS propagate.
 *
 * sync-daily diagnostics: response JSON includes timedOut, elapsed_ms, remaining_work.
 * Pass deadline_ms query param to extend hook budget (e.g. deadline_ms=240000).
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HOOKS = {
  "sync-feeds": { path: "/api/public/hooks/sync-feeds", timeoutMs: 300_000 },
  "sync-cpa-tl": { path: "/api/public/hooks/sync-cpa-tl", timeoutMs: 180_000 },
  "sync-daily": { path: "/api/public/hooks/sync-daily", timeoutMs: 310_000 },
  "content-drain": { path: "/api/public/hooks/content-drain", timeoutMs: 150_000 },
  "indexing-retry": { path: "/api/public/hooks/indexing-retry", timeoutMs: 300_000 },
  "backfill-content": { path: "/api/public/hooks/backfill-content", timeoutMs: 130_000 },
  "pipeline-status": { path: "/api/public/hooks/pipeline-status", timeoutMs: 180_000 },
  "smoke-landing-facts": { path: "/api/public/hooks/smoke-landing-facts", timeoutMs: 300_000 },
  "smoke-image-facts": { path: "/api/public/hooks/smoke-image-facts", timeoutMs: 180_000 },
  "landing-facts-drain": { path: "/api/public/hooks/landing-facts-drain", timeoutMs: 180_000 },
  "image-facts-drain": { path: "/api/public/hooks/image-facts-drain", timeoutMs: 120_000 },
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const env = {};
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7) ??
  process.env.SITE_URL ??
  env.SITE_URL ??
  process.env.AT_SYNC_BASE ??
  env.AT_SYNC_BASE ??
  process.env.CZ_WORKERS_DEV_BASE ??
  env.CZ_WORKERS_DEV_BASE ??
  "https://recenze-ceny.cz";

const hookName = process.argv[2];
const hook = hookName ? HOOKS[hookName] : null;

if (!hook) {
  console.error(`Usage: node scripts/trigger-hook.mjs <${Object.keys(HOOKS).join("|")}> [--base=URL] [--query=k=v&...]`);
  process.exit(1);
}

const secret = env.HOOK_SECRET;
if (!secret) {
  console.error("HOOK_SECRET missing in .env");
  process.exit(1);
}

const params = new URLSearchParams();
params.set("secret", secret);

const queryArg = process.argv.find((a) => a.startsWith("--query="))?.slice(8);
if (queryArg) {
  for (const part of queryArg.split("&")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    params.set(part.slice(0, eq), part.slice(eq + 1));
  }
}

const url = `${base}${hook.path}?${params.toString()}`;
const queryPreview = [...params.entries()]
  .filter(([k]) => k !== "secret")
  .map(([k, v]) => `${k}=${v}`)
  .join("&");
console.log(`GET ${base}${hook.path}?secret=***${queryPreview ? `&${queryPreview}` : ""}`);
const started = Date.now();
const res = await fetch(url, { signal: AbortSignal.timeout(hook.timeoutMs) });
const text = await res.text();
console.log(`Status: ${res.status} (${Date.now() - started}ms)`);
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text.slice(0, 4000));
}

if (!res.ok) process.exit(1);
