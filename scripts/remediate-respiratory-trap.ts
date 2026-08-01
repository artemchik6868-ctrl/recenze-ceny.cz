/**
 * Move misclassified respiratory-health listings to correct shelves + optional regen.
 *
 * Usage:
 *   npx tsx scripts/remediate-respiratory-trap.ts --dry-run
 *   npx tsx scripts/remediate-respiratory-trap.ts --persist
 *   npx tsx scripts/remediate-respiratory-trap.ts --regen-only
 *   npx tsx scripts/remediate-respiratory-trap.ts --dry-run --source=shakes
 */
import {
  computeShelfAuditRow,
  loadEnvFromDotenv,
  loadPartnerRaw,
  remediateTargetSlug,
} from "./lib/shelf-audit-de";
import { loadResolvedCategoryMap, persistResolvedCategorySlug } from "../src/lib/catalog-shelf.server";
import type { OfferSource } from "../src/lib/types";

loadEnvFromDotenv();

const dryRun = process.argv.includes("--dry-run") || (!process.argv.includes("--persist") && !process.argv.includes("--regen-only"));
const regenAfter = process.argv.includes("--regen") || process.argv.includes("--regen-only");
const regenOnly = process.argv.includes("--regen-only");
const sourceArg = process.argv.find((a) => a.startsWith("--source="));
const filterSource = sourceArg ? (sourceArg.slice(9) as OfferSource) : null;

const { loadOffers } = await import("../src/lib/offers.server.ts");
const { getOrGenerateProductContent } = await import("../src/lib/ai-content.server.ts");

const offers = await loadOffers();
const resolvedMap = await loadResolvedCategoryMap();

const respiratoryKeys = new Set<string>();
for (const o of offers) {
  if (o.categorySlug === "dychaci-cesty") {
    respiratoryKeys.add(`${o.source}:${o.id}`);
  }
}
for (const [key, slug] of resolvedMap.entries()) {
  if (slug === "dychaci-cesty") respiratoryKeys.add(key);
}

let candidates = offers.filter((o) => respiratoryKeys.has(`${o.source}:${o.id}`));
if (regenOnly) {
  candidates = offers.filter(
    (o) =>
      /atemwege/i.test(o.displayTitle ?? "") &&
      o.categorySlug !== "dychaci-cesty",
  );
}
if (filterSource) candidates = candidates.filter((o) => o.source === filterSource);

console.log(
  `\n=== remediate-respiratory-trap — ${candidates.length} offers (dryRun=${dryRun} regen=${regenAfter}) ===\n`,
);

let move = 0;
let skip = 0;
let review = 0;
const regenTargets: Array<{ source: OfferSource; id: number; slug: string }> = [];

for (const o of regenOnly ? candidates : []) {
  regenTargets.push({ source: o.source, id: o.id, slug: o.categorySlug });
}

for (const o of candidates) {
  if (regenOnly) continue;
  const raw = await loadPartnerRaw(o.source, o.id);
  const row = computeShelfAuditRow(o, raw, resolvedMap.get(`${o.source}:${o.id}`));
  const target =
    remediateTargetSlug(row) ??
    (row.resolvedSlug === "dychaci-cesty" &&
    row.intentSlug &&
    row.intentSlug !== "dychaci-cesty"
      ? row.intentSlug
      : row.resolvedSlug === "dychaci-cesty" &&
          row.listingSlug !== "dychaci-cesty" &&
          row.listingSlug !== "other"
        ? row.listingSlug
        : null);

  if (row.flags.includes("NEEDS_LANDING_REVIEW")) {
    review += 1;
    console.log(`REVIEW ${row.key} empty blob | ${row.rawTitle.slice(0, 50)}`);
    continue;
  }

  if (!target || target === "other") {
    skip += 1;
    if (row.flags.includes("TRUE_RESPIRATORY")) {
      console.log(`KEEP ${row.key} true respiratory | ${row.rawTitle.slice(0, 50)}`);
    }
    continue;
  }

  if (target === o.categorySlug && row.resolvedSlug === target) {
    skip += 1;
    continue;
  }

  move += 1;
  const line = `${row.key}  ${o.categorySlug} → ${target}  «${row.rawTitle.slice(0, 50)}»`;
  regenTargets.push({ source: o.source, id: o.id, slug: regenOnly ? o.categorySlug : target });

  if (regenOnly) {
    continue;
  }

  if (dryRun) {
    console.log(`DRY  ${line}`);
    continue;
  }

  const saved = await persistResolvedCategorySlug(o.source, o.id, target);
  console.log(saved ? `OK   ${line}` : `FAIL ${line}`);
}

console.log(`\nDone — move=${move} keep/skip=${skip} needs_review=${review} dryRun=${dryRun}`);

if (regenAfter && !dryRun && regenTargets.length > 0) {
  console.log(`\n=== regen remediated — ${regenTargets.length} offers ===\n`);
  let ok = 0;
  let fail = 0;
  for (const t of regenTargets) {
    const out = await getOrGenerateProductContent(t.source, t.id, "uk", t.slug, {
      forceRegen: true,
    });
    if (out?.description_html && out.description_html.length >= 400) {
      ok += 1;
      console.log(
        `OK   ${t.source}:${t.id} → ${t.slug} display=${out.display_title?.slice(0, 70)} html=${out.description_html.length}`,
      );
    } else {
      fail += 1;
      console.log(`FAIL ${t.source}:${t.id} tier=${out?.content_tier ?? "null"}`);
    }
  }
  console.log(`\nRegen done — ok=${ok} fail=${fail}`);
}
