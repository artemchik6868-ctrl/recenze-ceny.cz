/**
 * Smoke tests for geo suffix stripping in brand-clean.
 * Usage: node scripts/test-brand-clean-cz.mjs
 */
import {
  normalizeProductTitle,
  cleanFeedTitleWithDescriptor,
  sanitizeDisplayTitle,
  extractLockedLatinBrand,
  stripDelimitedFeedMarkers,
  isTruncatedDisplayBrand,
  truncatedBrandReason,
  simulateLegacyGeoStripInBrand,
  splitBrandAndTail,
  extractEmbeddedLatinBrand,
} from "../src/lib/brand-clean.ts";
import { normalizeDescriptorTail } from "../src/lib/title-translate.cs.ts";

const cases = [
  { input: "Reishield DE", want: "Reishield" },
  { input: "Hondrofrost DE", want: "Hondrofrost" },
  { input: "Removio gel DE", want: "Removio gel" },
  { input: "Removio gel FR", want: "Removio gel" },
  { input: "W-Loss FR", want: "W-Loss" },
  { input: "Verdexedil EU LOW DE", want: "Verdexedil" },
  { input: "Smoke No More", want: "Smoke No More" },
  { input: "Smoke No More DE", want: "Smoke No More" },
  { input: "Toxic OFF", want: "Toxic OFF" },
  { input: "Epilage PRO RO", want: "Epilage PRO" },
  { input: "Epilage PRO", want: "Epilage PRO" },
];

const brandPreserveCases = [
  { input: "INSPICURE EU LOW", want: "INSPICURE" },
  { input: "UPLIFTMAX DE", want: "UPLIFTMAX" },
  { input: "PROSTALIS EU", want: "PROSTALIS" },
  { input: "GRAVITAL+ EU LOW", want: "GRAVITAL+" },
  { input: "EROPILLAR DE", want: "EROPILLAR" },
  { input: "PotentGuard (EU)", want: "PotentGuard" },
];

let failed = 0;

for (const { input, want } of brandPreserveCases) {
  const got = normalizeProductTitle(input);
  if (got !== want) {
    console.error(`FAIL brand preserve normalizeProductTitle("${input}") → "${got}" (expected "${want}")`);
    failed += 1;
  } else {
    console.log(`OK  brand preserve "${input}" → "${got}"`);
  }
}

for (const { input, want } of brandPreserveCases) {
  const got = stripDelimitedFeedMarkers(input);
  if (got !== want) {
    console.error(`FAIL stripDelimitedFeedMarkers("${input}") → "${got}" (expected "${want}")`);
    failed += 1;
  } else {
    console.log(`OK  delimited "${input}" → "${got}"`);
  }
}

const displayBrandCases = [
  { input: "INSPICURE — контрол на захарта", wantBrand: "INSPICURE" },
  { input: "PROSTALIS — капсули за простата", wantBrand: "PROSTALIS" },
  { input: "GRAVITAL+ — отслабване", wantBrand: "GRAVITAL+" },
];
for (const { input, wantBrand } of displayBrandCases) {
  const got = sanitizeDisplayTitle(input);
  const brand = got.split(/\s+[—–-]\s+/u)[0]?.trim() ?? got;
  if (brand !== wantBrand) {
    console.error(`FAIL sanitizeDisplayTitle brand("${input}") → "${brand}" (expected "${wantBrand}")`);
    failed += 1;
  } else {
    console.log(`OK  sanitize brand "${input}" → "${brand}"`);
  }
}

for (const { input, want } of cases) {
  const got = normalizeProductTitle(input);
  if (got !== want) {
    console.error(`FAIL normalizeProductTitle("${input}") → "${got}" (expected "${want}")`);
    failed += 1;
  } else {
    console.log(`OK  "${input}" → "${got}"`);
  }
}

const lockCases = [
  { input: "Smoke No More", want: "Smoke No More" },
  { input: "Smoke No More DE", want: "Smoke No More" },
  { input: "Toxic OFF", want: "Toxic OFF" },
  { input: "Hondrofrost DE", want: "Hondrofrost" },
  { input: "Epilage PRO RO", want: "Epilage PRO" },
  { input: "Epilage PRO", want: "Epilage PRO" },
];
for (const { input, want } of lockCases) {
  const got = extractLockedLatinBrand(input);
  if (got !== want) {
    console.error(`FAIL extractLockedLatinBrand("${input}") → "${got}" (expected "${want}")`);
    failed += 1;
  } else {
    console.log(`OK  lock "${input}" → "${got}"`);
  }
}

const feed = cleanFeedTitleWithDescriptor("Reishield DE");
if (feed !== "Reishield") {
  console.error(`FAIL cleanFeedTitleWithDescriptor("Reishield DE") → "${feed}"`);
  failed += 1;
} else {
  console.log(`OK  cleanFeedTitleWithDescriptor("Reishield DE") → "${feed}"`);
}

const ronSanitized = sanitizeDisplayTitle("Hondroine — 119 BGN");
if (ronSanitized !== "Hondroine") {
  console.error(`FAIL sanitizeDisplayTitle("Hondroine — 119 BGN") → "${ronSanitized}" (expected "Hondroine")`);
  failed += 1;
} else {
  console.log(`OK  sanitizeDisplayTitle("Hondroine — 119 BGN") → "${ronSanitized}"`);
}

const ronFeed = cleanFeedTitleWithDescriptor("Hondroine 119 BGN");
if (ronFeed !== "Hondroine") {
  console.error(`FAIL cleanFeedTitleWithDescriptor("Hondroine 119 BGN") → "${ronFeed}" (expected "Hondroine")`);
  failed += 1;
} else {
  console.log(`OK  cleanFeedTitleWithDescriptor("Hondroine 119 BGN") → "${ronFeed}"`);
}

