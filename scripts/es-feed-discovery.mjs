/**
 * Dry-run CPA feed counts for ES geo (MARKET_GEO=ES).
 * Requires .env with CPA keys. Does not write to Supabase.
 *
 * Usage: node scripts/es-feed-discovery.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(join(root, ".env"), "utf8").split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
    }
  } catch {
    /* .env optional for partial checks */
  }
  return env;
}

const env = loadEnv();
const GEO = "ES";

async function countKma() {
  const key = env.KMA_API_KEY;
  if (!key) return { network: "KMA", status: "skip", reason: "no KMA_API_KEY" };
  const url = `https://api.kma.biz/offers?token=${encodeURIComponent(key)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return { network: "KMA", status: "error", http: res.status };
  const data = await res.json();
  const all = Array.isArray(data) ? data : data?.offers ?? [];
  const es = all.filter((o) => Array.isArray(o.codes) && o.codes.includes(GEO));
  return { network: "KMA", status: "ok", total: all.length, es: es.length };
}

async function countShakes() {
  const key = env.SHAKES_API_KEY;
  if (!key) return { network: "Shakes", status: "skip", reason: "no SHAKES_API_KEY" };
  const url = "https://shakes.pro/index.php?r=offer/offers/json";
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "recenze-ceny-discovery/1.0" },
  });
  if (!res.ok) return { network: "Shakes", status: "error", http: res.status };
  const data = await res.json();
  const all = Array.isArray(data) ? data : data?.offers ?? [];
  const es = all.filter((o) =>
    (o.goals ?? []).some((g) => String(g.geo ?? "").toUpperCase() === GEO),
  );
  return { network: "Shakes", status: "ok", total: all.length, es: es.length };
}

async function main() {
  console.log(`ES feed discovery (geo=${GEO})\n`);
  const results = [];
  results.push(await countKma());
  results.push(await countShakes());
  for (const r of results) {
    console.log(JSON.stringify(r));
  }
  const anyEs = results.some((r) => r.es > 0);
  if (!anyEs) {
    console.warn("\nWarning: no ES offers detected in sampled feeds. Check API keys and SHAKES_STREAM_CODE.");
    process.exitCode = 1;
  } else {
    console.log("\nOK — at least one network returned ES offers.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
