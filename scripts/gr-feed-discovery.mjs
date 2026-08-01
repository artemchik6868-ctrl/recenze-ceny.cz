/**
 * Dry-run CPA feed counts for GR geo (MARKET_GEO=GR).
 * Usage: node scripts/gr-feed-discovery.mjs
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
const GEO_CODES = ["GR"];

function matchesGeo(code) {
  const c = String(code ?? "").toUpperCase();
  return GEO_CODES.includes(c);
}

async function countKma() {
  const key = env.KMA_API_KEY;
  if (!key) return { network: "KMA", status: "skip", reason: "no KMA_API_KEY" };
  const url = `https://api.kma.biz/?method=getoffers&token=${encodeURIComponent(key)}&return_type=json`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return { network: "KMA", status: "error", http: res.status };
  const data = await res.json();
  const all = data?.offers ?? [];
  const gr = all.filter((o) => Array.isArray(o.codes) && o.codes.some(matchesGeo));
  return { network: "KMA", status: "ok", total: all.length, gr: gr.length };
}

async function countShakes() {
  const key = env.SHAKES_API_KEY;
  if (!key) return { network: "Shakes", status: "skip", reason: "no SHAKES_API_KEY" };
  const url = new URL("https://shakes.pro/index.php?r=offer/offers/json");
  url.searchParams.set("key", key);
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "greece-sales-discovery/1.0" },
  });
  if (!res.ok) return { network: "Shakes", status: "error", http: res.status };
  const data = await res.json();
  const all = Array.isArray(data) ? data : data?.offers ?? [];
  const gr = all.filter((o) => (o.goals ?? []).some((g) => matchesGeo(g.geo)));
  return { network: "Shakes", status: "ok", total: all.length, gr: gr.length };
}

async function countAdcombo() {
  const key = env.ADCOMBO_API_KEY;
  if (!key) return { network: "Adcombo", status: "skip", reason: "no ADCOMBO_API_KEY" };
  const all = [];
  let page = 1;
  while (page <= 20) {
    const url = new URL("https://api.adcombo.com/offer/info/");
    url.searchParams.set("api_key", key);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", "100");
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok) return { network: "Adcombo", status: "error", http: res.status, page };
    const data = await res.json();
    const pageOffers = data?.offers ?? [];
    all.push(...pageOffers);
    const total = data?.total ?? pageOffers.length;
    if (pageOffers.length < 100 || page * 100 >= total) break;
    page++;
  }
  const gr = all.filter((o) => {
    const countries = String(o.countries ?? "");
    return countries
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .some(matchesGeo);
  });
  return { network: "Adcombo", status: "ok", total: all.length, gr: gr.length };
}

async function countCpagetti() {
  const token = env.CPAGETTI_API_TOKEN;
  if (!token) return { network: "Cpagetti", status: "skip", reason: "no CPAGETTI_API_TOKEN" };
  const url = new URL("https://api.cpagetti.com/wm/offers");
  url.searchParams.set("token", token);
  url.searchParams.set("lang", "ru");
  url.searchParams.set("limit", "100");
  url.searchParams.set("offset", "0");
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": "greece-sales-discovery/1.0" },
  });
  if (!res.ok) return { network: "Cpagetti", status: "error", http: res.status };
  const data = await res.json();
  const resp = data?.response;
  const page = Array.isArray(resp) ? resp : resp && typeof resp === "object" ? Object.values(resp) : [];
  const gr = page.filter((o) => {
    const geos = o?.in_geo ?? o?.geo ?? [];
    const list = Array.isArray(geos) ? geos : [geos];
    return list.some((g) => matchesGeo(g?.country_code ?? g));
  });
  return { network: "Cpagetti", status: "ok", total: page.length, gr: gr.length, totalReported: data?.info?.total };
}

async function main() {
  console.log(`GR feed discovery (geo=${GEO_CODES.join("/")})\n`);
  const results = [];
  results.push(await countKma());
  results.push(await countShakes());
  results.push(await countAdcombo());
  results.push(await countCpagetti());
  for (const r of results) {
    console.log(JSON.stringify(r));
  }
  const networksWithGr = results.filter((r) => r.gr > 0).length;
  if (networksWithGr < 2) {
    console.warn(`\nWarning: only ${networksWithGr} network(s) returned GR offers. Check API keys and GR stream IDs.`);
    if (networksWithGr === 0) process.exitCode = 1;
  } else {
    console.log(`\nOK — ${networksWithGr} networks returned GR offers.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
