/**
 * Audit PL locale templates for SL/ES/IT markers and hardcoded wrong lang.
 * Run: node scripts/audit-locale-pl.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = [
  "src/lib/content.pl.ts",
  "src/lib/niche-content.pl.ts",
  "src/lib/i18n.pl.ts",
  "src/lib/legal.pl.ts",
  "src/lib/category-descriptors.pl.ts",
  "src/data/review-templates-cat.pl.ts",
  "src/data/review-templates-niche.pl.ts",
  "src/data/review-templates-slug.pl.ts",
  "src/data/review-templates-theme.pl.ts",
  "src/lib/pdp-variants.ts",
  "src/lib/pdp-html-variants.ts",
  "src/lib/delivery-eta.ts",
  "src/lib/ai-content.pl-fallbacks.ts",
  "src/lib/product-facts.pl-labels.ts",
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
  "src/lib/shelf-disambiguation.pl.ts",
];

const ES_MARKERS =
  /\b(España|español|mensajería|contrassegno|corriere|¿|¡|Pedido|envío|Información|Pagamento alla|Consegna entro|Ordina oggi|Verificato|Consulente|Opiniones Top|Características|Especificaciones|Asesor médico|Actualizado|Inicio|Aviso importante|Proceso de revisión|Retrato de|compra online|envase|Recomendado hoy|oferta especial|pago contra reembolso|Garantía|mensajería express|selección de productos|catálogo)\b/i;
const IT_MARKERS =
  /\b(Italia|contrassegno|settimane|Informazioni|Spedizione|corriere|Offerta speciale|Solo oggi|Chiudi|Consegna e pagamento in Italia|Dott\.ssa|Descriptor da tradurre|Categoria:|Il brand|Servizio temporaneamente|Offerta non trovata|Errore di rete)\b/i;
const SL_MARKERS =
  /\b(Ljubljana|Maribor|Slovenij|Plačilo ob prevzemu|Naročite|izdelek|Informacije o|naravno dopolnilo|po vsej Sloveniji|Zakaj izbrati ta izdelek|kozmetični izdelek|dopolnilo za)\b/i;
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
    if (line.trim().startsWith("//")) continue;
    if (CYRILLIC.test(line) && !rel.includes("product-facts.pl-labels")) {
      failures.push(`${rel}:${i + 1} cyrillic: ${line.trim().slice(0, 120)}`);
    }
    if (ES_MARKERS.test(line)) {
      failures.push(`${rel}:${i + 1} ES marker: ${line.trim().slice(0, 120)}`);
    }
    if (IT_MARKERS.test(line)) {
      if (rel.includes("pdp-html-variants") && /Consegna e pagamento in Italia/.test(line)) continue;
      failures.push(`${rel}:${i + 1} IT marker: ${line.trim().slice(0, 120)}`);
    }
    if (SL_MARKERS.test(line)) {
      failures.push(`${rel}:${i + 1} SL marker: ${line.trim().slice(0, 120)}`);
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
  console.error(`audit-locale-pl FAILED (${failures.length} issues):`);
  for (const f of failures.slice(0, 50)) console.error(" -", f);
  if (failures.length > 50) console.error(` ... and ${failures.length - 50} more`);
  process.exit(1);
}

console.log("audit-locale-pl OK —", TARGETS.length, "files checked");
