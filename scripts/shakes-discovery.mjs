/**
 * Shakes.pro discovery — IT offers count, category/sitemap report + optional test lead.
 *
 * Usage:
 *   node scripts/shakes-discovery.mjs
 *   node scripts/shakes-discovery.mjs --test-lead --offer-id=2817
 *
 * Requires in .env:
 *   SHAKES_API_KEY
 *   SHAKES_STREAM_CODE (for --test-lead)
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import jiti from "jiti";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const load = jiti(import.meta.url);
const { classifyByText, classifyTitleFirst } = load("../src/lib/classify.ts");

function stripFeedMarkers(input) {
  if (!input) return input;
  let s = String(input);
  const sep = s.search(/\s[-—–]\s/);
  if (sep > 0) s = s.slice(0, sep);
  return s.replace(/\s{2,}/g, " ").trim();
}

function cleanedTitle(raw) {
  return stripFeedMarkers(String(raw ?? "").replace(/\s+/g, " ").trim());
}
const env = {};
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const MARKET_GEO = "ES";
const OFFERS_URL = "https://shakes.pro/index.php?r=offer/offers/json";
const ORDER_URL = "https://shakes.pro/index.php";

const CATEGORY_BLACKLIST_RE =
  /(betting|gambling|casino|dating|insurance|finance|loan|sweepstake|survey|software|subscription)/i;
const TEXT_BLACKLIST_RE =
  /(casino|bet\b|betting|slot|poker|crypto|forex|trading|binary|dating|gambl)/i;

function hasItGoal(offer) {
  const goals = offer?.goals ?? [];
  return goals.some((g) => String(g?.geo ?? "").toUpperCase() === MARKET_GEO);
}

function isItMarketOffer(offer) {
  if (!hasItGoal(offer)) return false;
  const title = String(offer?.title ?? "");
  if (/\[RU EUR\]/i.test(title)) return false;
  if (/\bfree\b/i.test(title) && Number(offer.landing_price) === 0) return false;
  if (!landingUrl(offer)) return false;
  return true;
}

function blockReason(offer) {
  if (!isItMarketOffer(offer)) {
    if (!hasItGoal(offer)) return "geo:no_it";
    if (/\[RU EUR\]/i.test(String(offer?.title ?? ""))) return "title:ru_eur";
    if (/\bfree\b/i.test(String(offer?.title ?? "")) && Number(offer.landing_price) === 0) {
      return "title:free_zero_price";
    }
    if (!landingUrl(offer)) return "landing:missing";
    return "geo:no_it";
  }
  const title = String(offer?.title ?? "");
  const text = `${title} ${JSON.stringify(offer?.traffic_types ?? "")}`;
  const catMatch = text.match(CATEGORY_BLACKLIST_RE);
  if (catMatch) return `category:${catMatch[1].toLowerCase()}`;
  const textMatch = text.match(TEXT_BLACKLIST_RE);
  if (textMatch) return `text:${textMatch[1].toLowerCase()}`;
  return null;
}

function isAllowed(offer) {
  return blockReason(offer) === null;
}

function categorySlugFromOffer(o, cleanedTitle) {
  const rawTitle = String(o.title ?? "");
  const titleFirst = classifyTitleFirst(cleanedTitle, rawTitle, "other");
  return titleFirst !== "other"
    ? titleFirst
    : classifyByText(`${cleanedTitle} ${rawTitle}`, "other");
}

function landingUrl(offer) {
  const landings = offer?.landings ?? [];
  if (!landings.length) return null;
  const url = landings[0]?.url;
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/+/, "")}`;
}

function imageUrl(offer) {
  const img = offer?.image;
  if (!img || !String(img).trim()) return null;
  if (/^https?:\/\//i.test(img)) return img;
  return `https://shakes.pro${img.startsWith("/") ? img : `/${img}`}`;
}

function itPayout(offer) {
  const g = (offer?.goals ?? []).find((x) => String(x?.geo ?? "").toUpperCase() === MARKET_GEO);
  return g?.cost != null ? Number(g.cost) : null;
}

async function fetchOffers() {
  const apiKey = env.SHAKES_API_KEY;
  const url = new URL(OFFERS_URL);
  if (apiKey) url.searchParams.set("key", apiKey);
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "recenze-ceny-discovery/1.0" },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("offers HTTP", res.status, text.slice(0, 400));
    process.exit(1);
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.error("invalid JSON", text.slice(0, 400));
    process.exit(1);
  }
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.offers)) return json.offers;
  if (json && typeof json === "object") {
    const vals = Object.values(json).filter((v) => v && typeof v === "object" && "id" in v);
    if (vals.length) return vals;
  }
  console.error("unexpected offers shape", Object.keys(json ?? {}));
  process.exit(1);
}

const testLead = process.argv.includes("--test-lead");
const offerIdArg = process.argv.find((a) => a.startsWith("--offer-id="));
const testOfferId = offerIdArg ? Number(offerIdArg.split("=")[1]) : null;

const all = await fetchOffers();
const itOffers = all.filter(hasItGoal);
const allowed = [];
const blocked = [];

for (const o of itOffers) {
  const reason = blockReason(o);
  if (reason) {
    blocked.push({ id: o.id, title: o.title, rule: reason });
    continue;
  }
  const cleaned = cleanedTitle(o.title ?? `Offer ${o.id}`);
  allowed.push({
    id: o.id,
    title: o.title,
    cleaned,
    payout_it: itPayout(o),
    landing_price: o.landing_price,
    landing: landingUrl(o),
    image: imageUrl(o),
    landings_count: (o.landings ?? []).length,
    categorySlug: categorySlugFromOffer(o, cleaned),
    in_sitemap: null,
  });
}

for (const o of allowed) {
  o.in_sitemap = o.categorySlug !== "other";
}

const other = allowed.filter((o) => o.categorySlug === "other");
const sitemapEligible = allowed.filter((o) => o.in_sitemap);

console.log("=== Shakes.pro discovery ===");
console.log(`total_offers=${all.length}`);
console.log(`it_goals=${itOffers.length}`);
console.log(`allowed=${allowed.length}`);
console.log(`blocked=${blocked.length}`);
console.log(`with_image=${allowed.filter((o) => o.image).length}`);
console.log(`with_landing=${allowed.filter((o) => o.landing).length}`);
console.log(`other=${other.length}`);
console.log(`sitemap_eligible=${sitemapEligible.length}`);

if (other.length) {
  console.log("\n--- Other category (allowed, not in sitemap) ---");
  for (const o of other) console.log(`${o.id}\t${o.title}`);
}

const bySlug = new Map();
for (const o of allowed) {
  bySlug.set(o.categorySlug, (bySlug.get(o.categorySlug) ?? 0) + 1);
}
console.log("\n--- Allowed by category_slug ---");
for (const [slug, count] of [...bySlug.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${slug.padEnd(22)} ${count}`);
}

if (blocked.length) {
  console.log("\n--- Blocked IT ---");
  for (const o of blocked) console.log(`${o.id}\t${o.rule}\t${o.title}`);
}

console.log("\n--- Allowed IT (first 15) ---");
for (const o of allowed.slice(0, 15)) {
  console.log(`${o.id}\t${o.categorySlug}\tsitemap=${o.in_sitemap}\tpayout=${o.payout_it}\t${o.title}`);
  console.log(`  landing: ${o.landing ?? "(none)"}`);
}

if (testLead) {
  const apiKey = env.SHAKES_API_KEY;
  const streamCode = env.SHAKES_STREAM_CODE;
  if (!apiKey || streamCode === undefined || streamCode === "") {
    console.error("\n--test-lead requires SHAKES_API_KEY and SHAKES_STREAM_CODE in .env");
    process.exit(1);
  }
  const sample =
    allowed.find((o) => Number(o.id) === testOfferId) ?? allowed[0];
  if (!sample?.landing) {
    console.error("\nNo IT offer with landing for test lead");
    process.exit(1);
  }
  const orderUrl = `${ORDER_URL}?r=/api/order/in&key=${encodeURIComponent(apiKey)}`;
  const body = new URLSearchParams({
    createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    offerId: String(sample.id),
    landingUrl: sample.landing,
    streamCode,
    name: "Test Test",
    phone: "612345678",
    countryCode: MARKET_GEO,
    ip: "127.0.0.1",
    referrer: "https://recenze-ceny.cz/",
    userAgent: "recenze-ceny-test/1.0",
    sub1: "discovery-test",
  });
  console.log(`\n--- Test lead offer ${sample.id} ---`);
  const res = await fetch(orderUrl, { method: "POST", body });
  const respText = await res.text();
  console.log("status:", res.status);
  console.log("response:", respText.slice(0, 500));
}