const neuropathyFeed = cleanFeedTitleWithDescriptor("Cordyceps Pulse BG low - neuropathy");
if (neuropathyFeed !== "Cordyceps Pulse - neuropathy") {
  console.error(
    `FAIL cleanFeedTitleWithDescriptor("Cordyceps Pulse BG low - neuropathy") → "${neuropathyFeed}" (expected "Cordyceps Pulse - neuropathy")`,
  );
  failed += 1;
} else {
  console.log(`OK  cleanFeedTitleWithDescriptor("Cordyceps Pulse BG low - neuropathy") → "${neuropathyFeed}"`);
}

const flat = normalizeDescriptorTail("kapsle pro — cystitidu");
if (flat !== "kapsle pro cystitidu") {
  console.error(`FAIL normalizeDescriptorTail → "${flat}"`);
  failed += 1;
} else {
  console.log(`OK  normalizeDescriptorTail("kapsle pro — cystitidu") → "${flat}"`);
}

const smokeH1 = sanitizeDisplayTitle("Smoke No More — kapsle pro odvykání kouření");
if (!smokeH1.includes("Smoke No More") || /\bSmoke More\b/.test(smokeH1)) {
  console.error(`FAIL sanitizeDisplayTitle("Smoke No More — …") → "${smokeH1}"`);
  failed += 1;
} else {
  console.log(`OK  sanitizeDisplayTitle("Smoke No More — …") → "${smokeH1}"`);
}

const truncatedCases = [
  { actual: "P STALIS", feed: "PROSTALIS", title: "PROSTALIS EU", want: true },
  { actual: "G V AL+", feed: "GUAVITAL+", title: "GUAVITAL+ EU LOW", want: true },
  { actual: "E PILLAR", feed: "EROPILLAR", title: "EROPILLAR DE", want: true },
  { actual: "SPICURE", feed: "INSPICURE", title: "INSPICURE EU LOW", want: true },
  { actual: "IFTMAX", feed: "UPLIFTMAX", title: "UPLIFTMAX DE", want: true },
  { actual: "PROSTALIS", feed: "PROSTALIS", title: "PROSTALIS EU", want: false },
  { actual: "Reishield", feed: "Reishield", title: "Reishield DE", want: false },
  { actual: "Smoke No More", feed: "Smoke", title: "Smoke No More DE", want: false },
  { actual: "Epilage PRO", feed: "Epilage PRO", title: "Epilage PRO RO", want: false },
];
for (const { actual, feed, title, want } of truncatedCases) {
  const got = isTruncatedDisplayBrand(actual, feed, title);
  if (got !== want) {
    console.error(
      `FAIL isTruncatedDisplayBrand("${actual}", "${feed}", "${title}") → ${got} (expected ${want})`,
    );
    failed += 1;
  } else {
    console.log(`OK  truncated ${want ? "YES" : "no"} "${actual}" vs feed "${feed}"`);
  }
}

if (simulateLegacyGeoStripInBrand("PROSTALIS") !== "P STALIS") {
  console.error(`FAIL simulateLegacyGeoStripInBrand("PROSTALIS")`);
  failed += 1;
} else {
  console.log(`OK  simulateLegacyGeoStripInBrand("PROSTALIS") → "P STALIS"`);
}

const reason = truncatedBrandReason("P STALIS — капсули", "PROSTALIS", "PROSTALIS EU", {
  titleUk: "💊 PROSTALIS: Recenze Ceny",
});
if (reason !== "body_mismatch" && reason !== "geo_stripped") {
  console.error(`FAIL truncatedBrandReason → "${reason}"`);
  failed += 1;
} else {
  console.log(`OK  truncatedBrandReason → "${reason}"`);
}

const drDermSplit = splitBrandAndTail("Dr. Derm – крем при псориазис");
if (drDermSplit.brand !== "Dr. Derm") {
  console.error(`FAIL splitBrandAndTail("Dr. Derm – …") brand → "${drDermSplit.brand}"`);
  failed += 1;
} else {
  console.log(`OK  splitBrandAndTail("Dr. Derm – …") → brand "${drDermSplit.brand}"`);
}

if (extractLockedLatinBrand("Dr. Derm EU") !== "Dr. Derm") {
  console.error(`FAIL extractLockedLatinBrand("Dr. Derm EU")`);
  failed += 1;
} else {
  console.log(`OK  extractLockedLatinBrand("Dr. Derm EU") → "Dr. Derm"`);
}

if (extractEmbeddedLatinBrand("Крем Dr. Derm от псориаза") !== "Dr. Derm") {
  console.error(`FAIL extractEmbeddedLatinBrand("Крем Dr. Derm …")`);
  failed += 1;
} else {
  console.log(`OK  extractEmbeddedLatinBrand("Крем Dr. Derm …") → "Dr. Derm"`);
}

if (extractLockedLatinBrand("Smoke No More DE") !== "Smoke No More") {
  console.error(`FAIL extractLockedLatinBrand("Smoke No More DE") regression`);
  failed += 1;
} else {
  console.log(`OK  extractLockedLatinBrand("Smoke No More DE") → "Smoke No More"`);
}

if (extractLockedLatinBrand("Dr.Derm BG low - psoriasis") !== "Dr. Derm") {
  console.error(`FAIL extractLockedLatinBrand("Dr.Derm BG low - psoriasis")`);
  failed += 1;
} else {
  console.log(`OK  extractLockedLatinBrand("Dr.Derm BG low - psoriasis") → "Dr. Derm"`);
}

if (failed) process.exit(1);
console.log("\nbrand-clean CZ tests OK");
