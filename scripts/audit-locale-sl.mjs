/**
 * Audit SL locale templates for Spanish/Italian markers and hardcoded wrong lang.
 * Run: node scripts/audit-locale-sl.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = [
  "src/lib/content.sl.ts",
  "src/lib/niche-content.sl.ts",
  "src/lib/i18n.sl.ts",
  "src/lib/legal.sl.ts",
  "src/lib/category-descriptors.sl.ts",
  "src/data/review-templates-cat.sl.ts",
  "src/data/review-templates-niche.sl.ts",
  "src/data/review-templates-slug.sl.ts",
  "src/data/review-templates-theme.sl.ts",
  "src/lib/pdp-variants.ts",
  "src/lib/pdp-html-variants.ts",
  "src/lib/delivery-eta.ts",
  "src/components/ProductSpecs.tsx",
  "src/lib/reviews.ts",
  "src/lib/seo-alt.ts",
  "src/lib/product-structured-data.ts",
  "src/routes/__root.tsx",
  "src/routes/index.tsx",
  "src/routes/category.index.tsx",
  "src/routes/category.$slug.tsx",
  "src/routes/medical-expert.tsx",
  "src/components/StickyMobileCta.tsx",
  "src/components/PromoModal.tsx",
  "src/components/Header.tsx",
  "src/lib/seo-meta.ts",
  "src/lib/shelf-disambiguation.sl.ts",
];

const ES_MARKERS =
  /\b(España|español|mensajería|contrassegno|corriere|¿|¡|Pedido|envío|Información|Pagamento alla|Consegna entro|Ordina oggi|Verificato|Consulente|Opiniones Top|Características|Especificaciones|Asesor médico|Actualizado|Inicio|Aviso importante|Proceso de revisión|Retrato de|compra online|envase|Recomendado hoy|oferta especial|pago contra reembolso|Garantía|mensajería express|selección de productos|catálogo)\b/i;
const IT_MARKERS =
  /\b(Italia|contrassegno|settimane|Informazioni|Spedizione|corriere|Offerta speciale|Solo oggi|Chiudi|Consegna e pagamento in Italia|Dott\.ssa|Descriptor da tradurre|Categoria:|Il brand)\b/i;
const CYRILLIC = /[\u0400-\u04FF]/;
const HARDCODED_ES = /["']es["']/;

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
    if (CYRILLIC.test(line) && !rel.includes("product-facts.sl-labels")) {
      failures.push(`${rel}:${i + 1} cyrillic: ${line.trim().slice(0, 120)}`);
    }
    if (ES_MARKERS.test(line)) {
      failures.push(`${rel}:${i + 1} ES marker: ${line.trim().slice(0, 120)}`);
    }
    if (IT_MARKERS.test(line)) {
      if (rel.includes("pdp-html-variants") && /Consegna e pagamento in Italia/.test(line)) continue;
      failures.push(`${rel}:${i + 1} IT marker: ${line.trim().slice(0, 120)}`);
    }
    if (
      (rel.includes("components/") || rel.includes("routes/")) &&
      HARDCODED_ES.test(line) &&
      !line.includes('lang === "es"') &&
      !line.includes("POOL_ES")
    ) {
      failures.push(`${rel}:${i + 1} hardcoded es: ${line.trim().slice(0, 120)}`);
    }
  }
}

if (failures.length) {
  console.error(`audit-locale-sl FAILED (${failures.length} issues):`);
  for (const f of failures.slice(0, 50)) console.error(" -", f);
  if (failures.length > 50) console.error(` ... and ${failures.length - 50} more`);
  process.exit(1);
}

console.log("audit-locale-sl OK —", TARGETS.length, "files checked");
