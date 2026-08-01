/**
 * TerraLeads discovery — IT offers, CPS-field check, category breakdown.
 *
 * Usage:
 *   node scripts/terraleads-discovery.mjs
 *   node scripts/terraleads-discovery.mjs --show-ip
 *   node scripts/terraleads-discovery.mjs --test-lead --offer-id=1316
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import jiti from "jiti";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const load = jiti(import.meta.url);
const { classifyByText, classifyTitleFirst } = load("../src/lib/classify.ts");
const {
  terraleadsApiPost,
  collectJsonKeys,
  isExplicitCpsOffer,
  terraleadsPartnerIp,
} = load("../src/lib/terraleads-api.server.ts");

const MARKET_GEO = "CZ";
const CATEGORY_BLACKLIST_RE =
  /(betting|gambling|casino|dating|insurance|finance|loan|sweepstake|survey|software|subscription)/i;
const TEXT_BLACKLIST_RE =
  /(casino|bet\b|betting|slot|poker|crypto|forex|trading|binary|dating|gambl)/i;

function terraleadsBlockReason(o) {
  if (String(o.country_code ?? "").toUpperCase() !== MARKET_GEO) return "geo:no_it";
  if (String(o.status ?? "").toLowerCase() !== "active") return "status:disabled";
  if (isExplicitCpsOffer(o)) return "type:cps";
  const title = String(o.product_name ?? "");
  const category = String(o.product_category ?? "");
  const text = `${title} ${category}`;
  const catMatch = text.match(CATEGORY_BLACKLIST_RE);
  if (catMatch) return `category:${catMatch[1].toLowerCase()}`;
  const textMatch = text.match(TEXT_BLACKLIST_RE);
  if (textMatch) return `text:${textMatch[1].toLowerCase()}`;
  return null;
}

function cleanedTitle(raw) {
  return String(raw ?? "").replace(/\s+/g, " ").trim();
}

function flattenProducts(products) {
  const out = [];
  for (const p of products ?? []) {
    for (const o of p.offers ?? []) {
      out.push({
        ...o,
        product_id: p.product_id,
        product_name: p.product_name,
        product_description: p.product_description,
        product_image: p.product_image,
        product_category: p.product_category,
      });
    }
  }
  return out;
}

function categorySlugFromOffer(o, cleanedTitle) {
  const feedCategory = String(o.product_category ?? "");
  const titleFirst = classifyTitleFirst(cleanedTitle, feedCategory, "other");
  return titleFirst !== "other"
    ? titleFirst
    : classifyByText(`${cleanedTitle} ${feedCategory}`, "other");
}

const testLead = process.argv.includes("--test-lead");
const showIp = process.argv.includes("--show-ip");
const offerIdArg = process.argv.find((a) => a.startsWith("--offer-id="));
const testOfferId = offerIdArg ? Number(offerIdArg.split("=")[1]) : null;

if (showIp) {
  try {
    const ipify = await fetch("https://api.ipify.org").then((r) => r.text()).catch(() => "");
    const res = await terraleadsApiPost("ip", "get", []);
    const tlIp = terraleadsPartnerIp(res.data);
    console.log("=== TerraLeads ip/get ===");
    if (ipify.trim()) console.log(`public_ipv4 (ipify)=${ipify.trim()}`);
    console.log(`partner_server_ip (TerraLeads)=${tlIp ?? "(unknown)"}`);
    if (tlIp && ipify.trim() && tlIp !== ipify.trim()) {
      console.log("NOTE: ip/get may show IPv6, but TerraLeads whitelist accepts IPv4 only.");
      console.log(`      Whitelist your IPv4: ${ipify.trim()} (remove any IPv6 lines before Save).`);
    } else if (ipify.trim()) {
      console.log(`Whitelist this IPv4 in TerraLeads: ${ipify.trim()}`);
    }
  } catch (err) {
    console.error("ip/get failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
  const onlyShowIp = process.argv.filter((a) => a.startsWith("--")).every((a) => a === "--show-ip");
  if (onlyShowIp) process.exit(0);
}

let products;
try {
  const res = await terraleadsApiPost("offer", "list", []);
  products = res.data;
} catch (err) {
  console.error("offer/list failed:", err instanceof Error ? err.message : err);
  try {
    const ipRes = await terraleadsApiPost("ip", "get", []);
    const tlIp = terraleadsPartnerIp(ipRes.data);
    if (tlIp) {
      const ipify = await fetch("https://api.ipify.org").then((r) => r.text()).catch(() => "");
      console.error(`\nTerraLeads ip/get=${tlIp}`);
      if (ipify.trim()) {
        console.error(`Your IPv4 (whitelist this): ${ipify.trim()}`);
        console.error("TerraLeads whitelist rejects IPv6 — remove IPv6 lines and click Save.");
      }
    }
  } catch {
    /* ip/get optional hint */
  }
  process.exit(1);
}

