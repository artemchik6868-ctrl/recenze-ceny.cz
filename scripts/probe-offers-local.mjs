/** Local catalog probe: category slugs, sample URLs, FR in titles. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const { loadOffers, loadCategories } = await import("../src/lib/offers.server.ts");

const offers = await loadOffers();
const categories = await loadCategories();
console.log(`Offers: ${offers.length}, categories: ${categories.length}`);
console.log("Top categories:", categories.slice(0, 10).map((c) => `${c.slug}(${c.count})`));

const invalidSlug = offers.filter((o) => !/^[a-z0-9-]+$/.test(o.categorySlug));
console.log(`Invalid category slugs: ${invalidSlug.length}`);
for (const o of invalidSlug.slice(0, 5)) {
  console.log(`  ${o.source}:${o.id} cat=${JSON.stringify(o.categorySlug)} title=${o.title.slice(0, 60)}`);
}

const frTitles = offers.filter((o) => /\bFR\b/.test(o.displayTitle ?? o.title));
console.log(`\nFR in display/title: ${frTitles.length}`);
for (const o of frTitles.slice(0, 5)) {
  console.log(`  /${o.categorySlug}/${o.slug}`);
  console.log(`    title=${o.title} display=${o.displayTitle}`);
}

const sample = offers.filter((o) => o.categorySlug !== "other").slice(0, 5);
const base = process.argv[2] ?? "https://recenze-ceny.cz";
console.log(`\nHTTP probe (${base}):`);
for (const o of sample) {
  const url = `${base}/${o.categorySlug}/${o.slug}`;
  const res = await fetch(url);
  const html = await res.text();
  const h1 = [...html.matchAll(/<h1[^>]*>([^<]*)</gi)].map((m) => m[1].trim())[0] ?? "";
  console.log(`${res.status} ${url}`);
  if (h1) console.log(`  h1: ${h1.slice(0, 100)}`);
}
