/**
 * Export GSC query hints for meta/FAQ tuning (requires manual CSV merge).
 * Run: npx tsx scripts/export-gsc-queries.mjs [--site=https://recenze-ceny.cz]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = process.argv.find((a) => a.startsWith("--site="))?.split("=")[1] ?? "https://recenze-ceny.cz";
const outDir = path.join(ROOT, "reports");
const outFile = path.join(outDir, "gsc-export-template.json");

const template = {
  siteUrl: site,
  note: "Import Search Console CSV (Performance → Search results) and merge queries here for CTR/position feedback loop.",
  generatedAt: new Date().toISOString(),
  queries: [],
  actions: {
    lowCtrHighImpressions: "Rewrite meta_desc for URLs with impressions > 100 and CTR < 2%",
    position5to15: "Expand FAQ from actual queries; ensure primary keyword in first H2",
  },
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(template, null, 2), "utf8");
console.log(`Wrote ${outFile}`);
