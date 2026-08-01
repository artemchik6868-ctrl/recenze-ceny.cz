/**
 * Unit tests for pickFeaturedOffers / hasDisplayableProductImage.
 * Usage: npx tsx scripts/test-offers-utils.mjs
 */
import {
  pickFeaturedOffers,
  hasDisplayableProductImage,
  offerForClient,
  offersForClient,
} from "../src/lib/offers-utils.ts";

let failed = 0;

function fail(msg) {
  console.error(`FAIL ${msg}`);
  failed += 1;
}

function ok(msg) {
  console.log(`OK ${msg}`);
}

function baseOffer(overrides = {}) {
  return {
    id: 1,
    source: "kma",
    slug: "test",
    title: "Test",
    brand: "Test",
    subtitle: "",
    categoryKey: "joints",
    categoryName: "Gelenke",
    categorySlug: "klouby",
    image: "",
    priceEUR: 29,
    landingUrl: null,
    publishedAt: "2026-01-01",
    firstSeenAt: "2026-01-01T00:00:00.000Z",
    aiCategoryResolved: true,
    contentGeneratedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// Newest first
{
  const offers = [
    baseOffer({ id: 1, brand: "Alpha", firstSeenAt: "2026-01-01T00:00:00.000Z", image: "http://old" }),
    baseOffer({ id: 2, brand: "Beta", firstSeenAt: "2026-06-01T00:00:00.000Z", image: "http://new" }),
  ];
  const featured = pickFeaturedOffers(offers, 2);
  if (featured.map((o) => o.id).join(",") !== "2,1") {
    fail(`newest-first expected 2,1 got ${featured.map((o) => o.id).join(",")}`);
  } else {
    ok("featured sorts by firstSeenAt descending");
  }
}

// Dedupe by brand
{
  const offers = [
    baseOffer({ id: 1, brand: "Alpha", firstSeenAt: "2026-06-02T00:00:00.000Z", image: "http://a" }),
    baseOffer({ id: 2, brand: "Alpha", firstSeenAt: "2026-06-01T00:00:00.000Z", image: "http://b" }),
    baseOffer({ id: 3, brand: "Beta", firstSeenAt: "2026-05-01T00:00:00.000Z", image: "http://c" }),
  ];
  const featured = pickFeaturedOffers(offers, 3);
  if (featured.map((o) => o.id).join(",") !== "1,3") {
    fail(`dedupe expected 1,3 got ${featured.map((o) => o.id).join(",")}`);
  } else {
    ok("featured dedupes by brand");
  }
}

// hasDisplayableProductImage
{
  if (!hasDisplayableProductImage(baseOffer({ image: "http://x" }))) {
    fail("feed image should be displayable");
  } else {
    ok("feed image is displayable");
  }
  if (hasDisplayableProductImage(baseOffer({ image: "" }))) {
    fail("empty image should not be displayable");
  } else {
    ok("empty image not displayable");
  }
}

// offerForClient strips feedClassifyText
{
  const withBlob = baseOffer({
    feedClassifyText: "Лэндинг 1 Веб-сайты Email-рассылки",
  });
  const cleaned = offerForClient(withBlob);
  if ("feedClassifyText" in cleaned) {
    fail("offerForClient should omit feedClassifyText");
  } else {
    ok("offerForClient omits feedClassifyText");
  }
  const batch = offersForClient([withBlob, baseOffer({ id: 2 })]);
  if (batch.some((o) => "feedClassifyText" in o)) {
    fail("offersForClient should omit feedClassifyText on all");
  } else {
    ok("offersForClient strips classify blobs");
  }
}

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nAll offers-utils tests passed");
