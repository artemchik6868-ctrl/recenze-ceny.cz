import assert from "node:assert/strict";
import { computeSourceHashForTest } from "./ai-content.server";
import { shouldEnqueueBackfillJob, shouldReleaseStaleLock, STALE_LOCK_AGE_MS } from "./content-backfill.server";

let failed = 0;

function ok(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`OK  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${name}:`, err instanceof Error ? err.message : err);
  }
}

const baseSrc = {
  title: "Produs test",
  category: "suplimente",
  priceKey: "99|EUR",
};
const cleaned = "descriere curatata";

ok("source_hash changes when priceKey changes", () => {
  const a = computeSourceHashForTest(baseSrc, cleaned);
  const b = computeSourceHashForTest({ ...baseSrc, priceKey: "149|EUR" }, cleaned);
  assert.notEqual(a, b);
});

ok("source_hash stable for same priceKey", () => {
  const a = computeSourceHashForTest(baseSrc, cleaned);
  const b = computeSourceHashForTest({ ...baseSrc }, cleaned);
  assert.equal(a, b);
});

ok("onlyMissing without regenStale skips stale offers", () => {
  assert.equal(
    shouldEnqueueBackfillJob(
      { onlyMissing: true, regenStale: false },
      { missingContent: false, stale: true, needsQa: false },
    ),
    false,
  );
});

ok("onlyMissing with regenStale enqueues stale offers", () => {
  assert.equal(
    shouldEnqueueBackfillJob(
      { onlyMissing: true, regenStale: true },
      { missingContent: false, stale: true, needsQa: false },
    ),
    true,
  );
});

ok("onlyMissing with regenStale still enqueues missing offers", () => {
  assert.equal(
    shouldEnqueueBackfillJob(
      { onlyMissing: true, regenStale: true },
      { missingContent: true, stale: false, needsQa: false },
    ),
    true,
  );
});

ok("shouldReleaseStaleLock when lock active, no content, attempt old enough", () => {
  const now = Date.now();
  const row = {
    offer_id: 42,
    source: "kma",
    fail_count: 0,
    last_failed_at: null,
    locked_until: new Date(now + 60_000).toISOString(),
    last_attempt_at: new Date(now - STALE_LOCK_AGE_MS - 1000).toISOString(),
  };
  assert.equal(shouldReleaseStaleLock(row, new Set(), now), true);
});

ok("shouldReleaseStaleLock skips when content already complete", () => {
  const now = Date.now();
  const row = {
    offer_id: 42,
    source: "kma",
    fail_count: 0,
    last_failed_at: null,
    locked_until: new Date(now + 60_000).toISOString(),
    last_attempt_at: new Date(now - STALE_LOCK_AGE_MS - 1000).toISOString(),
  };
  assert.equal(shouldReleaseStaleLock(row, new Set([42]), now), false);
});

ok("shouldReleaseStaleLock skips recent attempts", () => {
  const now = Date.now();
  const row = {
    offer_id: 42,
    source: "kma",
    fail_count: 0,
    last_failed_at: null,
    locked_until: new Date(now + 60_000).toISOString(),
    last_attempt_at: new Date(now - 30_000).toISOString(),
  };
  assert.equal(shouldReleaseStaleLock(row, new Set(), now), false);
});

ok("shouldReleaseStaleLock when lock expired, no content, attempt old enough", () => {
  const now = Date.now();
  const row = {
    offer_id: 24082,
    source: "shakes",
    fail_count: 0,
    last_failed_at: null,
    last_error: null,
    locked_until: new Date(now - 60_000).toISOString(),
    last_attempt_at: new Date(now - STALE_LOCK_AGE_MS - 1000).toISOString(),
  };
  assert.equal(shouldReleaseStaleLock(row, new Set(), now), true);
});

ok("shouldReleaseStaleLock skips expired cooldown residue after recorded failure", () => {
  const now = Date.now();
  const attemptAt = new Date(now - STALE_LOCK_AGE_MS - 5000).toISOString();
  const row = {
    offer_id: 24082,
    source: "shakes",
    fail_count: 1,
    last_failed_at: attemptAt,
    last_error: "worker_killed_or_timeout",
    locked_until: new Date(now - 1000).toISOString(),
    last_attempt_at: attemptAt,
  };
  assert.equal(shouldReleaseStaleLock(row, new Set(), now), false);
});

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nAll content-backfill stale tests passed");