const all = flattenProducts(Array.isArray(products) ? products : []);
const itActive = all.filter(
  (o) =>
    String(o.country_code ?? "").toUpperCase() === MARKET_GEO &&
    String(o.status ?? "").toLowerCase() === "active",
);

const cpsSamples = itActive.filter((o) => isExplicitCpsOffer(o));
const keySamples = itActive.slice(0, 5).map((o) => o);
const jsonKeys = collectJsonKeys(keySamples);

console.log("=== TerraLeads discovery ===");
console.log(`products=${Array.isArray(products) ? products.length : 0}`);
console.log(`flattened_offers=${all.length}`);
console.log(`it_active=${itActive.length}`);

console.log("\n--- CPS field check ---");
if (cpsSamples.length) {
  console.log(`CPS_FIELD_FOUND=yes count=${cpsSamples.length}`);
  for (const o of cpsSamples.slice(0, 5)) {
    console.log(`  ${o.offer_id}\t${o.product_name}\t${o.product_category}`);
  }
} else {
  console.log("CPS_FIELD_FOUND=no (no explicit CPS markers in IT active offers)");
}

console.log("\n--- Sample JSON keys (first 5 IT offers) ---");
for (const k of jsonKeys) console.log(`  ${k}`);

const allowed = [];
const blocked = [];

for (const o of itActive) {
  const reason = terraleadsBlockReason(o);
  const cleaned = cleanedTitle(o.product_name ?? `Offer ${o.offer_id}`);
  if (reason) {
    blocked.push({ id: o.offer_id, title: o.product_name, rule: reason });
    continue;
  }
  const categorySlug = categorySlugFromOffer(o, cleaned);
  allowed.push({
    id: o.offer_id,
    title: o.product_name,
    category: o.product_category,
    categorySlug,
    in_sitemap: categorySlug !== "other",
    payout: o.payout,
    landing_price: o.landing_price,
    landing_currency: o.landing_currency,
  });
}

const other = allowed.filter((o) => o.categorySlug === "other");
const sitemapEligible = allowed.filter((o) => o.in_sitemap);

console.log(`\nallowed=${allowed.length}`);
console.log(`blocked=${blocked.length}`);
console.log(`other=${other.length}`);
console.log(`sitemap_eligible=${sitemapEligible.length}`);

const byCat = new Map();
for (const o of allowed) {
  byCat.set(o.category ?? "(none)", (byCat.get(o.category ?? "(none)") ?? 0) + 1);
}
console.log("\n--- Allowed by product_category ---");
for (const [slug, count] of [...byCat.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(slug).padEnd(22)} ${count}`);
}

if (blocked.length) {
  console.log("\n--- Blocked IT active ---");
  for (const o of blocked) console.log(`${o.id}\t${o.rule}\t${o.title}`);
}

if (other.length) {
  console.log("\n--- Other category (allowed, not in sitemap) ---");
  for (const o of other.slice(0, 20)) console.log(`${o.id}\t${o.category}\t${o.title}`);
}

console.log("\n--- Allowed IT (first 15) ---");
for (const o of allowed.slice(0, 15)) {
  console.log(`${o.id}\t${o.categorySlug}\tsitemap=${o.in_sitemap}\t${o.title}`);
}

if (testLead) {
  const { createHash } = await import("node:crypto");
  const userId = Number(process.env.TERRALEADS_USER_ID);
  const apiKey = process.env.TERRALEADS_API_KEY;
  if (!userId || !apiKey) {
    console.error("\n--test-lead requires TERRALEADS_USER_ID and TERRALEADS_API_KEY");
    process.exit(1);
  }
  const sample =
    allowed.find((o) => Number(o.id) === testOfferId) ?? allowed[0];
  if (!sample) {
    console.error("\nNo allowed IT offer for test lead");
    process.exit(1);
  }
  const phoneDigits = "612345678";
  const payload = {
    name: "Test Test",
    country: MARKET_GEO,
    phone: phoneDigits,
    offer_id: Number(sample.id),
    user_agent: "recenze-ceny-test/1.0",
    referer: "https://recenze-ceny.cz/",
    sub1: "discovery-test",
  };
  const body = JSON.stringify({ user_id: userId, data: payload });
  const check_sum = createHash("sha1").update(body + apiKey).digest("hex");
  const url = `https://t-api.org/api/lead/create?check_sum=${check_sum}`;
  console.log(`\n--- Test lead offer ${sample.id} ---`);
  const res = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body,
  });
  const text = await res.text();
  console.log("status:", res.status);
  console.log("response:", text.slice(0, 500));
}
