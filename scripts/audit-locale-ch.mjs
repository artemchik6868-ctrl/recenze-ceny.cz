/**
 * Audit CH locale templates for AT/DE/PL market leakage.
 * Run: npm run audit:locale-ch
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
  "src/lib/site.ts",
];

const BAD = [
  /\b(Österreich|Deutschland|Germany|Polska|Polen)\b/i,
  /\b(Partner DE|Lager DE|Shop DE|Vertrieb DE|aus DE-Lager|DE-Vertrieb|Online-Shop DE|Online-Mode-Shop DE)\b/i,
  /areaServed:\s*"DE"/,
  /applicableCountry:\s*"PL"/,
  /addressCountry:\s*"PL"/,
  /geo\.region.*content:\s*"DE"/,
  /geo\.placename.*content:\s*"Germany"/,
  /dr\.\s*Carmen Ruiz/i,
  /\b(erfahrungen-check\.de|Erfahrungen Check|meinungcheck\.at|Meinung Check)\b/i,
  /\b(Renngasse|1010 Wien|Eisenbahnstraße|10997 Berlin)\b/i,
];

const WARN_ONLY = [
  /\b(Polska|Polsce|zł|Expert Recenzje|Ljubljana|Slovenij|Plačilo)\b/i,
  /ą|ć|ę|ł|ń|ó|ś|ź|ż/i,
];

let issues = 0;
let warnings = 0;

for (const rel of TARGETS) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) continue;
  let text = fs.readFileSync(p, "utf8");
  text = text.replace(/export const DE_PLACEHOLDER_MARKERS = \[[\s\S]*?\];/g, "");
  for (const re of BAD) {
    const m = text.match(re);
    if (m) {
      console.log(`FAIL ${rel}: ${m[0]}`);
      issues += 1;
    }
  }
  for (const re of WARN_ONLY) {
    const m = text.match(re);
    if (m) {
      console.log(`WARN ${rel}: ${m[0]}`);
      warnings += 1;
    }
  }
}

if (issues) {
  console.log(`\naudit-locale-ch: ${issues} leak(s), ${warnings} warning(s)`);
  process.exitCode = 1;
} else {
  console.log(`audit-locale-ch: OK${warnings ? ` (${warnings} non-blocking warning(s))` : ""}`);
}
