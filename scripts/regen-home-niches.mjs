/**
 * Regenerate stale AI content for home-climate and home-gadgets offers.
 * Picks up rows via PIPELINE_VERSION / source_hash mismatch (no force_regen).
 * Stops when a source returns gen=0. Requires dev server on localhost:8080.
 *
 * Usage: node scripts/regen-home-niches.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const raw = readFileSync(resolve(root, ".env"), "utf8");
const env = {};
for (const line of raw.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[m[1]] = v;
}
const secret = env.HOOK_SECRET;
if (!secret) {
  console.error("HOOK_SECRET missing in .env");
  process.exit(1);
}

const BASE = "http://localhost:8080";
const CATEGORIES = ["domaci-klima", "domaci-vychytavky"];
const SOURCES = ["cpa_tl", "kma", "m1_top", "cpagetti"];

async function fetchWithRetry(url, attempts = 5) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      return JSON.parse(text);
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
    }
  }
  throw lastErr;
}

let totalGenerated = 0;
for (const categorySlug of CATEGORIES) {
  console.log(`\n=== ${categorySlug} ===`);
  for (const source of SOURCES) {
    let round = 0;
    while (round < 30) {
      round++;
      const params = new URLSearchParams({
        secret,
        source,
        task: "ai",
        ai_limit: "4",
        category_slug: categorySlug,
      });
      const json = await fetchWithRetry(`${BASE}/api/public/hooks/backfill-content?${params}`);
      const block = json[source]?.content;
      const generated = block?.generated ?? 0;
      const failed = block?.failed ?? 0;
      totalGenerated += generated;
      console.log(`  ${source} r${round}: gen=${generated} fail=${failed} checked=${block?.checked ?? "?"}`);
      if (generated === 0 && failed === 0) break;
    }
  }
}
console.log(`\nDone. Total generated this run: ${totalGenerated}`);
