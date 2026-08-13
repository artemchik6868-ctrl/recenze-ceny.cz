import assert from "node:assert/strict";
import { computeSourceHashForTest } from "./ai-content.server";
import {
  compareDrainOfferOrder,
  computeDrainPriority,
  CONTENT_STALE_MS,
  capScanWindow,
  filterIncompleteOfferIds,
  isIndexContentComplete,
  selectStaleLockCandidates,
  shouldYieldAfterWarmOnlyRound,
  shouldEnqueueBackfillJob,
  shouldReleaseStaleLock,
  STALE_LOCK_AGE_MS,
  STALE_LOCK_RELEASE_CAP,
} from "./content-backfill.server";

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

ok("drain priority: high fail_count goes last", () => {
  const healthy = computeDrainPriority({
    missingContent: true,
    bareMissing: true,
    failCount: 0,
    missingQa: false,
    drainMode: true,
  });
  const poison = computeDrainPriority({
    missingContent: true,
    bareMissing: true,
    failCount: 5,
    missingQa: false,
    drainMode: true,
  });
  assert.ok(healthy < poison, `healthy ${healthy} should sort before poison ${poison}`);
});

ok("drain priority: stale synced_at gets boost in drainMode", () => {
  const now = Date.now();
  const fresh = computeDrainPriority({
    missingContent: true,
    bareMissing: true,
    failCount: 0,
    missingQa: false,
    syncedAt: new Date(now - 10 * 60 * 1000).toISOString(),
    nowMs: now,
    drainMode: true,
  });
  const stale = computeDrainPriority({
    missingContent: true,
    bareMissing: true,
    failCount: 0,
    missingQa: false,
    syncedAt: new Date(now - CONTENT_STALE_MS - 1000).toISOString(),
    nowMs: now,
    drainMode: true,
  });
  assert.ok(stale < fresh, `stale ${stale} should sort before fresh ${fresh}`);
});

ok("compareDrainOfferOrder: oldest synced_at first on equal priority", () => {
  const ids = [
    { priority: 0, syncedAt: "2026-08-06T12:00:00.000Z", id: 3 },
    { priority: 0, syncedAt: "2026-08-06T10:00:00.000Z", id: 1 },
    { priority: 0, syncedAt: "2026-08-06T11:00:00.000Z", id: 2 },
  ];
  ids.sort(compareDrainOfferOrder);
  assert.deepEqual(
    ids.map((x) => x.id),
    [1, 2, 3],
  );
});

ok("compareDrainOfferOrder: lower priority wins over older sync", () => {
  const ids = [
    { priority: 10, syncedAt: "2026-08-01T00:00:00.000Z", id: 1 },
    { priority: -20, syncedAt: "2026-08-06T12:00:00.000Z", id: 2 },
  ];
  ids.sort(compareDrainOfferOrder);
  assert.deepEqual(
    ids.map((x) => x.id),
    [2, 1],
  );
});

ok("shouldYieldAfterWarmOnlyRound only yields on warm-only progress", () => {
  assert.equal(shouldYieldAfterWarmOnlyRound({ generated: 0, failed: 0, warmedFacts: 1 }), true);
  assert.equal(shouldYieldAfterWarmOnlyRound({ generated: 1, failed: 0, warmedFacts: 1 }), false);
  assert.equal(shouldYieldAfterWarmOnlyRound({ generated: 0, failed: 1, warmedFacts: 1 }), false);
  assert.equal(shouldYieldAfterWarmOnlyRound({ generated: 0, failed: 0, warmedFacts: 0 }), false);
});

ok("filterIncompleteOfferIds skips complete rows and honors limit", () => {
  const windowIds = [10, 20, 30, 40, 50];
  const haveComplete = new Set([20, 40]);
  assert.deepEqual(filterIncompleteOfferIds(windowIds, haveComplete), [10, 30, 50]);
  assert.deepEqual(filterIncompleteOfferIds(windowIds, haveComplete, 2), [10, 30]);
  assert.deepEqual(filterIncompleteOfferIds(windowIds, new Set(windowIds)), []);
});

ok("capScanWindow stops before enumerating a large catalog", () => {
  const ids = Array.from({ length: 5000 }, (_, i) => i + 1);
  assert.equal(capScanWindow(ids, 200).length, 200);
  assert.deepEqual(capScanWindow(ids, 200), ids.slice(0, 200));
  assert.deepEqual(capScanWindow([1, 2, 3], 200), [1, 2, 3]);
  assert.deepEqual(capScanWindow(ids, 0), []);
});

ok("selectStaleLockCandidates caps and skips cooldown residue", () => {
  const now = Date.now();
  const staleAttempt = new Date(now - STALE_LOCK_AGE_MS - 1000).toISOString();
  const rows = Array.from({ length: STALE_LOCK_RELEASE_CAP + 5 }, (_, i) => ({
    offer_id: i + 1,
    source: "shakes",
    fail_count: 0,
    last_failed_at: null,
    last_error: null,
    locked_until: new Date(now + 60_000).toISOString(),
    last_attempt_at: staleAttempt,
  }));
  const cooldown = {
    offer_id: 999,
    source: "shakes",
    fail_count: 1,
    last_failed_at: staleAttempt,
    last_error: "worker_killed_or_timeout",
    locked_until: new Date(now - 1000).toISOString(),
    last_attempt_at: staleAttempt,
  };
  const picked = selectStaleLockCandidates([cooldown, ...rows], now);
  assert.equal(picked.length, STALE_LOCK_RELEASE_CAP);
  assert.equal(picked[0]?.offer_id, 1);
  assert.ok(picked.every((row) => row.offer_id !== 999));
});

ok("isIndexContentComplete matches faq≥3 + title", () => {
  assert.equal(
    isIndexContentComplete({ display_title_uk: "A", faq_uk: ["q", "w", "e"] }),
    true,
  );
  assert.equal(isIndexContentComplete({ display_title_uk: "A", faq_uk: ["q"] }), false);
  assert.equal(isIndexContentComplete({ display_title_uk: null, faq_uk: ["q", "w", "e"] }), false);
});

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nAll content-backfill stale tests passed");
