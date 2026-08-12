/**
 * Production smoke test for SI storefront (recenze-ceny.cz).
 * Usage: node scripts/smoke-test.mjs [--base=https://recenze-ceny.cz]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { MIN_PAGE_URLS, probeSitemapDeep } from "./lib/sitemap-probe.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let indexNowPath = "/15a9670fbe765eb04766383e1349d0a9.txt";
const envPath = resolve(root, ".env");
if (existsSync(envPath)) {
  const m = readFileSync(envPath, "utf8").match(/^INDEXNOW_KEY=(.+)$/m);
  if (m?.[1]) indexNowPath = `/${m[1].trim()}.txt`;
}

const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7)?.replace(/\/$/, "") ??
  "https://recenze-ceny.cz";

const paths = [
  "/",
  "/category",
  "/sitemap.xml",
  "/favicon.png",
  "/favicon.ico",
  indexNowPath,
  "/about",
  "/faq",
  "/medical-expert",
];

const IT_HTML_MARKERS = [
  "contrassegno",
  "corriere",
  "integratore",
  "è un complemento",
  "La formula agisce",
  "Ordina oggi",
  "Pagamento alla",
];

let failed = 0;

function isBadResponse(res, body, path) {
  if (path === "/sitemap.xml") {
    return (
      res.status < 200 ||
      res.status >= 400 ||
      !(body.includes("<sitemapindex") || body.includes("<urlset")) ||
      body.includes("Something went wrong")
    );
  }
  return (
    res.status < 200 ||
    res.status >= 400 ||
    body.includes("Something went wrong") ||
    body.includes("Missing Supabase")
  );
}

const RESERVED_FIRST = new Set([
  "category",
  "product",
  "about",
  "faq",
  "terms",
  "privacy",
  "contact",
  "delivery",
  "payment",
  "returns",
  "medical-expert",
  "sluzby",
  "pruvodce",
  "ghid",
  "clanky",
  "api",
  "sitemap.xml",
  "favicon.png",
  "favicon.ico",
]);

function isCategoryHubPath(p) {
  const clean = p.replace(/\/$/, "") || "/";
  const m = clean.match(/^\/([^/]+)$/);
  if (!m) return false;
  return !RESERVED_FIRST.has(m[1]);
}

/** Deep probe: page URLs live in shards under the sitemapindex. */
const sitemapProbe = await probeSitemapDeep(base);
const sitemapLocs = sitemapProbe.locs;
for (const loc of sitemapLocs) {
  let p;
  try {
    p = new URL(loc).pathname.replace(/\/$/, "") || "/";
  } catch {
    continue;
  }
  if (!isCategoryHubPath(p)) continue;
  if (!paths.includes(p)) paths.splice(2, 0, p);
  if (paths.filter(isCategoryHubPath).length >= 2) break;
}

for (const path of paths) {
  const url = `${base}${path}`;
  const res = await fetch(url, { redirect: "manual" });
  const body = await res.text();
  const bad = isBadResponse(res, body, path);
  if (bad) {
    failed++;
    console.log(`FAIL ${res.status} ${path}`);
  } else {
    const itLeak = IT_HTML_MARKERS.filter((x) => body.includes(x));
    if (itLeak.length && (path === "/category" || isCategoryHubPath(path))) {
      failed++;
      console.log(`FAIL ${path} IT markers: ${itLeak.join(", ")}`);
    } else {
      console.log(`OK   ${res.status} ${path}`);
    }
  }
}

const urlCount = sitemapLocs.length;
if (!sitemapProbe.ok || urlCount < MIN_PAGE_URLS) {
  console.log(
    `FAIL sitemap url count ${urlCount} (${sitemapProbe.reason}; expected at least ${MIN_PAGE_URLS} page URLs across shards)`,
  );
  failed++;
} else if (urlCount < 100) {
  console.log(`WARN sitemap url count ${urlCount} across ${sitemapProbe.shards} shard(s) (grows after AI content-drain)`);
} else {
  console.log(`OK   sitemap contains ${urlCount} URLs across ${sitemapProbe.shards} shard(s)`);
}

const productLoc = sitemapLocs.find((loc) => {
  try {
    return /\/[^/]+\/[^/]+-g\d+\/?$/.test(new URL(loc).pathname);
  } catch {
    return false;
  }
});
const productPath = productLoc
  ? (() => {
      try {
        return new URL(productLoc).pathname.replace(/\/$/, "") || null;
      } catch {
        return null;
      }
    })()
  : null;
if (productPath) {
  const res = await fetch(`${base}${productPath}`, { redirect: "manual" });
  const body = await res.text();
  const bad =
    res.status !== 200 ||
    body.includes("Something went wrong") ||
    body.includes("Missing Supabase");
  console.log(`${bad ? "FAIL" : "OK  "} ${res.status} ${productPath} (from sitemap)`);
  if (bad) failed++;

  const idMatch = productPath.match(/-g(\d+)$/);
  if (idMatch) {
    const legacyPathFixed = productPath.replace(/\/[^/]+$/, `/legacy-slug-g${idMatch[1]}`);
    const legacyRes = await fetch(`${base}${legacyPathFixed}`, { redirect: "manual" });
    const legacyLocation = legacyRes.headers.get("location") ?? "";
    const legacyOk =
      legacyRes.status === 200 ||
      ((legacyRes.status === 301 || legacyRes.status === 302) &&
        legacyLocation.includes(`-g${idMatch[1]}`));
    if (!legacyOk) {
      const legacyBody = await legacyRes.text();
      if (
        legacyRes.status !== 200 ||
        legacyBody.includes("Something went wrong") ||
        legacyBody.includes("Missing Supabase")
      ) {
        console.log(`FAIL ${legacyRes.status} ${legacyPathFixed} (id fallback)`);
        failed++;
      }
    } else {
      console.log(
        `OK   ${legacyRes.status} ${legacyPathFixed} (id fallback → ${legacyLocation || "200"})`,
      );
    }
  }
} else {
  console.log("WARN no product URL in sitemap yet (run sync:drain until content exists)");
}

const wwwRes = await fetch("https://www.recenze-ceny.cz/", { redirect: "manual" });
if (wwwRes.status === 301 || wwwRes.status === 302) {
  console.log(`OK   ${wwwRes.status} www redirect → ${wwwRes.headers.get("location")}`);
} else {
  console.log(`WARN ${wwwRes.status} www (add Custom Domain in Cloudflare Dashboard)`);
}

const homeRes = await fetch(`${base}/`);
const homeBody = await homeRes.text();
if (
  homeBody.includes('"SI"') ||
  homeBody.includes("sl-SI") ||
  homeBody.includes("areaServed") ||
  homeBody.includes("Najbolj")
) {
  console.log("OK   home has SI locale/branding markers");
} else {
  console.log("FAIL home missing SI badge/schema markers");
  failed++;
}

process.exit(failed > 0 ? 1 : 0);
