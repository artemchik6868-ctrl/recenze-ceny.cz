/**
 * One-off batch: fix resolved_category_slug + force regen for reported mis-shelves.
 * Usage: npx tsx scripts/regen-user-shelf-batch.ts [--dry-run]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OfferSource } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[m[1].trim()] = v;
}

const dryRun = process.argv.includes("--dry-run");

const SHELF_FIXES: Array<[OfferSource, number, string]> = [
  ["adcombo", 17979, "zahradni-naradi"],
  ["cpa_tl", 10790, "anti-aging"],
  ["cpa_tl", 1383, "anti-aging"],
  ["cpa_tl", 11630, "anti-aging"],
  ["adcombo", 5902, "kosmeticke-nastroje"],
  ["cpa_tl", 15476, "osobni-pece"],
  ["cpa_tl", 4106, "klouby"],
];

const REGEN_KEYS = [
  "adcombo:17979",
  "cpa_tl:10790",
  "cpa_tl:1383",
  "cpa_tl:11630",
  "cpa_tl:4106",
  "kma:11753",
  "adcombo:40588",
  "adcombo:39773",
  "cpa_tl:11666",
  "cpa_tl:11410",
  "shakes:13485",
  "shakes:11778",
  "shakes:8787",
  "cpa_tl:15476",
  "cpa_tl:19990",
  "cpa_tl:19056",
  "shakes:9177",
  "shakes:23124",
  "shakes:23123",
  "adcombo:5902",
  "cpa_tl:15476",
  "shakes:4191",
  "shakes:19990",
  "shakes:19056",
  "cpa_tl:13485",
  "cpa_tl:11778",
  "cpa_tl:8787",
  "cpa_tl:9177",
  "cpa_tl:23124",
  "cpa_tl:23123",
];

const { persistResolvedCategorySlug } = await import("../src/lib/catalog-shelf.server.ts");
const { getOrGenerateProductContent } = await import("../src/lib/ai-content.server.ts");
const { loadOffers } = await import("../src/lib/offers.server.ts");
const { resolveIntentListingSlug } = await import("../src/lib/catalog-shelf.ts");

for (const [src, id, slug] of SHELF_FIXES) {
  if (dryRun) {
    console.log(`DRY persist ${src}:${id} → ${slug}`);
    continue;
  }
  const saved = await persistResolvedCategorySlug(src, id, slug);
  console.log(`${saved ? "OK" : "FAIL"} persist ${src}:${id} → ${slug}`);
}

const offers = await loadOffers();
const byKey = new Map(offers.map((o) => [`${o.source}:${o.id}`, o]));

let ok = 0;
let fail = 0;
let skip = 0;

for (const key of REGEN_KEYS) {
  const offer = byKey.get(key);
  if (!offer) {
    console.log(`SKIP ${key} — not in catalog`);
    skip += 1;
    continue;
  }
  const slug = resolveIntentListingSlug({
    source: offer.source,
    offerId: offer.id,
    syncSlug: offer.categorySlug,
    rawTitle: offer.title || offer.brand || "",
    brand: offer.brand,
    feedText: offer.feedClassifyText,
  });
  console.log(`REGEN ${key} shelf=${slug} title=${(offer.title || "").slice(0, 50)}`);
  if (dryRun) {
    ok += 1;
    continue;
  }
  const out = await getOrGenerateProductContent(offer.source, offer.id, "uk", slug, {
    forceRegen: true,
  });
  if (out?.description_html && out.description_html.length >= 400) {
    ok += 1;
    console.log(`  OK   ${out.display_title?.slice(0, 70)} html=${out.description_html.length}`);
  } else {
    fail += 1;
    console.log(`  FAIL tier=${out?.content_tier ?? "null"}`);
  }
}

console.log(`\nDone — ok=${ok} fail=${fail} skip=${skip} dryRun=${dryRun}`);
