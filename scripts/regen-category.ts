/**
 * Force-regen all offers on a category shelf.
 *
 * Usage:
 *   npx tsx scripts/regen-category.ts --slug=potence-libido --dry-run
 *   npx tsx scripts/regen-category.ts --slug=potence-libido --force-regen
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

const dryRun = process.argv.includes("--dry-run") || !process.argv.includes("--force-regen");
const slugArg = process.argv.find((a) => a.startsWith("--slug="));
const slug = slugArg?.slice(7) ?? "potence";

const { loadOffers } = await import("../src/lib/offers.server.ts");
const { getOrGenerateProductContent, PIPELINE_VERSION } = await import(
  "../src/lib/ai-content.server.ts"
);

const offers = await loadOffers().then((all) => all.filter((o) => o.categorySlug === slug));

console.log(
  `\n=== regen-category slug=${slug} — ${offers.length} offers (dryRun=${dryRun}) pipeline=${PIPELINE_VERSION} ===\n`,
);

let ok = 0;
let fail = 0;

for (const o of offers) {
  console.log(`REGEN ${o.source}:${o.id}  ${o.title.slice(0, 50)}`);
  if (dryRun) {
    ok += 1;
    continue;
  }
  const out = await getOrGenerateProductContent(o.source, o.id, "uk", slug, { forceRegen: true });
  if (out?.description_html && out.description_html.length >= 400) {
    ok += 1;
    console.log(`  OK   display=${out.display_title?.slice(0, 70)} html=${out.description_html.length}`);
  } else {
    fail += 1;
    console.log(`  FAIL tier=${out?.content_tier ?? "null"}`);
  }
}

console.log(`\nDone — ok=${ok} fail=${fail} dryRun=${dryRun}`);
