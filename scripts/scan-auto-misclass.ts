/** List auto-shelf offers that classify elsewhere. Usage: npx tsx scripts/scan-auto-misclass.ts */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyTitleFirst } from "../src/lib/classify";
import { categoryOffersFilterSlugs } from "../src/lib/offers.server";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const { loadOffers } = await import("../src/lib/offers.server.ts");
const offers = await loadOffers();
const autoSlugs = categoryOffersFilterSlugs("autodoplnky");
const onAuto = offers.filter((o) => autoSlugs.includes(o.categorySlug));

let mismatches = 0;
for (const o of onAuto) {
  const title = o.displayTitle || o.title || o.brand || "";
  const blob = String(o.categoryKey || o.categoryName || "");
  const got = classifyTitleFirst(title, blob, "other");
  if (!autoSlugs.includes(got) && got !== o.categorySlug) {
    mismatches += 1;
    console.log(`${o.source}:${o.id}  ${o.categorySlug} → ${got}  «${title.slice(0, 55)}»`);
  }
}
console.log(`\n${mismatches} misclassified on auto vitrina (title-first)`);
