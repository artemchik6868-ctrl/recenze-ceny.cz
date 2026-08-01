/**
 * Count offers per country across 6 CPA networks (full feeds, no MARKET_GEO filter).
 * Usage: npm run count:offers-by-country
 *        npm run count:offers-by-country -- --reset-cpagetti
 */
import { mkdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const NETWORKS = ["cpa_tl", "m1_top", "shakes", "kma", "cpagetti", "adcombo"] as const;
type Network = (typeof NETWORKS)[number];

const NETWORK_LABELS: Record<Network, string> = {
  cpa_tl: "cpa.tl",
  m1_top: "m1.top",
  shakes: "shakes",
  kma: "kma",
  cpagetti: "cpagetti",
  adcombo: "adcombo",
};

const ISO2_RE = /^[A-Z]{2}$/;

function normalizeGeo(raw: unknown): string | null {
  const code = String(raw ?? "").trim().toUpperCase();
  return ISO2_RE.test(code) ? code : null;
}

function countByCountry(geosPerOffer: string[][]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const geos of geosPerOffer) {
    const unique = new Set(geos);
    for (const geo of unique) {
      counts.set(geo, (counts.get(geo) ?? 0) + 1);
    }
  }
  return counts;
}

type FetchResult = {
  network: Network;
  status: "ok" | "partial" | "skip" | "error";
  reason?: string;
  fetched?: number;
  counts: Map<string, number>;
};

const CACHE_DIR = resolve(root, "scripts/.cache");
const CPAGETTI_CHECKPOINT = resolve(CACHE_DIR, "cpagetti-count-checkpoint.json");

type CpagettiCheckpoint = {
  nextOffset: number;
  fetched: number;
  counts: Record<string, number>;
  lastError?: string;
  updatedAt: string;
};

function mapFromRecord(counts: Record<string, number>): Map<string, number> {
  return new Map(Object.entries(counts));
}

function recordFromMap(counts: Map<string, number>): Record<string, number> {
  return Object.fromEntries(counts);
}

function loadCpagettiCheckpoint(): CpagettiCheckpoint | null {
  if (!existsSync(CPAGETTI_CHECKPOINT)) return null;
  try {
    return JSON.parse(readFileSync(CPAGETTI_CHECKPOINT, "utf8")) as CpagettiCheckpoint;
  } catch {
    return null;
  }
}

function saveCpagettiCheckpoint(data: Omit<CpagettiCheckpoint, "updatedAt">): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  const payload: CpagettiCheckpoint = { ...data, updatedAt: new Date().toISOString() };
  writeFileSync(CPAGETTI_CHECKPOINT, JSON.stringify(payload, null, 2), "utf8");
}

function clearCpagettiCheckpoint(): void {
  if (existsSync(CPAGETTI_CHECKPOINT)) unlinkSync(CPAGETTI_CHECKPOINT);
}

function addPageToCounts(counts: Map<string, number>, geosPerOffer: string[][]): void {
  for (const geos of geosPerOffer) {
    const unique = new Set(geos);
    for (const geo of unique) {
      counts.set(geo, (counts.get(geo) ?? 0) + 1);
    }
  }
}

