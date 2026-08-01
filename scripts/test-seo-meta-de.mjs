/**
 * Smoke test: DE product meta description must not contain PL price prefixes.
 * Run: npx tsx scripts/test-seo-meta-de.mjs
 */
import { buildProductDescription } from "../src/lib/seo-meta.ts";

const PL_LEAK = [/\bOd\s+\d/i, /\bCena\s+/i, /\b za \d/i];

const cases = [
  {
    name: "hearing priced slot 0",
    input: {
      brand: "Benaga Chaga — Kapseln für das Gehör",
      feedBrand: "Benaga",
      categorySlug: "sluch",
      priceEUR: 49,
      aiBenefit: "Zur Unterstützung der Hörfunktion",
      variantSeed: 19776,
    },
  },
  {
    name: "intimate-comfort priced slot 1",
    input: {
      brand: "Cordyceps Pulse — Kapseln gegen Hämorrhoiden",
      feedBrand: "Cordyceps",
      categorySlug: "intimate-comfort",
      priceEUR: 49,
      aiBenefit: "Produkt zur inneren Anwendung bei Hämorrhoiden",
      variantSeed: 21980,
    },
  },
  {
    name: "hair-care priced slot 2",
    input: {
      brand: "Verdexedil — Haarspray",
      feedBrand: "Verdexedil",
      categorySlug: "vypadavani-vlasu",
      priceEUR: 59,
      aiBenefit: "Für volles und kräftiges Haar",
      variantSeed: 39737,
    },
  },
  {
    name: "penis-enlargement priced slot 3",
    input: {
      brand: "Rhino Gold Gel — Gel zur Penisvergrößerung",
      feedBrand: "Rhino",
      categorySlug: "zvetseni-penisu",
      priceEUR: 39,
      aiBenefit: "Für die äußere Anwendung",
      variantSeed: 28586,
    },
  },
];

let failed = 0;

for (const { name, input } of cases) {
  const desc = buildProductDescription(input, "de");
  const leaks = PL_LEAK.filter((re) => re.test(desc)).map((re) => re.source);
  if (leaks.length) {
    console.error(`FAIL ${name}: PL leak in meta — ${desc.slice(0, 120)}`);
    console.error(`  patterns: ${leaks.join(", ")}`);
    failed += 1;
    continue;
  }
  if (!/\b(Ab|Preis|ab)\s/i.test(desc) && input.priceEUR) {
    console.warn(`WARN ${name}: no DE price prefix (may be no-price slot): ${desc.slice(0, 100)}`);
  }
  console.log(`OK   ${name}: ${desc.slice(0, 100)}…`);
}

if (failed) {
  console.error(`\ntest-seo-meta-de: ${failed} failure(s)`);
  process.exit(1);
}
console.log("\ntest-seo-meta-de: OK");
