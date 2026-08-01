import assert from "node:assert/strict";
import {
  compareImageFactsCandidates,
  formatImageFactsForPrompt,
  imageFactsCandidateRank,
  imageFactsHaveContent,
  imageUrlHash,
  isImageFactsPaidFallbackError,
  needsImageFactsExtract,
  nextThinOrExhausted,
  normalizeImageFacts,
  parseImageFactsGatewayMeta,
  shouldInjectImageFacts,
} from "./image-facts";

assert.equal(imageUrlHash("https://A.example/x.jpg"), imageUrlHash("https://a.example/x.jpg"));
assert.ok(normalizeImageFacts({ product_type: "kapsle", packaging: "dóza" }));
assert.equal(normalizeImageFacts({}), null);
assert.equal(normalizeImageFacts(null), null);

assert.equal(
  isImageFactsPaidFallbackError(
    new Error("Failed to parse LLM JSON: User Safety: safe"),
  ),
  true,
);
assert.equal(isImageFactsPaidFallbackError(new Error("AI gateway 429: rate limit")), true);
assert.equal(isImageFactsPaidFallbackError(new Error("random boom")), false);

const facts = normalizeImageFacts({
  productType: "doplněk stravy",
  application: "oral",
  releaseForm: "kapsle",
  packaging: "dóza",
  detectedText: "30 kapslí",
  briefDescription: "Modrá dóza s etiketou.",
});
assert.ok(facts);
assert.equal(facts!.application, "oral");
assert.ok(imageFactsHaveContent(facts));
assert.ok(formatImageFactsForPrompt(facts!).includes("typ:"));

const inject = shouldInjectImageFacts({ status: "ok", facts });
assert.equal(inject.inject, true);
assert.ok(inject.promptBlock);

assert.equal(shouldInjectImageFacts({ status: "thin", facts }).inject, false);

// Soft prompt only — normalize must NOT rewrite model output
const gelAsModelSaid = normalizeImageFacts({
  productType: "doplněk stravy",
  application: "topical",
  releaseForm: "gel",
  packaging: "tuba",
  detectedText: "Hondrofrost ICE COLD GEL",
  briefDescription: "Modrá tuba.",
});
assert.ok(gelAsModelSaid);
assert.equal(gelAsModelSaid!.productType, "doplněk stravy");
assert.equal(gelAsModelSaid!.releaseForm, "gel");

const longPack =
  "Vitality Plus Ultra FOOD SUPPLEMENT Vitamin E, Vitamin B1, Vitamin B2, Vitamin B6, Vitamin B7, Vitamin K, Vitamin D Thyme whole herb extract Origanum aerial part extract +14 more herbal extracts 20 capsules EXTRA LONG TEXT";
const longNorm = normalizeImageFacts({
  productType: "doplněk stravy",
  detectedText: longPack,
});
assert.ok(longNorm);
assert.equal(longNorm!.detectedText, longPack);
assert.ok(!longNorm!.detectedText!.includes("…"));

assert.equal(
  needsImageFactsExtract({
    status: "ok",
    imageHash: "abc",
    rowImageHash: "abc",
    llmAttempts: 1,
    lockedUntil: null,
  }),
  false,
);
assert.equal(
  needsImageFactsExtract({
    status: "ok",
    imageHash: "new",
    rowImageHash: "abc",
    llmAttempts: 2,
    lockedUntil: null,
  }),
  true,
);

assert.equal(imageFactsCandidateRank(false), 0);
assert.equal(imageFactsCandidateRank(true), 1);

const ranked = [
  { hasFactsRow: true, syncedAt: "2026-08-01T06:00:00Z", offerId: 100 },
  { hasFactsRow: false, syncedAt: "2026-08-01T05:00:00Z", offerId: 50 },
  { hasFactsRow: false, syncedAt: "2026-08-01T06:00:00Z", offerId: 24082 },
  { hasFactsRow: true, syncedAt: "2026-08-01T07:00:00Z", offerId: 90 },
].sort(compareImageFactsCandidates);
assert.deepEqual(
  ranked.map((c) => c.offerId),
  [24082, 50, 90, 100],
);

const thin = nextThinOrExhausted(2, 1);
assert.equal(thin.status, "exhausted");

const routed = parseImageFactsGatewayMeta(
  { id: "gen-abc123", model: "meta-llama/llama-3.2-11b-vision-instruct:free" },
  "openrouter/free",
);
assert.equal(routed.model, "meta-llama/llama-3.2-11b-vision-instruct:free");
assert.equal(routed.generationId, "gen-abc123");

const fallback = parseImageFactsGatewayMeta({ choices: [] }, "openrouter/free");
assert.equal(fallback.model, "openrouter/free");
assert.equal(fallback.generationId, null);

console.log("image-facts.test.ts: ok");