async function fetchCpaTl(): Promise<FetchResult> {
  const network: Network = "cpa_tl";
  try {
    const res = await fetch("https://cpa.tl/api/offers", { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { data?: Array<{ goals?: Array<{ geo?: string }> }> };
    const all = json.data ?? [];
    const geosPerOffer = all.map((o) =>
      (o.goals ?? []).map((g) => normalizeGeo(g.geo)).filter((g): g is string => g !== null),
    );
    return { network, status: "ok", fetched: all.length, counts: countByCountry(geosPerOffer) };
  } catch (e) {
    return { network, status: "error", reason: String(e), counts: new Map() };
  }
}

async function fetchM1Top(): Promise<FetchResult> {
  const network: Network = "m1_top";
  const apiKey = process.env.M1_TOP_API_KEY;
  const webmasterId = process.env.M1_TOP_WEBMASTER_ID;
  if (!apiKey || !webmasterId) {
    return { network, status: "skip", reason: "no M1_TOP_API_KEY or M1_TOP_WEBMASTER_ID", counts: new Map() };
  }
  try {
    const url = `https://m1.top/offers_export_api/?webmaster_id=${encodeURIComponent(webmasterId)}&api_key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const all = (await res.json()) as Array<{ target?: Array<{ code?: string }> }>;
    const geosPerOffer = (all ?? []).map((o) =>
      (o.target ?? []).map((t) => normalizeGeo(t.code)).filter((g): g is string => g !== null),
    );
    return { network, status: "ok", fetched: all.length, counts: countByCountry(geosPerOffer) };
  } catch (e) {
    return { network, status: "error", reason: String(e), counts: new Map() };
  }
}

function normalizeShakesPayload(json: unknown): Array<{ goals?: Array<{ geo?: string }> }> {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.offers)) return obj.offers as Array<{ goals?: Array<{ geo?: string }> }>;
    return Object.values(obj).filter(
      (v): v is { goals?: Array<{ geo?: string }> } =>
        !!v && typeof v === "object" && "id" in (v as object),
    );
  }
  return [];
}

async function fetchShakes(): Promise<FetchResult> {
  const network: Network = "shakes";
  const key = process.env.SHAKES_API_KEY;
  if (!key) return { network, status: "skip", reason: "no SHAKES_API_KEY", counts: new Map() };
  try {
    const url = new URL("https://shakes.pro/index.php?r=offer/offers/json");
    url.searchParams.set("key", key);
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "recenze-ceny-count/1.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const all = normalizeShakesPayload(await res.json());
    const geosPerOffer = all.map((o) =>
      (o.goals ?? []).map((g) => normalizeGeo(g.geo)).filter((g): g is string => g !== null),
    );
    return { network, status: "ok", fetched: all.length, counts: countByCountry(geosPerOffer) };
  } catch (e) {
    return { network, status: "error", reason: String(e), counts: new Map() };
  }
}

async function fetchKma(): Promise<FetchResult> {
  const network: Network = "kma";
  const token = process.env.KMA_API_KEY;
  if (!token) return { network, status: "skip", reason: "no KMA_API_KEY", counts: new Map() };
  try {
    const url = `https://api.kma.biz/?method=getoffers&token=${encodeURIComponent(token)}&return_type=json`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { code?: number; msg?: string; offers?: Array<{ codes?: string[] }> };
    if (json.code !== 0) throw new Error(json.msg || `code ${json.code}`);
    const all = json.offers ?? [];
    const geosPerOffer = all.map((o) =>
      (o.codes ?? []).map((c) => normalizeGeo(c)).filter((g): g is string => g !== null),
    );
    return { network, status: "ok", fetched: all.length, counts: countByCountry(geosPerOffer) };
  } catch (e) {
    return { network, status: "error", reason: String(e), counts: new Map() };
  }
}

type CpagettiOffer = {
  geo?: Record<string, { country_code?: string }>;
};

async function fetchCpagettiPage(token: string, offset: number, limit: number): Promise<CpagettiOffer[]> {
  const url = new URL("https://api.cpagetti.com/wm/offers");
  url.searchParams.set("token", token);
  url.searchParams.set("lang", "ru");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json", "User-Agent": "recenze-ceny-count/1.0" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { response?: CpagettiOffer[] | Record<string, CpagettiOffer> };
      const resp = json?.response;
      if (Array.isArray(resp)) return resp;
      if (resp && typeof resp === "object") return Object.values(resp);
      return [];
    } catch (e) {
      lastError = e;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastError;
}

function extractCpagettiGeos(o: CpagettiOffer): string[] {
  const geo = o.geo;
  if (!geo || typeof geo !== "object") return [];
  return Object.values(geo)
    .map((g) => normalizeGeo(g?.country_code))
    .filter((g): g is string => g !== null);
}

async function fetchCpagetti(resetCheckpoint = false): Promise<FetchResult> {
  const network: Network = "cpagetti";
  const token = process.env.CPAGETTI_API_TOKEN;
  if (!token) return { network, status: "skip", reason: "no CPAGETTI_API_TOKEN", counts: new Map() };

  if (resetCheckpoint) clearCpagettiCheckpoint();

  const saved = loadCpagettiCheckpoint();
  const limit = 100;
  let offset = saved?.nextOffset ?? 0;
  const counts = saved ? mapFromRecord(saved.counts) : new Map<string, number>();

  if (saved) {
    console.log(
      `[cpagetti] resuming from offset ${offset} (${saved.fetched} offers already counted)`,
    );
  }

  try {
    for (let page = 0; page < 25; page++) {
      let pageOffers: CpagettiOffer[];
      try {
        pageOffers = await fetchCpagettiPage(token, offset, limit);
      } catch (e) {
        saveCpagettiCheckpoint({
          nextOffset: offset,
          fetched: offset,
          counts: recordFromMap(counts),
          lastError: String(e),
        });
        return {
          network,
          status: "partial",
          reason: `${e} — saved ${offset} offers, rerun later to continue`,
          fetched: offset,
          counts,
        };
      }

      addPageToCounts(counts, pageOffers.map(extractCpagettiGeos));
      offset += pageOffers.length;

      if (pageOffers.length < limit) {
        clearCpagettiCheckpoint();
        return { network, status: "ok", fetched: offset, counts };
      }

      saveCpagettiCheckpoint({
        nextOffset: offset,
        fetched: offset,
        counts: recordFromMap(counts),
      });
      await new Promise((r) => setTimeout(r, 400));
    }

    saveCpagettiCheckpoint({
      nextOffset: offset,
      fetched: offset,
      counts: recordFromMap(counts),
      lastError: "reached page limit",
    });
    return {
      network,
      status: "partial",
      reason: `reached page limit — saved ${offset} offers, rerun to continue`,
      fetched: offset,
      counts,
    };
  } catch (e) {
    saveCpagettiCheckpoint({
      nextOffset: offset,
      fetched: offset,
      counts: recordFromMap(counts),
      lastError: String(e),
    });
    return { network, status: "error", reason: String(e), fetched: offset, counts };
  }
}

type AdcomboOffer = {
  countries?: string;
};

async function fetchAdcombo(): Promise<FetchResult> {
  const network: Network = "adcombo";
  const apiKey = process.env.ADCOMBO_API_KEY;
  if (!apiKey) return { network, status: "skip", reason: "no ADCOMBO_API_KEY", counts: new Map() };
  try {
    const all: AdcomboOffer[] = [];
    let page = 1;
    const perPage = 100;
    while (page <= 50) {
      const url = new URL("https://api.adcombo.com/offer/info/");
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("page", String(page));
      url.searchParams.set("per_page", String(perPage));
      let pageOffers: AdcomboOffer[] = [];
      for (let attempt = 0; attempt < 4; attempt++) {
        const res = await fetch(url, {
          headers: { Accept: "application/json", "User-Agent": "recenze-ceny-count/1.0" },
        });
        if (res.status === 429 && attempt < 3) {
          await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
          continue;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { offers?: AdcomboOffer[]; total?: number };
        pageOffers = json.offers ?? [];
        const total = json.total ?? pageOffers.length;
        all.push(...pageOffers);
        if (pageOffers.length < perPage || page * perPage >= total) {
          page = 51;
          break;
        }
        break;
      }
      if (page > 50) break;
      page++;
      await new Promise((r) => setTimeout(r, 800));
    }
    const geosPerOffer = all.map((o) =>
      String(o.countries ?? "")
        .split(",")
        .map((s) => normalizeGeo(s))
        .filter((g): g is string => g !== null),
    );
    return { network, status: "ok", fetched: all.length, counts: countByCountry(geosPerOffer) };
  } catch (e) {
    return { network, status: "error", reason: String(e), counts: new Map() };
  }
}

function buildMatrix(results: FetchResult[]): {
  countries: string[];
  matrix: Map<string, Record<Network, number>>;
  columnTotals: Record<Network, number>;
} {
  const countrySet = new Set<string>();
  for (const r of results) {
    for (const geo of r.counts.keys()) countrySet.add(geo);
  }
  const countries = [...countrySet].sort();

  const matrix = new Map<string, Record<Network, number>>();
  for (const country of countries) {
    const row = {} as Record<Network, number>;
    for (const net of NETWORKS) row[net] = 0;
    matrix.set(country, row);
  }

  const columnTotals = {} as Record<Network, number>;
  for (const net of NETWORKS) columnTotals[net] = 0;

  for (const r of results) {
    for (const [country, count] of r.counts) {
      const row = matrix.get(country);
      if (row) {
        row[r.network] = count;
        columnTotals[r.network] += count;
      }
    }
  }

  return { countries, matrix, columnTotals };
}

function writeExcel(
  countries: string[],
  matrix: Map<string, Record<Network, number>>,
  columnTotals: Record<Network, number>,
  outPath: string,
): void {
  const header = ["Страна", ...NETWORKS.map((n) => NETWORK_LABELS[n]), "всего"];
  const rows: (string | number)[][] = [header];

  for (const country of countries) {
    const row = matrix.get(country)!;
    const rowTotal = NETWORKS.reduce((sum, n) => sum + row[n], 0);
    rows.push([country, ...NETWORKS.map((n) => row[n]), rowTotal]);
  }

  const grandTotal = NETWORKS.reduce((sum, n) => sum + columnTotals[n], 0);
  rows.push(["ИТОГО", ...NETWORKS.map((n) => columnTotals[n]), grandTotal]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "offers-by-country");
  XLSX.writeFile(wb, outPath);
}

function printSummary(
  results: FetchResult[],
  countries: string[],
  matrix: Map<string, Record<Network, number>>,
  columnTotals: Record<Network, number>,
): void {
  console.log("\n=== Offers by country (live API) ===\n");

  for (const r of results) {
    const label = NETWORK_LABELS[r.network].padEnd(10);
    if (r.status === "ok") {
      console.log(`${label} ok — fetched ${r.fetched}, countries with offers: ${r.counts.size}`);
    } else if (r.status === "partial") {
      console.log(`${label} partial — fetched ${r.fetched}, countries: ${r.counts.size} — ${r.reason ?? ""}`);
    } else {
      console.log(`${label} ${r.status} — ${r.reason ?? ""}`);
    }
  }

  console.log("\nColumn totals:");
  for (const n of NETWORKS) {
    console.log(`  ${NETWORK_LABELS[n].padEnd(10)} ${columnTotals[n]}`);
  }
  console.log(`  ${"всего".padEnd(10)} ${NETWORKS.reduce((s, n) => s + columnTotals[n], 0)}`);

  const topCountries = countries
    .map((c) => {
      const row = matrix.get(c)!;
      const total = NETWORKS.reduce((sum, n) => sum + row[n], 0);
      return { country: c, total, row };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  console.log("\nTop 15 countries by total:");
  const hdr = ["Страна", ...NETWORKS.map((n) => NETWORK_LABELS[n]), "всего"].join("\t");
  console.log(hdr);
  for (const { country, total, row } of topCountries) {
    console.log([country, ...NETWORKS.map((n) => row[n]), total].join("\t"));
  }
}

async function main(): Promise<void> {
  const resetCpagetti = process.argv.includes("--reset-cpagetti");
  if (resetCpagetti) console.log("Resetting CPAgetti checkpoint…");

  console.log("Fetching feeds from 6 networks…");
  const results: FetchResult[] = [];
  results.push(await fetchCpaTl());
  results.push(await fetchM1Top());
  results.push(await fetchShakes());
  results.push(await fetchKma());
  results.push(await fetchCpagetti(resetCpagetti));
  results.push(await fetchAdcombo());

  const { countries, matrix, columnTotals } = buildMatrix(results);

  mkdirSync(CACHE_DIR, { recursive: true });
  const outPath = resolve(CACHE_DIR, "offers-by-country.xlsx");
  writeExcel(countries, matrix, columnTotals, outPath);

  printSummary(results, countries, matrix, columnTotals);
  console.log(`\nExcel saved: ${outPath}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
