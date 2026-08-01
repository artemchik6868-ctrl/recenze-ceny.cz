/**
 * Smoke test: CZ product meta description and title use Czech price phrasing.
 * Run: npm run test:seo-meta-cz
 */
import { buildProductDescription, buildProductTitle } from "../src/lib/seo-meta.ts";

const BG_LEAK = [/\bОт\s/i, /\bЦена\s/i, /\bот\s+\d/i];
const HU_LEAK = [
  /\bFt\b/i,
  /\bHUF\b/i,
  /\bFutárral\b/i,
  /\butánvétes\b/i,
  /\bSzállítás\b/i,
  /\bKc-tól\b/i,
  /\bvásároljon\b/i,
  /\bRendeljen\b/i,
  /\bČeská republikaon\b/i,
  /\begész Česká republika\b/i,
];

const cases = [
  {
    name: "hearing priced slot 0",
    input: {
      brand: "Benaga Chaga — sluchové kapsle",
      feedBrand: "Benaga",
      categorySlug: "sluch",
      priceEUR: 49,
      aiBenefit: "Pro podporu sluchových funkcí",
      variantSeed: 19776,
    },
  },
  {
    name: "hemorrhoids priced slot 1",
    input: {
      brand: "Cordyceps Pulse — hemoroidní kapsle",
      feedBrand: "Cordyceps",
      categorySlug: "hemoroidy",
      priceEUR: 49,
      aiBenefit: "Pro vnitřní použití při hemoroidech",
      variantSeed: 21980,
    },
  },
];

let fail = 0;
for (const c of cases) {
  const desc = buildProductDescription(c.input);
  const title = buildProductTitle(c.input);
  if (!desc || desc.length < 40) {
    console.log(`FAIL ${c.name}: desc too short`);
    fail += 1;
    continue;
  }
  if (!title || title.length < 10) {
    console.log(`FAIL ${c.name}: title too short`);
    fail += 1;
    continue;
  }
  for (const re of [...BG_LEAK, ...HU_LEAK]) {
    if (re.test(desc)) {
      console.log(`FAIL ${c.name}: desc leak ${re}`);
      fail += 1;
    }
    if (re.test(title)) {
      console.log(`FAIL ${c.name}: title leak ${re}`);
      fail += 1;
    }
  }
  if (!/Kč|CZK|od\s+\d/i.test(desc)) {
    console.log(`FAIL ${c.name}: missing CZK price phrasing — ${desc.slice(0, 80)}`);
    fail += 1;
  } else {
    console.log(`OK ${c.name}: ${title.slice(0, 60)}… | ${desc.slice(0, 60)}…`);
  }
}

if (fail) {
  console.log(`\ntest:seo-meta-cz: ${fail} failure(s)`);
  process.exit(1);
}
console.log("\ntest:seo-meta-cz: OK");
