/**
 * Smoke test: HU product meta description uses Hungarian price phrasing.
 * Run: npm run test:seo-meta-cz
 */
import { buildProductDescription } from "../src/lib/seo-meta.ts";

const BG_LEAK = [/\bОт\s/i, /\bЦена\s/i, /\bот\s+\d/i];
const RO_LEAK = [/\bDe la\s+\d/i, /\bPre[tț]\s+/i, /\bOd\s+\d/i, /\bCena\s+/i];

const cases = [
  {
    name: "hearing priced slot 0",
    input: {
      brand: "Benaga Chaga — halláskapszulák",
      feedBrand: "Benaga",
      categorySlug: "sluch",
      priceEUR: 49,
      aiBenefit: "A hallás funkció támogatására",
      variantSeed: 19776,
    },
  },
  {
    name: "hemorrhoids priced slot 1",
    input: {
      brand: "Cordyceps Pulse — aranyér kapszulák",
      feedBrand: "Cordyceps",
      categorySlug: "hemoroidy",
      priceEUR: 49,
      aiBenefit: "Belsőleges alkalmazásra aranyér esetén",
      variantSeed: 21980,
    },
  },
  {
    name: "hair-care priced slot 2",
    input: {
      brand: "Verdexedil — hajspray",
      feedBrand: "Verdexedil",
      categorySlug: "vypadavani-vlasu",
      priceEUR: 59,
      aiBenefit: "Teljes és egészséges hajért",
      variantSeed: 39737,
    },
  },
  {
    name: "potence-libido priced slot 3",
    input: {
      brand: "Rhino Gold Gel — gél",
      feedBrand: "Rhino",
      categorySlug: "potence",
      priceEUR: 39,
      aiBenefit: "Külsőleges alkalmazásra",
      variantSeed: 28586,
    },
  },
];

let failed = 0;

for (const { name, input } of cases) {
  const desc = buildProductDescription(input, "hu");
  const bgLeaks = BG_LEAK.filter((re) => re.test(desc)).map((re) => re.source);
  const roLeaks = RO_LEAK.filter((re) => re.test(desc)).map((re) => re.source);
  const leaks = [...bgLeaks, ...roLeaks];
  if (leaks.length) {
    console.error(`FAIL ${name}: locale leak in meta — ${desc.slice(0, 120)}`);
    console.error(`  patterns: ${leaks.join(", ")}`);
    failed += 1;
    continue;
  }
  if (input.priceEUR && !/Ft(-tól)?/i.test(desc)) {
    console.error(`FAIL ${name}: expected Hungarian price (Ft) in meta — ${desc.slice(0, 120)}`);
    failed += 1;
    continue;
  }
  console.log(`OK   ${name}: ${desc.slice(0, 100)}…`);
}

if (failed) {
  console.error(`\ntest-seo-meta-hu: ${failed} failure(s)`);
  process.exit(1);
}
console.log("\ntest-seo-meta-hu: OK");
