/**
 * Audit all offers currently listed under respiratory-health.
 *
 * Usage:
 *   npx tsx scripts/audit-respiratory-category.ts
 *   npx tsx scripts/audit-respiratory-category.ts --no-write
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  computeShelfAuditRow,
  loadEnvFromDotenv,
  loadPartnerRaw,
  type ShelfAuditRow,
} from "./lib/shelf-audit-de";
import { loadResolvedCategoryMap } from "../src/lib/catalog-shelf.server";

const root = loadEnvFromDotenv();
const writeFiles = !process.argv.includes("--no-write");

const { loadOffers } = await import("../src/lib/offers.server.ts");
const offers = await loadOffers();
const resolvedMap = await loadResolvedCategoryMap();

const respiratory = offers.filter((o) => o.categorySlug === "dychaci-cesty");
const rows: ShelfAuditRow[] = [];

for (const o of respiratory) {
  const raw = await loadPartnerRaw(o.source, o.id);
  rows.push(computeShelfAuditRow(o, raw, resolvedMap.get(`${o.source}:${o.id}`)));
}

const byExpected = new Map<string, number>();
for (const r of rows) {
  byExpected.set(r.expectedSlug, (byExpected.get(r.expectedSlug) ?? 0) + 1);
}

const summary = {
  respiratoryListingCount: rows.length,
  trueRespiratory: rows.filter((r) => r.flags.includes("TRUE_RESPIRATORY")).length,
  shouldMove: rows.filter((r) => r.flags.includes("RESPIRATORY_TRAP")).length,
  needsReview: rows.filter((r) => r.flags.includes("NEEDS_LANDING_REVIEW")).length,
  conflictCue: rows.filter((r) => r.flags.includes("RESPIRATORY_WITH_CONFLICT_CUE")).length,
  byExpected: Object.fromEntries([...byExpected.entries()].sort((a, b) => b[1] - a[1])),
};

console.log("\n=== audit-respiratory-category ===\n");
console.log(JSON.stringify(summary, null, 2));

console.log("\n--- should move (sample) ---");
for (const r of rows.filter((x) => x.flags.includes("RESPIRATORY_TRAP")).slice(0, 30)) {
  console.log(
    `${r.key} → ${r.expectedSlug} | ${r.rawTitle.slice(0, 40)} | blob: ${r.blob.slice(0, 60)}`,
  );
}

if (writeFiles) {
  const outDir = resolve(root, "scripts", ".cache");
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const jsonPath = resolve(outDir, `audit-respiratory-${stamp}.json`);
  writeFileSync(jsonPath, JSON.stringify({ summary, rows }, null, 2), "utf8");

  const csvLines = [
    "key,url,rawTitle,expectedSlug,listingSlug,resolvedSlug,displayTitle,blob,landings,flags",
    ...rows.map((r) =>
      [
        r.key,
        r.url,
        `"${r.rawTitle.replace(/"/g, '""')}"`,
        r.expectedSlug,
        r.currentListingSlug,
        r.resolvedSlug ?? "",
        `"${(r.displayTitle ?? "").replace(/"/g, '""')}"`,
        `"${r.blob.replace(/"/g, '""')}"`,
        `"${r.landings.replace(/"/g, '""')}"`,
        r.flags.join("|"),
      ].join(","),
    ),
  ];
  const csvPath = resolve(outDir, `audit-respiratory-${stamp}.csv`);
  writeFileSync(csvPath, csvLines.join("\n"), "utf8");
  console.log(`\nWrote ${jsonPath}`);
  console.log(`Wrote ${csvPath}`);
}
