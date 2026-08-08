/**
 * IndexNow rate-limit pure helpers.
 * Run: npx tsx src/lib/indexing-rate-limit.test.ts
 */
import assert from "node:assert/strict";
import {
  cooldownUntilFromRetryAfter,
  formatCooldownError,
  isCooldownActive,
  isHardIndexingLogError,
  isIndexNowRateLimitErrorText,
  isIndexNowRateLimitHttpStatus,
  parseCooldownUntilIso,
  parseRetryAfterMs,
  prioritizeOfferIds,
} from "./indexing-rate-limit";

let failed = 0;
function ok(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`fail - ${name}`);
    console.error(err);
  }
}

ok("429 http status", () => {
  assert.equal(isIndexNowRateLimitHttpStatus(429), true);
  assert.equal(isIndexNowRateLimitHttpStatus(500), false);
});

ok("rate limit error text", () => {
  assert.equal(
    isIndexNowRateLimitErrorText(
      '429 {"errorCode":"TooManyRequests","message":"too many"}',
    ),
    true,
  );
  assert.equal(isIndexNowRateLimitErrorText("500 Internal"), false);
});

ok("hard error excludes 429 legacy rows", () => {
  assert.equal(
    isHardIndexingLogError({
      status: "error",
      error: "429 TooManyRequests",
    }),
    false,
  );
  assert.equal(
    isHardIndexingLogError({ status: "rate_limited", error: "cooldown" }),
    false,
  );
  assert.equal(
    isHardIndexingLogError({ status: "error", error: "502 Bad Gateway" }),
    true,
  );
});

ok("parse Retry-After seconds", () => {
  assert.equal(parseRetryAfterMs("120"), 120_000);
  assert.equal(parseRetryAfterMs(null), null);
});

ok("cooldown marker round-trip", () => {
  const until = cooldownUntilFromRetryAfter(60_000, Date.parse("2026-08-08T10:00:00.000Z"));
  const err = formatCooldownError(until);
  assert.equal(parseCooldownUntilIso(err), until);
  assert.equal(
    isCooldownActive({ error: err }, Date.parse("2026-08-08T10:00:30.000Z")),
    true,
  );
  assert.equal(
    isCooldownActive({ error: err }, Date.parse("2026-08-08T10:02:00.000Z")),
    false,
  );
});

ok("prioritizeOfferIds puts prefer first", () => {
  // Stable: preferred ids keep relative order from the original queue.
  assert.deepEqual(prioritizeOfferIds([1, 2, 3, 4], [3, 1]), [1, 3, 2, 4]);
  assert.deepEqual(prioritizeOfferIds([1, 2], []), [1, 2]);
});

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nindexing-rate-limit.test.ts: OK");
