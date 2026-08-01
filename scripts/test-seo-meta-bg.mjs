/**
 * Smoke test: BG product meta description must not contain RO/PL price prefixes.
 * Run: npm run test:seo-meta-cz
 */
import { buildProductDescription } from "../src/lib/seo-meta.ts";

const RO_LEAK = [/\bDe la\s+\d/i, /\bPre[tț]\s+/i, /\bOd\s+\d/i, /\bCena\s+/i];

const cases = [
  {
    name: "hearing priced slot 0",
    input: {
      brand: "Benaga Chaga — капсули за слуха",
      feedBrand: "Benaga",
      categorySlug: "sluch",
      priceEUR: 49,
      aiBenefit: "За подкрепа на слуховата функция",
      variantSeed: 19776,
    },
  },
  {
    name: "intimate-comfort priced slot 1",
    input: {
      brand: "Cordyceps Pulse — капсули при хемороиди",
      feedBrand: "Cordyceps",
      categorySlug: "intimate-comfort",
      priceEUR: 49,
      aiBenefit: "Продукт за вътрешно приложение при хемороиди",
      variantSeed: 21980,
    },
  },
  {
    name: "hair-care priced slot 2",
    input: {
      brand: "Verdexedil — спрей за коса",
      feedBrand: "Verdexedil",
      categorySlug: "vypadavani-vlasu",
      priceEUR: 59,
      aiBenefit: "За пълна и здрава коса",
      variantSeed: 39737,
    },
  },
  {
    name: "penis-enlargement priced slot 3",
    input: {
      brand: "Rhino Gold Gel — гел",
      feedBrand: "Rhino",
      categorySlug: "zvetseni-penisu",
      priceEUR: 39,
      aiBenefit: "За външно приложение",
      variantSeed: 28586,
    },
  },
];

let failed = 0;

for (const { name, input } of cases) {
  const desc = buildProductDescription(input, "bg");
  const leaks = RO_LEAK.filter((re) => re.test(desc)).map((re) => re.source);
  if (leaks.length) {
    console.error(`FAIL ${name}: locale leak in meta — ${desc.slice(0, 120)}`);
    console.error(`  patterns: ${leaks.join(", ")}`);
    failed += 1;
    continue;
  }
  if (!/\b(От|Цена|от)\s/i.test(desc) && input.priceEUR) {
    console.warn(`WARN ${name}: no BG price prefix (may be no-price slot): ${desc.slice(0, 100)}`);
  }
  console.log(`OK   ${name}: ${desc.slice(0, 100)}…`);
}

if (failed) {
  console.error(`\ntest-seo-meta-bg: ${failed} failure(s)`);
  process.exit(1);
}
console.log("\ntest-seo-meta-bg: OK");
