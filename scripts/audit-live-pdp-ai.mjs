/**
 * Crawl live PDP URLs from sitemap and detect template vs AI body HTML.
 *
 * Template marker: <h2>Informații despre produs: …</h2> (no LLM body).
 * AI heuristic: no template marker and >= 4 <h2> tags in product description area.
 *
 * Usage:
 *   node scripts/audit-live-pdp-ai.mjs
 *   node scripts/audit-live-pdp-ai.mjs --base=https://recenze-ceny.cz --limit=50 --concurrency=5
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function argValue(flag, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`${flag}=`));
  return hit ? hit.slice(flag.length + 1) : fallback;
}

const base = argValue("--base", "https://recenze-ceny.cz").replace(/\/$/, "");
const limit = Number(argValue("--limit", "0"));
const concurrency = Math.max(1, Number(argValue("--concurrency", "5")));
const pathsFile = argValue("--paths-file", "");

const TEMPLATE_H2_RE = /<h2[^>]*>\s*Informații despre produs\s*:/i;
const PRODUCT_PATH_RE = /^\/[^/]+\/[^/]+$/;

function parseProductPaths(xml) {
  const paths = [];
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      const u = new URL(m[1]);
      const path = u.pathname.replace(/\/$/, "") || "/";
      if (PRODUCT_PATH_RE.test(path) && !path.startsWith("/category")) {
        paths.push(path);
      }
    } catch {
      /* skip */
    }
  }
  return [...new Set(paths)];
}

function classifyHtml(html) {
  const h2Count = (html.match(/<h2[\s>]/gi) ?? []).length;
  const hasTemplate = TEMPLATE_H2_RE.test(html);
  const hasNoindex = /name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);

  if (hasTemplate) {
    return { kind: "template", h2Count, hasNoindex };
  }
  if (h2Count >= 4) {
    return { kind: "ai", h2Count, hasNoindex };
  }
  if (h2Count > 0) {
    return { kind: "thin", h2Count, hasNoindex };
  }
  return { kind: "unknown", h2Count, hasNoindex };
}

async function fetchPath(path) {
  const url = `${base}${path}`;
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "RecenziiProduseAudit/1.0 (+audit-live-pdp-ai)" },
    signal: AbortSignal.timeout(90_000),
  });
  const html = await res.text();
  if (res.status < 200 || res.status >= 400) {
    return { path, url, status: res.status, kind: "error", error: `HTTP ${res.status}`, h2Count: 0, hasNoindex: false };
  }
  return { path, url, status: res.status, ...classifyHtml(html) };
}

async function runPool(items, workerCount, fn) {
  const results = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(workerCount, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      const item = items[idx];
      try {
        results[idx] = await fn(item);
      } catch (err) {
        results[idx] = {
          path: item,
          url: `${base}${item}`,
          status: 0,
          kind: "error",
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

console.log(`\n=== audit-live-pdp-ai base=${base} concurrency=${concurrency} ===\n`);

const sitemapRes = await fetch(`${base}/sitemap.xml`, { signal: AbortSignal.timeout(60_000) });
const xml = await sitemapRes.text();
if (!sitemapRes.ok || !xml.includes("<urlset")) {
  console.error(`FAIL sitemap ${sitemapRes.status}`);
  process.exit(1);
}

let paths = parseProductPaths(xml);
console.log(`Sitemap product URLs: ${paths.length}`);
if (pathsFile) {
  const custom = JSON.parse(readFileSync(resolve(root, pathsFile), "utf8"));
  paths = custom.map((p) => (p.startsWith("/") ? p : `/${p}`));
  console.log(`Using --paths-file: ${paths.length} paths`);
}
if (limit > 0) paths = paths.slice(0, limit);

const started = Date.now();
const rows = await runPool(paths, concurrency, fetchPath);
const elapsed = Date.now() - started;

const byKind = { ai: [], template: [], thin: [], unknown: [], error: [] };
for (const r of rows) {
  const bucket = byKind[r.kind] ?? byKind.unknown;
  bucket.push(r);
}

console.log(`Crawled ${rows.length} PDPs in ${elapsed}ms`);
console.log(`  ai=${byKind.ai.length} template=${byKind.template.length} thin=${byKind.thin.length} unknown=${byKind.unknown.length} error=${byKind.error.length}`);

if (byKind.template.length) {
  console.log("\nTemplate PDPs (first 30):");
  for (const r of byKind.template.slice(0, 30)) {
    console.log(`  ${r.status} ${r.path} h2=${r.h2Count}${r.hasNoindex ? " noindex" : ""}`);
  }
}
if (byKind.thin.length) {
  console.log("\nThin PDPs (first 20):");
  for (const r of byKind.thin.slice(0, 20)) {
    console.log(`  ${r.status} ${r.path} h2=${r.h2Count}`);
  }
}
if (byKind.error.length) {
  console.log("\nErrors (first 10):");
  for (const r of byKind.error.slice(0, 10)) {
    console.log(`  ${r.path} ${r.error}`);
  }
}

const report = {
  at: new Date().toISOString(),
  base,
  sitemap_product_urls: parseProductPaths(xml).length,
  crawled: rows.length,
  elapsed_ms: elapsed,
  counts: {
    ai: byKind.ai.length,
    template: byKind.template.length,
    thin: byKind.thin.length,
    unknown: byKind.unknown.length,
    error: byKind.error.length,
  },
  template_urls: byKind.template.map((r) => r.url),
  thin_urls: byKind.thin.map((r) => r.url),
  error_urls: byKind.error.map((r) => ({ url: r.url, error: r.error })),
};

const cacheDir = resolve(root, "scripts/.cache");
mkdirSync(cacheDir, { recursive: true });
const outPath = resolve(cacheDir, `audit-live-pdp-ai-${new Date().toISOString().slice(0, 10)}.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`\nReport: ${outPath}`);

const ok = byKind.template.length === 0 && byKind.error.length === 0;
process.exit(ok ? 0 : 1);
