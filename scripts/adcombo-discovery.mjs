import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import jiti from "jiti";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const apiKey = env.ADCOMBO_API_KEY;
if (!apiKey) {
  console.error("ADCOMBO_API_KEY missing in .env");
  process.exit(1);
}

const MARKET_GEO = "IT";

const CATEGORY_BLACKLIST_RE =
  /(betting|gambling|casino|dating|insurance|finance|loan|sweepstake|survey|software|subscription)/i;
const TEXT_BLACKLIST_RE =
  /(casino|bet\b|betting|slot|poker|crypto|forex|trading|binary|dating|gambl)/i;

const load = jiti(import.meta.url);
const { classifyByText, classifyTitleFirst } = load("../src/lib/classify.ts");

function normalizeTitle(name) {
  return String(name ?? "").replace(/\s+/g, " ").trim();
}

function hasGeo(countries, geo) {
  if (!countries) return false;
  return countries
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .includes(geo);
}

function blockReason(o) {
  if (o.state !== "active") return "state:inactive";
  if (String(o.type ?? "").toUpperCase() !== "COD") return "type:not_cod";
  if (!hasGeo(o.countries, MARKET_GEO)) return "geo:no_it";
  const cats = (o.categories ?? []).join(" ");
  const catMatch = cats.match(CATEGORY_BLACKLIST_RE);
  if (catMatch) return `category:${catMatch[1].toLowerCase()}`;
  const text = `${o.name ?? ""} ${cats}`;
  const textMatch = text.match(TEXT_BLACKLIST_RE);
  if (textMatch) return `text:${textMatch[1].toLowerCase()}`;
  return null;
}

function categorySlugFromOffer(o, title) {
  const cats = (o.categories ?? []).join(" ");
  const titleFirst = classifyTitleFirst(title, cats, "other");
  return titleFirst !== "other" ? titleFirst : classifyByText(`${title} ${cats}`, "other");
}

async function fetchAllOffers() {
  const all = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const url = new URL("https://api.adcombo.com/offer/info/");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));
    const res = await fetch(url);
    const text = await res.text();
    if (!res.ok) {
      console.error("HTTP", res.status, text.slice(0, 300));
      process.exit(1);
    }
    const json = JSON.parse(text);
    const offers = json.offers ?? [];
    all.push(...offers);
    const total = json.total ?? offers.length;
    if (offers.length < perPage || page * perPage >= total) break;
    page++;
  }
  return all;
}

const all = await fetchAllOffers();
const itActiveCod = all.filter(
  (o) =>
    o.state === "active" &&
    String(o.type ?? "").toUpperCase() === "COD" &&
    hasGeo(o.countries, MARKET_GEO),
);

const blocked = [];
const allowed = [];

for (const o of itActiveCod) {
  const reason = blockReason(o);
  const title = normalizeTitle(o.name ?? `Offer ${o.id}`);
  if (reason) {
    blocked.push({
      id: o.id,
      name: o.name,
      categories: (o.categories ?? []).join(", "),
      rule: reason,
    });
    continue;
  }
  const categorySlug = categorySlugFromOffer(o, title);
  allowed.push({
    id: o.id,
    name: o.name,
    title,
    categories: (o.categories ?? []).join(", "),
    categorySlug,
    in_sitemap: categorySlug !== "other",
  });
}

const other = allowed.filter((o) => o.categorySlug === "other");
const sitemapEligible = allowed.filter((o) => o.in_sitemap);

console.log("=== AdCombo IT discovery ===");
console.log(`total_offers=${all.length}`);
console.log(`it_active_cod=${itActiveCod.length}`);
console.log(`allowed=${allowed.length}`);
console.log(`blocked=${blocked.length}`);
console.log(`other=${other.length}`);
console.log(`sitemap_eligible=${sitemapEligible.length}`);

if (blocked.length > 0) {
  console.log("\n--- Blocked (IT active COD) ---");
  for (const o of blocked) {
    console.log(`${o.id}\t${o.rule}\t${o.categories}\t${o.name}`);
  }
}

if (other.length > 0) {
  console.log("\n--- Other category (allowed, not in sitemap) ---");
  for (const o of other) {
    console.log(`${o.id}\t${o.categories}\t${o.name}`);
  }
}

const bySlug = new Map();
for (const o of allowed) {
  bySlug.set(o.categorySlug, (bySlug.get(o.categorySlug) ?? 0) + 1);
}
console.log("\n--- Allowed by category_slug ---");
for (const [slug, count] of [...bySlug.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${slug.padEnd(22)} ${count}`);
}

console.log("\n--- Sitemap eligible ---");
for (const o of sitemapEligible) {
  console.log(`${o.id}\t${o.categorySlug}\t${o.name}`);
}
