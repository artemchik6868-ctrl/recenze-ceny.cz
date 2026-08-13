import assert from "node:assert/strict";
import { classifyStuckBlockReason, missingActionableCount } from "./pipeline-status.server";
import { QUARANTINE_AFTER_FAILS } from "./content-gen-cooldown";

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

const now = Date.parse("2026-08-06T12:00:00.000Z");

ok("locked wins over other reasons", () => {
  assert.equal(
    classifyStuckBlockReason({
      failCount: 5,
      lastError: "x",
      lockedUntil: new Date(now + 60_000).toISOString(),
      lastFailedAt: new Date(now - 1000).toISOString(),
      factsPending: true,
      nowMs: now,
    }),
    "locked",
  );
});

ok("cooldown after recent failure", () => {
  assert.equal(
    classifyStuckBlockReason({
      failCount: 1,
      lastError: "gateway",
      lockedUntil: null,
      lastFailedAt: new Date(now - 60_000).toISOString(),
      factsPending: false,
      nowMs: now,
    }),
    "cooldown",
  );
});

ok("repeated_fail when above quarantine and not cooling", () => {
  // fail_count ≥ QUARANTINE → 24h cooldown; use lastFailedAt old enough.
  assert.equal(
    classifyStuckBlockReason({
      failCount: QUARANTINE_AFTER_FAILS,
      lastError: "qa",
      lockedUntil: null,
      lastFailedAt: new Date(now - 25 * 60 * 60 * 1000).toISOString(),
      factsPending: false,
      nowMs: now,
    }),
    "repeated_fail",
  );
});

ok("facts_pending when no claim history", () => {
  assert.equal(
    classifyStuckBlockReason({
      failCount: null,
      lastError: null,
      lockedUntil: null,
      lastFailedAt: null,
      factsPending: true,
      nowMs: now,
    }),
    "facts_pending",
  );
});

ok("never_claimed default", () => {
  assert.equal(
    classifyStuckBlockReason({
      failCount: null,
      lastError: null,
      lockedUntil: null,
      lastFailedAt: null,
      factsPending: false,
      nowMs: now,
    }),
    "never_claimed",
  );
});

ok("missing_actionable subtracts facts-blocked warehouse", () => {
  assert.equal(missingActionableCount(6, 6), 0);
  assert.equal(missingActionableCount(4, 1), 3);
  assert.equal(missingActionableCount(2, 5), 0);
});

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nAll pipeline-status block_reason tests passed");
