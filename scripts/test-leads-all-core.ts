/**
 * Core: send one test lead per CPA partner (CZ storefront).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type { Offer, OfferSource } from "../src/lib/types";
import { loadOffers } from "../src/lib/offers.server";
import { submitKmaLead } from "../src/lib/kma.server";
import { submitM1TopLead } from "../src/lib/m1-top-sync.server";
import { submitCpagettiLead } from "../src/lib/cpagetti-sync.server";
import { submitAdcomboLead } from "../src/lib/adcombo-sync.server";
import { submitShakesLead } from "../src/lib/shakes-sync.server";
import { submitTerraleadsLead } from "../src/lib/terraleads-sync.server";
import { isValidPhoneCSDigits, phoneNationalCS } from "../src/lib/phone.cs";
import { MARKET_GEO } from "../src/lib/market";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SOURCES: OfferSource[] = [
  "cpa_tl",
  "kma",
  "m1_top",
  "cpagetti",
  "adcombo",
  "shakes",
  "terraleads",
];

const CPA_LEAD_ENDPOINT = "https://api.cpa.tl/api/lead/send";

const TEST_NAME = "Test Recenze Ceny CZ";
const TEST_PHONE = `+420601${String(Date.now()).slice(-6)}`;
const TEST_IP_CZ = "185.66.1.1";
const TEST_IP_FALLBACK = TEST_IP_CZ;
const TEST_UA = "recenze-ceny-test/1.0";
const TEST_REFERER = "https://recenze-ceny.cz/";
const TEST_SUB1 = "test-leads-all";
const KMA_LANG = "hu" as "de" | "uk" | "ru";
const API_LANG = "hu" as "uk" | "ru" | "de";

function loadEnv() {
  const envPath = resolve(root, ".env");
  try {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[m[1].trim()] = v;
    }
  } catch {
    // optional
  }
}

function parseArgs() {
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg
    ? onlyArg
        .slice(7)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;
  const offerIdArg = process.argv.find((a) => a.startsWith("--offer-id="));
  const offerIdOverride = offerIdArg ? Number(offerIdArg.slice(11)) : null;
  const ipArg = process.argv.find((a) => a.startsWith("--ip="));
  const ipOverride = ipArg ? ipArg.slice(5).trim() : null;
  return {
    dryRun: process.argv.includes("--dry-run"),
    only,
    offerIdOverride,
    ipOverride,
  };
}

const ENV_BY_SOURCE: Record<OfferSource, string[]> = {
  cpa_tl: ["CPA_TL_API_KEY"],
  kma: ["KMA_API_KEY", "KMA_SOURCE_ID"],
  m1_top: ["M1_TOP_API_KEY", "M1_TOP_WEBMASTER_ID"],
  cpagetti: ["CPAGETTI_API_TOKEN"],
  adcombo: ["ADCOMBO_API_KEY"],
  shakes: ["SHAKES_API_KEY", "SHAKES_STREAM_CODE"],
  terraleads: ["TERRALEADS_USER_ID", "TERRALEADS_API_KEY"],
};

function missingEnv(source: OfferSource) {
  return ENV_BY_SOURCE[source].filter((k) => !process.env[k]?.trim());
}

function pickOffer(offers: Offer[], source: OfferSource) {
  const pool = offers.filter((o) => o.source === source);
  if (!pool.length) return null;
  if (source === "adcombo") {
    return pool.find((o) => o.priceEUR != null) ?? pool[0];
  }
  return pool.find((o) => o.landingUrl) ?? pool[0];
}

function assertPhoneNationalCZ(phoneE164: string): string {
  const national = phoneNationalCS(phoneE164);
  if (!isValidPhoneCSDigits(national)) {
    console.error(`Invalid CZ national phone: e164=${phoneE164} national=${national || "(empty)"}`);
    process.exit(1);
  }
  return national;
}

async function resolveTestIp(override: string | null): Promise<string> {
  if (override) return override;
  const fromEnv =
    process.env.TEST_IP_CZ?.trim() ??
    process.env.TEST_IP_HU?.trim() ??
    process.env.TEST_IP_RO?.trim() ??
    process.env.TEST_IP_CH?.trim() ??
    process.env.TEST_IP_AT?.trim() ??
    process.env.TEST_IP_DE?.trim();
  if (fromEnv) return fromEnv;
  return TEST_IP_CZ;
}

async function submitCpaTlLead(args: {
  offerId: number;
  name: string;
  phone: string;
  ip: string;
  userAgent: string;
}) {
  const apiKey = process.env.CPA_TL_API_KEY;
  if (!apiKey) return { ok: false as const, error: "CPA_TL_API_KEY missing" };

  const body = new URLSearchParams({
    key: apiKey,
    id: `${args.offerId}-${Date.now()}`,
    offer_id: String(args.offerId),
    stream_hid: "",
    name: args.name,
    phone: args.phone,
    comments: TEST_SUB1,
    country: "CZ",
    address: "",
    tz: "5",
    web_id: TEST_SUB1,
    ip_address: args.ip,
    user_agent: args.userAgent,
  });

  const res = await fetch(CPA_LEAD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  let obj: { id?: string | number; errmsg?: string } = {};
  try {
    obj = JSON.parse(text);
  } catch {
    return { ok: false as const, error: `bad JSON: ${text.slice(0, 200)}` };
  }
  if (obj.errmsg) return { ok: false as const, error: String(obj.errmsg) };
  return { ok: true as const, leadId: String(obj.id ?? "") };
}

let testIp = TEST_IP_FALLBACK;

async function submitForSource(source: OfferSource, offerId: number) {
  const base = {
    offerId,
    name: TEST_NAME,
    phone: TEST_PHONE,
    ip: testIp,
    userAgent: TEST_UA,
    referer: TEST_REFERER,
  };

  switch (source) {
    case "cpa_tl":
      return submitCpaTlLead(base);
    case "kma":
      return submitKmaLead({ ...base, lang: KMA_LANG });
    case "m1_top":
      return submitM1TopLead({ ...base, lang: API_LANG });
    case "cpagetti":
      return submitCpagettiLead({ ...base, lang: API_LANG, sub1: TEST_SUB1 });
    case "adcombo":
      return submitAdcomboLead(base);
    case "shakes":
      return submitShakesLead(base);
    case "terraleads":
      return submitTerraleadsLead(base);
  }
}

loadEnv();
const { dryRun, only, offerIdOverride, ipOverride } = parseArgs();
const testIpResolved = await resolveTestIp(ipOverride);
testIp = testIpResolved;
const phoneNational = assertPhoneNationalCZ(TEST_PHONE);
if (process.env.LEADS_DEBUG_PAYLOAD === "1" || !dryRun) {
  process.env.KMA_DEBUG_PAYLOAD = "1";
}

const activeSources = only?.length
  ? SOURCES.filter((s) => only.includes(s))
  : [...SOURCES];

if (!activeSources.length) {
  console.error("No matching sources for --only");
  process.exit(1);
}

console.log("test-leads-all — CZ partners:", activeSources.join(", "));
console.log(`payload: name=${TEST_NAME} phone=${TEST_PHONE} sub1=${TEST_SUB1} ip=${testIpResolved}`);
console.log(`geo: country=${MARKET_GEO} referer=${TEST_REFERER} phoneNational=${phoneNational}`);
console.log("");
for (const source of activeSources) {
  const geo =
    source === "cpa_tl"
      ? `country=${MARKET_GEO} tz=5 phone=${TEST_PHONE} ip=${testIpResolved}`
      : source === "shakes" || source === "terraleads"
        ? `country=${MARKET_GEO} phone=${phoneNationalCS(TEST_PHONE)} ip=${testIpResolved}${source === "terraleads" ? " (no ip in TL API payload)" : ""}`
        : source === "adcombo"
          ? `country_code=${MARKET_GEO} phone=${TEST_PHONE} ip=${testIpResolved} referer=${TEST_REFERER}`
          : source === "m1_top"
            ? `langCode=${MARKET_GEO} phone=${TEST_PHONE} ip=${testIpResolved}`
            : `country=${MARKET_GEO} language=${source === "kma" ? KMA_LANG : API_LANG} phone=${TEST_PHONE} ip=${testIpResolved} referer=${TEST_REFERER}`;
  console.log(`  ${source}: ${geo}`);
}
console.log("");

const offers = await loadOffers();
const results: Array<{
  source: OfferSource;
  offerId: number | null;
  ok: boolean;
  leadId: string;
  error: string;
}> = [];

for (const source of activeSources) {
  const missing = missingEnv(source);
  if (missing.length) {
    console.log(`${source.padEnd(12)} SKIP env missing: ${missing.join(", ")}`);
    results.push({
      source,
      offerId: null,
      ok: false,
      leadId: "",
      error: `env missing: ${missing.join(", ")}`,
    });
    continue;
  }

  let offerId: number;
  if (offerIdOverride != null && !Number.isNaN(offerIdOverride) && activeSources.length === 1) {
    offerId = offerIdOverride;
  } else {
    const picked = pickOffer(offers, source);
    if (!picked) {
      results.push({
        source,
        offerId: null,
        ok: false,
        leadId: "",
        error: "no offers in DB for source",
      });
      continue;
    }
    offerId = picked.id;
  }

  const offer = offers.find((o) => o.source === source && o.id === offerId);
  const title = offer?.title?.slice(0, 40) ?? "";

  if (dryRun) {
    console.log(`DRY ${source.padEnd(12)} offerId=${offerId}  ${title}`);
    results.push({ source, offerId, ok: true, leadId: "(dry-run)", error: "" });
    continue;
  }

  process.stdout.write(`${source.padEnd(12)} offer ${offerId} ... `);
  const result = await submitForSource(source, offerId);
  if (result.ok) {
    console.log(`OK leadId=${result.leadId}`);
    results.push({ source, offerId, ok: true, leadId: result.leadId, error: "" });
  } else {
    console.log(`FAIL ${result.error}`);
    results.push({ source, offerId, ok: false, leadId: "", error: result.error });
  }
}

console.log("\n=== Summary ===");
console.log("source       | offerId | ok  | leadId              | error");
for (const r of results) {
  console.log(
    `${String(r.source).padEnd(12)} | ${String(r.offerId ?? "").padEnd(7)} | ${(r.ok ? "yes" : "no").padEnd(3)} | ${String(r.leadId).slice(0, 20).padEnd(20)} | ${r.error}`,
  );
}

const failed = results.filter(
  (r) =>
    !r.ok &&
    !r.error.includes("no offers in DB for source") &&
    !r.error.startsWith("env missing:"),
).length;

const payloadChecklist: Record<OfferSource, Record<string, string>> = {
  cpa_tl: { country: MARKET_GEO, tz: "5", phone: "E164", ip: testIpResolved },
  kma: { country: MARKET_GEO, language: KMA_LANG, phone: "E164", ip: testIpResolved, referer: TEST_REFERER },
  m1_top: { langCode: MARKET_GEO, phone: "E164", ip: testIpResolved },
  cpagetti: { country: MARKET_GEO, lang: "DE", phone: "E164", ip: testIpResolved },
  adcombo: { country_code: MARKET_GEO, phone: "E164", ip: testIpResolved, referer: TEST_REFERER },
  shakes: { countryCode: MARKET_GEO, phone: "national", phoneNational, ip: testIpResolved },
  terraleads: { country: MARKET_GEO, phone: "national", phoneNational, ip: "(not in API payload)" },
};

const report = {
  at: new Date().toISOString().slice(0, 10),
  dryRun,
  testName: TEST_NAME,
  testPhone: TEST_PHONE,
  testPhoneNational: phoneNational,
  testIp: testIpResolved,
  marketGeo: MARKET_GEO,
  referer: TEST_REFERER,
  results: results.map((r) => {
    const offer = offers.find((o) => o.source === r.source && o.id === r.offerId);
    const pdpUrl =
      offer != null
        ? `https://recenze-ceny.cz/${offer.categorySlug}/${offer.slug}`
        : null;
    return {
      source: r.source,
      offerId: r.offerId,
      ok: r.ok,
      leadId: r.leadId,
      error: r.error,
      title: offer?.title?.slice(0, 80) ?? null,
      pdpUrl,
      payload: payloadChecklist[r.source],
    };
  }),
  failed,
  skipped: results
    .filter((r) => r.error.includes("no offers in DB"))
    .map((r) => r.source),
};

const cacheDir = resolve(root, "scripts", ".cache");
mkdirSync(cacheDir, { recursive: true });
const reportPath = resolve(cacheDir, "leads-smoke-cz.json");
writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
console.log(`\nWrote ${reportPath}`);
console.log("\nJSON:", JSON.stringify({ results, failed }, null, 2));
process.exit(failed > 0 ? 1 : 0);
