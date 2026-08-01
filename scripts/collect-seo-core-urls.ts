/**
 * Build a spot-check URL list for BG SEO-core live audit.
 * Uses the same sitemap rules as production (isProductIndexable).
 *
 * Run: npx tsx scripts/collect-seo-core-urls.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSitemapEntries } from "../src/lib/sitemap.server";

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

const BASE = process.env.SITE_URL ?? "https://recenze-ceny.cz";
const PRIORITY_CATEGORIES = [
  "potence",
  "klouby",
  "hemoroidy",
  "hubnuti",
  "cukrovka",
  "prostata",
];
const LEGAL = ["/about", "/faq", "/delivery", "/payment", "/medical-expert", "/privacy", "/terms"];

const entries = await buildSitemapEntries();
const paths = entries.map((e) => e.path);
const productPaths = paths.filter((p) => /^\/[^/]+\/[^/]+$/.test(p) && !p.startsWith("/category"));

const picked = new Set(["/", "/category", ...LEGAL]);

for (const slug of PRIORITY_CATEGORIES) {
  picked.add(`/${slug}`);
  picked.add(`/pruvodce/${slug}`);
}

const sampleByCategory = new Map<string, string>();
for (const p of productPaths) {
  const slug = p.split("/")[1]!;
  if (!sampleByCategory.has(slug)) sampleByCategory.set(slug, p);
}
for (const slug of PRIORITY_CATEGORIES) {
  const p = sampleByCategory.get(slug);
  if (p) picked.add(p);
}
for (const p of productPaths.slice(0, 3)) picked.add(p);

const urls = [...picked].sort().map((p) => `${BASE}${p}`);
const outPath = resolve(root, "scripts/seo-core-urls.bg.txt");
writeFileSync(outPath, `${urls.join("\n")}\n`, "utf8");

console.log(`Wrote ${urls.length} SEO-core URLs to ${outPath}`);
for (const u of urls) console.log(u);
