import assert from "node:assert/strict";
import {
  FACTS_WAIT_MS,
  hasExtractableLandingForSource,
  imageFactsReadyForContent,
  isFactsExtractionAttempted,
  landingFactsReadyForContent,
  offerAgeAllowsFactsBypass,
  offerFactsReadyForContent,
  shouldWarmImageFacts,
  shouldWarmLandingFacts,
} from "./offer-facts-ready";

/** Shakes adaptive landing type marker (Cyrillic «Адаптив»). */
const ADAPTIVE = "\u0410\u0434\u0430\u043f\u0442\u0438\u0432";

assert.equal(isFactsExtractionAttempted(null), false);
assert.equal(isFactsExtractionAttempted(""), false);
assert.equal(isFactsExtractionAttempted("ok"), true);
assert.equal(isFactsExtractionAttempted("fetch_error"), true);
assert.equal(isFactsExtractionAttempted("no_url"), true);

assert.equal(
  hasExtractableLandingForSource("shakes", {
    landings: [{ type: ADAPTIVE, url: "https://offer.example.cz/x" }],
  }),
  true,
);
assert.equal(
  hasExtractableLandingForSource("shakes", {
    landings: [{ type: ADAPTIVE, url: "https://example.it/offer" }],
  }),
  false,
);
assert.equal(hasExtractableLandingForSource("shakes", {}), false);
assert.equal(
  hasExtractableLandingForSource("m1_top", {
    tracking_link: ["https://track.example.com/x"],
  }),
  true,
);
assert.equal(
  hasExtractableLandingForSource("cpa_tl", {
    landings: [{ url: "https://l.example.com/x", language_code: "cs" }],
  }),
  true,
);
assert.equal(
  hasExtractableLandingForSource("cpa_tl", {
    landings: [{ url: "https://l.example.com/x", language_code: "it" }],
  }),
  false,
);

assert.equal(
  landingFactsReadyForContent({
    source: "shakes",
    hasExtractableLanding: true,
    landingStatus: null,
  }),
  false,
);
assert.equal(
  landingFactsReadyForContent({
    source: "shakes",
    hasExtractableLanding: true,
    landingStatus: "fetch_error",
  }),
  true,
);
assert.equal(
  landingFactsReadyForContent({
    source: "shakes",
    hasExtractableLanding: false,
    landingStatus: null,
  }),
  true,
);
assert.equal(
  landingFactsReadyForContent({
    source: "kma",
    hasExtractableLanding: true,
    landingStatus: null,
  }),
  true,
);

assert.equal(
  imageFactsReadyForContent({
    source: "shakes",
    imageFactsEnabled: true,
    hasImageUrl: true,
    imageStatus: null,
  }),
  false,
);
assert.equal(
  imageFactsReadyForContent({
    source: "shakes",
    imageFactsEnabled: true,
    hasImageUrl: true,
    imageStatus: "ok",
  }),
  true,
);
assert.equal(
  imageFactsReadyForContent({
    source: "shakes",
    imageFactsEnabled: true,
    hasImageUrl: false,
    imageStatus: null,
  }),
  true,
);
assert.equal(
  imageFactsReadyForContent({
    source: "shakes",
    imageFactsEnabled: false,
    hasImageUrl: true,
    imageStatus: null,
  }),
  true,
);

assert.equal(
  offerFactsReadyForContent({
    source: "shakes",
    hasExtractableLanding: true,
    landingStatus: "no_url",
    imageFactsEnabled: true,
    hasImageUrl: true,
    imageStatus: null,
  }),
  false,
);
assert.equal(
  offerFactsReadyForContent({
    source: "shakes",
    hasExtractableLanding: true,
    landingStatus: "no_url",
    imageFactsEnabled: true,
    hasImageUrl: true,
    imageStatus: "exhausted",
  }),
  true,
);

// Soft age gate: young offer without facts stays blocked.
{
  const now = Date.now();
  assert.equal(offerAgeAllowsFactsBypass(new Date(now - 5 * 60 * 1000).toISOString(), now), false);
  assert.equal(
    offerFactsReadyForContent({
      source: "m1_top",
      hasExtractableLanding: true,
      landingStatus: null,
      imageFactsEnabled: true,
      hasImageUrl: true,
      imageStatus: null,
      syncedAt: new Date(now - 5 * 60 * 1000).toISOString(),
      nowMs: now,
    }),
    false,
  );
}

// Soft age gate: aged offer without facts may claim (warm after claim).
{
  const now = Date.now();
  assert.equal(
    offerAgeAllowsFactsBypass(new Date(now - FACTS_WAIT_MS - 1000).toISOString(), now),
    true,
  );
  assert.equal(
    offerFactsReadyForContent({
      source: "m1_top",
      hasExtractableLanding: true,
      landingStatus: null,
      imageFactsEnabled: true,
      hasImageUrl: true,
      imageStatus: null,
      syncedAt: new Date(now - FACTS_WAIT_MS - 1000).toISOString(),
      nowMs: now,
    }),
    true,
  );
}

assert.equal(shouldWarmLandingFacts({ source: "shakes", landingStatus: null }), true);
assert.equal(shouldWarmLandingFacts({ source: "shakes", landingStatus: "no_url" }), false);
assert.equal(shouldWarmLandingFacts({ source: "kma", landingStatus: null }), false);
assert.equal(
  shouldWarmImageFacts({
    source: "shakes",
    imageFactsEnabled: true,
    imageStatus: null,
  }),
  true,
);
assert.equal(
  shouldWarmImageFacts({
    source: "shakes",
    imageFactsEnabled: true,
    imageStatus: "ok",
  }),
  false,
);
assert.equal(
  shouldWarmImageFacts({
    source: "shakes",
    imageFactsEnabled: false,
    imageStatus: null,
  }),
  false,
);

console.log("offer-facts-ready.test.ts: ok");
