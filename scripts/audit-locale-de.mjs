/**
 * Audit DE locale templates for PL/SL/IT markers.
 * Run: node scripts/audit-locale-cz.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = [
  "src/lib/content.de.ts",
  "src/lib/niche-content.de.ts",
  "src/lib/i18n.de.ts",
  "src/lib/legal.de.ts",
  "src/lib/category-descriptors.de.ts",
  "src/data/review-templates-cat.de.ts",
  "src/data/review-templates-niche.de.ts",
  "src/data/review-templates-slug.de.ts",
  "src/data/review-templates-theme.de.ts",
  "src/lib/pdp-variants.ts",
  "src/lib/pdp-html-variants.ts",
  "src/lib/delivery-eta.ts",
  "src/lib/ai-content.de-fallbacks.ts",
  "src/lib/product-facts.de-labels.ts",
  "src/components/ProductSpecs.tsx",
  "src/lib/reviews.ts",
  "src/lib/seo-alt.ts",
  "src/lib/product-structured-data.ts",
  "src/routes/__root.tsx",
  "src/routes/index.tsx",
  "src/routes/medical-expert.tsx",
  "src/lib/product-role.de.ts",
  "src/lib/shelf-disambiguation.de.ts",
  "src/lib/shelf-classification.examples.de.ts",
  "src/lib/leads.functions.ts",
  "src/lib/ai-content.server.ts",
  "src/lib/seo-meta.ts",
];

const BAD = [
  /\b(Polska|Polsce|zł|Expert Recenzje|expertrecenzje|Płatność|Warszawa|Ljubljana|Slovenij|Plačilo)\b/i,
  /\b(Dostawa|Usługa|Na terenie|kapsuł|kup online|opinie|po polsku)\b/i,
  /ą|ć|ę|ł|ń|ó|ś|ź|ż/i,
];

const SEO_META_PL = [/\bOd\s+\$\{/, /\bCena\s+\$\{/, /\b za \$\{/];

let issues = 0;
  for (const rel of TARGETS) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) continue;
  let text = fs.readFileSync(p, "utf8");
  text = text.replace(/export const DE_PLACEHOLDER_MARKERS = \[[\s\S]*?\];/g, "");
  for (const re of BAD) {
    const m = text.match(re);
    if (m) {
      console.log(`WARN ${rel}: ${m[0]}`);
      issues += 1;
    }
  }
  if (rel === "src/lib/seo-meta.ts") {
    for (const re of SEO_META_PL) {
      const m = text.match(re);
      if (m) {
        console.log(`WARN ${rel}: PL price template ${m[0]}`);
        issues += 1;
      }
    }
  }
}
if (issues) {
  console.log(`\naudit-locale-de: ${issues} potential leak(s)`);
  process.exitCode = 1;
} else {
  console.log("audit-locale-de: OK");
}
