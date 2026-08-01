/**
 * Persist manual shelf_slug overrides for misclassified SKUs.
 *
 * Usage: npx tsx scripts/fix-shelf-overrides.ts [--dry-run]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SHELF_OVERRIDES } from "../src/lib/catalog-shelf-overrides";
import { persistResolvedCategorySlug } from "../src/lib/catalog-shelf.server";

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
const { loadOffers } = await import("../src/lib/offers.server.ts");
const offers = await loadOffers();
const byKey = new Map(offers.map((o) => [`${o.source}:${o.id}`, o]));

console.log(`\n=== fix-shelf-overrides — ${Object.keys(SHELF_OVERRIDES).length} entries (dry=${dryRun}) ===\n`);

let ok = 0;
let skip = 0;

for (const [key, targetSlug] of Object.entries(SHELF_OVERRIDES)) {
  const offer = byKey.get(key);
  const current = offer?.categorySlug ?? "(missing)";
  if (!offer) {
    skip += 1;
    console.log(`SKIP ${key} — offer not in catalog`);
    continue;
  }
  if (current === targetSlug) {
    skip += 1;
    console.log(`OK   ${key} — already ${targetSlug}`);
    continue;
  }
  console.log(`FIX  ${key}: ${current} → ${targetSlug} (${offer.displayTitleUk || offer.title})`);
  if (dryRun) {
    ok += 1;
    continue;
  }
  const [source, idStr] = key.split(":");
  const saved = await persistResolvedCategorySlug(
    source as import("../src/lib/types").OfferSource,
    Number(idStr),
    targetSlug,
  );
  if (saved) ok += 1;
  else skip += 1;
}

console.log(`\nDone — fixed=${ok} skip=${skip}`);
