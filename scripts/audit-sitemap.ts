/**
 * Compare live sitemap.xml with catalogue paths (same rules as sitemap route).
 *
 * Usage:
 *   npx tsx scripts/audit-sitemap.ts
 *   npx tsx scripts/audit-sitemap.ts --base=https://recenze-ceny.cz
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSitemapEntries } from "../src/lib/sitemap.server";
import { probeSitemapDeep } from "./lib/sitemap-probe.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  if (!(m[1].trim() in process.env) || process.env[m[1].trim()] === "") {
    process.env[m[1].trim()] = v;
  }
}

const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7) ??
  "https://recenze-ceny.cz";

async function expectedPaths(): Promise<{
  all: Set<string>;
  products: Set<string>;
}> {
  const entries = await buildSitemapEntries();
  const all = new Set(entries.map((e) => e.path));
  const products = new Set(
    entries
      .map((e) => e.path)
      .filter((p) => /^\/[^/]+\/[^/]+$/.test(p) && !p.startsWith("/category")),
  );
  return { all, products };
}

function toPathSet(locs: string[]): Set<string> {
  const out = new Set<string>();
  for (const loc of locs) {
    try {
      const u = new URL(loc);
      out.add(u.pathname.replace(/\/$/, "") || "/");
    } catch {
      /* skip bad loc */
    }
  }
  return out;
}

/** /sitemap.xml is a <sitemapindex> — collect page URLs across every shard. */
async function fetchSitemapPaths(): Promise<Set<string>> {
  const result = await probeSitemapDeep(base);
  if (!result.ok && result.pageUrls === 0) {
    console.error(`FAIL sitemap fetch ${result.status} (${result.reason})`);
    process.exit(1);
  }
  console.log(`Sitemap index: ${result.shards} shard(s)`);
  return toPathSet(result.locs);
}

const { all: expected, products: expectedProducts } = await expectedPaths();

console.log(`\n=== sitemap audit — base=${base} ===\n`);
console.log(`Expected URLs (sitemap.server rules): total=${expected.size} products=${expectedProducts.size}\n`);

const inSitemap = await fetchSitemapPaths();
const productInSitemap = [...inSitemap].filter((p) => /^\/[^/]+\/[^/]+/.test(p) && !p.startsWith("/category"));

const missing = [...expected].filter((p) => !inSitemap.has(p));
const extra = [...inSitemap].filter((p) => !expected.has(p));
const productMissing = [...expectedProducts].filter((p) => !inSitemap.has(p));
const productExtra = productInSitemap.filter((p) => !expectedProducts.has(p));

console.log(`Live sitemap: total=${inSitemap.size} product-like=${productInSitemap.length}`);
console.log(`Delta: missing=${missing.length} extra=${extra.length} product_missing=${productMissing.length} product_extra=${productExtra.length}`);

if (missing.length > 0) {
  console.log("\nMissing from sitemap (first 20):");
  for (const p of missing.slice(0, 20)) console.log(`  ${p}`);
}
if (extra.length > 0) {
  console.log("\nExtra in sitemap (first 20):");
  for (const p of extra.slice(0, 20)) console.log(`  ${p}`);
}

const ok = missing.length === 0 && extra.length === 0;
console.log(ok ? "\nOK sitemap matches catalogue rules." : "\nFAIL sitemap mismatch.");
process.exit(ok ? 0 : 1);
