#!/usr/bin/env tsx
/**
 * Smoke: feed-title affiliate marker cleanup + LLM guide module.
 *
 * Usage: npx tsx scripts/smoke-feed-title-clean.ts
 */
import {
  normalizeProductTitle,
  splitBrandAndTail,
  firstLatinToken,
  containsAffiliateSkuTokens,
} from "../src/lib/brand-clean";
import { buildProductSlug } from "../src/lib/slugify";
import { buildFeedTitleCleanGuideIT } from "../src/lib/feed-title-clean.it";
import { buildProductTitle } from "../src/lib/seo-meta";

const FEED = "Reishield EU LOW IT";

let fail = 0;

function assert(label: string, ok: boolean, detail?: string) {
  if (!ok) {
    console.error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
    fail += 1;
  } else {
    console.log(`OK   ${label}`);
  }
}

const normalized = normalizeProductTitle(FEED);
assert("normalizeProductTitle strips affiliate markers", normalized === "Reishield", normalized);

const { brand } = splitBrandAndTail(FEED);
assert("splitBrandAndTail brand", brand === "Reishield", brand);

const latin = firstLatinToken(FEED, "Reishield EU LOW");
assert("firstLatinToken", latin === "Reishield", latin);

const slug = buildProductSlug({
  title: FEED,
  brand: "Reishield EU LOW",
  offerId: 22018,
  source: "shakes",
});
assert("slug base not polluted", slug === "reishield-s22018", slug);

const seoTitle = buildProductTitle({
  brand: "Reishield",
  feedBrand: "Reishield EU LOW",
  categorySlug: "stres",
  priceEUR: 29,
  variantSeed: 22018,
});
assert("buildProductTitle no EU/low", !/\b(EU|IT|LOW)\b/i.test(seoTitle), seoTitle);

assert("containsAffiliateSkuTokens feed", containsAffiliateSkuTokens(FEED));
assert("containsAffiliateSkuTokens clean", !containsAffiliateSkuTokens("Reishield"));

const guide = buildFeedTitleCleanGuideIT({
  cleanBrand: "Reishield",
  rawTitle: FEED,
  productRole: "integratore per il sistema nervoso",
});
assert("buildFeedTitleCleanGuideIT non-empty", guide.length > 200);
assert("guide mentions Reishield", guide.includes("Reishield"));

if (fail) {
  console.error(`\nsmoke-feed-title-clean: ${fail} failure(s)`);
  process.exit(1);
}

console.log("\nsmoke-feed-title-clean: OK");
