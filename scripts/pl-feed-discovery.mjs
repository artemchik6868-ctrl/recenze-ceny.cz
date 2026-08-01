/**
 * Dry-run CPA feed counts for PL geo (MARKET_GEO=PL).
 * Requires .env with CPA keys. Does not write to Supabase.
 *
 * Usage: node scripts/pl-feed-discovery.mjs
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
    /* .env optional */
  }
  return env;
}

const env = loadEnv();
const GEO_CODES = ["PL"];

function matchesGeo(code) {
  const c = String(code ?? "").toUpperCase();
  return GEO_CODES.includes(c);
}

async function countKma() {
  const key = env.KMA_API_KEY;
  if (!key) return { network: "KMA", status: "skip", reason: "no KMA_API_KEY" };
  const url = `https://api.kma.biz/offers?token=${encodeURIComponent(key)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return { network: "KMA", status: "error", http: res.status };
  const data = await res.json();
  const all = Array.isArray(data) ? data : data?.offers ?? [];
  const pl = all.filter((o) => Array.isArray(o.codes) && o.codes.some(matchesGeo));
  return { network: "KMA", status: "ok", total: all.length, pl: pl.length };
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
  const pl = all.filter((o) => (o.goals ?? []).some((g) => matchesGeo(g.geo)));
  return { network: "Shakes", status: "ok", total: all.length, pl: pl.length };
}

async function main() {
  console.log(`PL feed discovery (geo=${GEO_CODES.join("/")})\n`);
  const results = [];
  results.push(await countKma());
  results.push(await countShakes());
  for (const r of results) {
    console.log(JSON.stringify(r));
  }
  const anyPl = results.some((r) => r.pl > 0);
  if (!anyPl) {
    console.warn("\nWarning: no PL offers in sampled feeds. Check API keys and PL stream IDs.");
    process.exitCode = 1;
  } else {
    console.log("\nOK — at least one network returned PL offers.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
