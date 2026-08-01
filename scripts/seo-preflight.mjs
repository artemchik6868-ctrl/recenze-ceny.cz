/**
 * SEO preflight — live checks for indexation readiness.
 * Usage: node scripts/seo-preflight.mjs [--base=https://recenze-ceny.cz]
 */
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7)?.replace(/\/$/, "") ||
  "https://recenze-ceny.cz";

const LOCALE_LEAKS = [
  "in der Česká republika",
  "Szybka dostawa",
  "Facharzt",
  "Dr. Thomas Müller",
  "Dr. Andrei Popescu",
  "Pagina no encontrada",
  "Відгуки на товари",
  'geo.region" content="CH"',
  '"applicableCountry": "RO"',
  '"addressCountry": "RO"',
  "Как да изберете",
  "Продукт",
  "доставка",
  "плащане",
  "Топ продукти",
  "termék",
  "oldalon",
  "Hogyan válasszon",
  "Minőséggarancia",
  "Szállítás és fizetés",
  "Legjobb termékek",
  "Útmutató: hogyan válasszon",
  "online vásárlás",
  "Mai ajánlás",
];

const PAGES = [
  "/",
  "/category",
  "/klouby",
  "/autodoplnky",
  "/product",
  "/about",
  "/medical-expert",
  "/faq",
  "/pruvodce/klouby",
];

let fail = 0;
const report = { base, checkedAt: new Date().toISOString(), checks: [] };

async function check(name, fn) {
  try {
    const result = await fn();
    report.checks.push({ name, ...result });
    if (!result.ok) {
      console.log(`FAIL ${name}: ${result.detail}`);
      fail += 1;
    } else {
      console.log(`OK   ${name}`);
    }
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    report.checks.push({ name, ok: false, detail });
    console.log(`FAIL ${name}: ${detail}`);
    fail += 1;
  }
}

/** Keep in sync with RESERVED_FIRST_SEGMENTS in src/lib/route-lang.ts */
const RESERVED_FIRST_SEGMENTS = new Set([
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
  "api",
]);

/** Product URL: /{categorySlug}/{brandSlug} — not /delivery/praha etc. */
function isProductPath(path) {
  const clean = path.replace(/\/$/, "") || "/";
  const m = clean.match(/^\/([^/]+)\/([^/]+)$/);
  if (!m) return false;
  return !RESERVED_FIRST_SEGMENTS.has(m[1]);
}

async function samplePdpPath() {
  const res = await fetch(`${base}/sitemap.xml`);
  if (!res.ok) return null;
  const text = await res.text();
  const locs = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const pdp = locs.find((url) => {
    try {
      const path = new URL(url).pathname;
      return isProductPath(path);
    } catch {
      return false;
    }
  });
  return pdp ? new URL(pdp).pathname : null;
}

await check("robots.txt", async () => {
  const res = await fetch(`${base}/robots.txt`);
  const text = await res.text();
  const ok =
    res.ok &&
    text.includes("Sitemap:") &&
    /Allow:\s*\//.test(text) &&
    /Disallow:\s*\/api\//.test(text);
  return {
    ok,
    status: res.status,
    detail: ok ? "allows crawl, blocks /api/" : "missing Allow, Sitemap, or Disallow: /api/",
  };
});

await check("sitemap.xml", async () => {
  const res = await fetch(`${base}/sitemap.xml`);
  const text = await res.text();
  const urlCount = (text.match(/<loc>/g) ?? []).length;
  const ok = res.ok && text.includes("<urlset") && urlCount >= 10;
  return {
    ok,
    status: res.status,
    urlCount,
    detail: ok ? `${urlCount} URLs` : `status=${res.status}, urls=${urlCount}`,
  };
});

const pdpPath = await samplePdpPath();
if (pdpPath) PAGES.push(pdpPath);

/** Visible page body — excludes scripts/styles with embedded feed JSON. */
function visibleBodyHtml(html) {
  const main = html.match(/<main\b[\s\S]*?<\/main>/i);
  const chunk = main ? main[0] : html;
  return chunk
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
}

function hasProductJsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of blocks) {
    try {
      const data = JSON.parse(m[1]);
      const nodes = data["@graph"] ?? [data];
      if (nodes.some((n) => n?.["@type"] === "Product")) return true;
    } catch {
      // ignore malformed blocks
    }
  }
  return false;
}

for (const path of PAGES) {
  await check(`page ${path}`, async () => {
    const res = await fetch(`${base}${path}`);
    const html = await res.text();
    const leaks = LOCALE_LEAKS.filter((m) => html.includes(m));
    const hasCanonical = /rel=["']canonical["']/i.test(html);
    const hasRobotsNoindex = /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html);
    const isPdp = isProductPath(path);
    const isGuide = path.startsWith("/pruvodce/");
    const hasCyrillic = isGuide && /[\u0400-\u04FF]/.test(visibleBodyHtml(html));
    const ok =
      res.ok &&
      leaks.length === 0 &&
      !hasCyrillic &&
      html.includes('lang="cs"') &&
      hasCanonical &&
      (!isPdp || !hasRobotsNoindex);
    return {
      ok,
      status: res.status,
      leaks,
      canonical: hasCanonical,
      noindex: hasRobotsNoindex,
      detail: !res.ok
        ? `HTTP ${res.status}`
        : leaks.length
          ? `locale/schema leaks: ${leaks.join(", ")}`
          : hasCyrillic
            ? "Cyrillic text on HU guide page"
          : !hasCanonical
            ? "missing canonical"
            : isPdp && hasRobotsNoindex
              ? "indexable PDP has noindex"
              : hasRobotsNoindex
                ? "noindex"
                : "OK",
    };
  });
}

await check("og-image.jpg", async () => {
  const res = await fetch(`${base}/og-image.jpg`, { method: "HEAD" });
  return { ok: res.ok, status: res.status, detail: res.ok ? "present" : "missing" };
});

await check("favicon.ico", async () => {
  const res = await fetch(`${base}/favicon.ico`, { method: "HEAD" });
  return { ok: res.ok, status: res.status, detail: res.ok ? "present" : "missing" };
});

if (pdpPath) {
  await check(`pdp json-ld ${pdpPath}`, async () => {
    const res = await fetch(`${base}${pdpPath}`);
    const html = await res.text();
    const hasProduct = hasProductJsonLd(html);
    const ok = res.ok && hasProduct;
    return {
      ok,
      status: res.status,
      detail: ok ? "Product schema present" : res.ok ? "missing Product JSON-LD" : `HTTP ${res.status}`,
    };
  });
}

console.log("\n--- GSC manual steps ---");
console.log("1. URL Inspection: /, /category, /joint-care, /medical-expert, one PDP");
console.log("2. Coverage → check Excluded reasons");
console.log("3. After deploy: Resubmit sitemap + Request Indexing for key URLs");
console.log("\n--- Off-page (new domain) ---");
console.log("4. Register on Czech Republicn business directories (ListaFirme, etc.)");
console.log("5. 5–10 quality backlinks: health forums, local listings — no PBN/spam");
console.log("6. Set VITE_GA4_ID + link GA4 property to GSC");
console.log("7. Configure GOOGLE_INDEXING_SA_JSON → npm run seo:indexers-backfill");
console.log(`\nseo-preflight: ${fail === 0 ? "OK" : `${fail} failure(s)`}`);
process.exit(fail > 0 ? 1 : 0);
