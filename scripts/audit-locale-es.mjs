/**
 * Audit ES locale templates for Italian/Ukrainian markers and hardcoded "it" lang.
 * Run: node scripts/audit-locale-es.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = [
  "src/lib/content.es.ts",
  "src/lib/niche-content.es.ts",
  "src/lib/ai-content.es-fallbacks.ts",
  "src/lib/ai-content.es-prompts.ts",
  "src/data/review-templates-cat.es.ts",
  "src/data/review-templates-niche.es.ts",
  "src/data/review-templates-slug.es.ts",
  "src/data/review-templates-theme.es.ts",
  "src/lib/pdp-variants.ts",
  "src/lib/delivery-eta.ts",
  "src/components/ProductSpecs.tsx",
  "src/lib/reviews.ts",
  "src/routes/__root.tsx",
  "src/routes/index.tsx",
  "src/routes/category.index.tsx",
  "src/components/StickyMobileCta.tsx",
  "src/components/PromoModal.tsx",
  "src/components/Header.tsx",
  "src/lib/seo-meta.ts",
];

const IT_MARKERS = /\b(Italia|contrassegno|settimane|Informazioni|Pagamento alla|corriere|Spedizione|Consegna entro|Ordina oggi|Specifiche|Verificato|Consulente)\b/i;
const CYRILLIC = /[\u0400-\u04FF]/;
const HARDCODED_IT = /["']it["']/;

const failures = [];

for (const rel of TARGETS) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    failures.push(`${rel}: file missing`);
    continue;
  }
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (CYRILLIC.test(line)) {
      failures.push(`${rel}:${i + 1} cyrillic: ${line.trim().slice(0, 120)}`);
    }
    if (IT_MARKERS.test(line)) {
      failures.push(`${rel}:${i + 1} IT marker: ${line.trim().slice(0, 120)}`);
    }
    if (
      (rel.includes("components/") || rel.includes("routes/")) &&
      HARDCODED_IT.test(line) &&
      !line.includes("lang === \"it\"") &&
      !line.includes("POOL_IT")
    ) {
      failures.push(`${rel}:${i + 1} hardcoded it: ${line.trim().slice(0, 120)}`);
    }
  }
}

if (failures.length) {
  console.error(`audit-locale-es FAILED (${failures.length} issues):`);
  for (const f of failures.slice(0, 50)) console.error(" -", f);
  if (failures.length > 50) console.error(` ... and ${failures.length - 50} more`);
  process.exit(1);
}

console.log("audit-locale-es OK —", TARGETS.length, "files checked");
