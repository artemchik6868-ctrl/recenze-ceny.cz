/**
 * Bulk migrate resolved_category_slug from legacy shelf to canonical shelf.
 *
 * Usage:
 *   npx tsx scripts/migrate-shelf-slug.ts --from=potenz-libido --to=potence-libido --dry-run
 *   npx tsx scripts/migrate-shelf-slug.ts --from=potenz-libido --to=potence-libido --persist
 *   npx tsx scripts/migrate-shelf-slug.ts --from=mens-vitality --to=potence-libido --persist
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
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const dryRun = process.argv.includes("--dry-run") || !process.argv.includes("--persist");
const fromArg = process.argv.find((a) => a.startsWith("--from="));
const toArg = process.argv.find((a) => a.startsWith("--to="));
const fromSlug = fromArg?.slice(7) ?? "potenz-libido";
const toSlug = toArg?.slice(5) ?? "potence";

const { loadOffers } = await import("../src/lib/offers.server.ts");
const { loadResolvedCategoryMap, persistResolvedCategorySlug } = await import(
  "../src/lib/catalog-shelf.server.ts"
);

const offers = await loadOffers();
const resolvedMap = await loadResolvedCategoryMap();

const targets = offers.filter((o) => {
  const key = `${o.source}:${o.id}`;
  const resolved = resolvedMap.get(key);
  return o.categorySlug === fromSlug || resolved === fromSlug;
});

console.log(`\n=== migrate-shelf-slug ${fromSlug} → ${toSlug} — ${targets.length} offers (dryRun=${dryRun}) ===\n`);

let ok = 0;
for (const o of targets) {
  const line = `${o.source}:${o.id}  listing=${o.categorySlug} resolved=${resolvedMap.get(`${o.source}:${o.id}`) ?? "-"} → ${toSlug}`;
  if (dryRun) {
    console.log(`DRY  ${line}`);
    ok += 1;
    continue;
  }
  const saved = await persistResolvedCategorySlug(o.source as OfferSource, o.id, toSlug);
  console.log(saved ? `OK   ${line}` : `FAIL ${line}`);
  if (saved) ok += 1;
}

console.log(`\nDone — updated=${ok} dryRun=${dryRun}`);
