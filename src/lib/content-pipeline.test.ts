import assert from "node:assert/strict";
import {
  CONTENT_DRAIN_DEADLINE_MS,
  drainRoundStartIndex,
  mergeGenerateNewContentResult,
  MIN_SOURCE_DRAIN_MS,
  pickSourceWithMostMissing,
  rotateSourcesFrom,
  SOURCE_DRAIN_SLOT_MS,
  sourceDrainDeadlineMs,
} from "./content-pipeline.server";
import { MIN_CONTENT_OFFER_MS } from "./content-backfill.server";
import type { GenerateNewContentResult } from "./content-backfill.server";

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

ok("full remaining budget leaves room for MIN_CONTENT_OFFER_MS claim gate", () => {
  const deadline = sourceDrainDeadlineMs(CONTENT_DRAIN_DEADLINE_MS);
  assert.equal(deadline, CONTENT_DRAIN_DEADLINE_MS - 1000);
  // generateNewContent subtracts reserveMs=3500 before drainMode claim check
  const afterGenerateReserve = deadline! - 3500;
  assert.ok(
    afterGenerateReserve >= MIN_CONTENT_OFFER_MS,
    `effective ${afterGenerateReserve} < claim gate ${MIN_CONTENT_OFFER_MS}`,
  );
});

ok("rejects slices below MIN_SOURCE_DRAIN_MS", () => {
  assert.equal(sourceDrainDeadlineMs(MIN_SOURCE_DRAIN_MS - 1), null);
  assert.equal(sourceDrainDeadlineMs(MIN_SOURCE_DRAIN_MS), MIN_SOURCE_DRAIN_MS - 1000);
});

ok("legacy even-split of many sources would starve the claim gate", () => {
  // Historical bug: deadlineMs / N. With N=4 → 45s < MIN_CONTENT_OFFER_MS.
  const even = Math.max(15_000, Math.floor(CONTENT_DRAIN_DEADLINE_MS / 4));
  assert.equal(even, 45_000);
  assert.ok(
    even < MIN_CONTENT_OFFER_MS,
    "regression: even-split must stay below claim gate so we never reintroduce it",
  );
  assert.equal(sourceDrainDeadlineMs(even), null);
});

ok("SOURCE_DRAIN_SLOT_MS is large enough for one claim", () => {
  assert.ok(SOURCE_DRAIN_SLOT_MS >= MIN_SOURCE_DRAIN_MS);
  const slotDeadline = sourceDrainDeadlineMs(SOURCE_DRAIN_SLOT_MS);
  assert.ok(slotDeadline != null);
  assert.ok(slotDeadline! - 3500 >= MIN_CONTENT_OFFER_MS);
});

ok("with 180s budget and 3 sources, each gets a full claim slot", () => {
  // Three round-robin slots of SOURCE_DRAIN_SLOT_MS fit in CONTENT_DRAIN_DEADLINE_MS.
  const slots = Math.floor(CONTENT_DRAIN_DEADLINE_MS / SOURCE_DRAIN_SLOT_MS);
  assert.ok(slots >= 3, `expected ≥3 slots, got ${slots}`);
});

ok("rotateSourcesFrom moves startIndex to front", () => {
  const sources = ["cpa_tl", "kma", "m1_top", "shakes"] as const;
  assert.deepEqual(rotateSourcesFrom(sources, 0), ["cpa_tl", "kma", "m1_top", "shakes"]);
  assert.deepEqual(rotateSourcesFrom(sources, 2), ["m1_top", "shakes", "cpa_tl", "kma"]);
  assert.deepEqual(rotateSourcesFrom(sources, 5), ["kma", "m1_top", "shakes", "cpa_tl"]);
});

ok("pickSourceWithMostMissing prefers largest bounded window", () => {
  const order = ["cpa_tl", "kma", "shakes", "m1_top"] as const;
  assert.equal(
    pickSourceWithMostMissing(order, { cpa_tl: 1, kma: 0, shakes: 3, m1_top: 2 }),
    "shakes",
  );
  assert.equal(pickSourceWithMostMissing(order, { cpa_tl: 0, kma: 0 }), null);
  assert.equal(pickSourceWithMostMissing(order, { cpa_tl: 2, shakes: 2 }), "cpa_tl");
  assert.equal(
    pickSourceWithMostMissing(order, { cpa_tl: 4, kma: 0, shakes: 2, m1_top: 0 }),
    "cpa_tl",
  );
});

ok("drainRoundStartIndex rotates by half-hour buckets", () => {
  const t0 = 0;
  const t1 = 30 * 60 * 1000;
  const t2 = 60 * 60 * 1000;
  assert.equal(drainRoundStartIndex(t0, 3), 0);
  assert.equal(drainRoundStartIndex(t1, 3), 1);
  assert.equal(drainRoundStartIndex(t2, 3), 2);
  assert.equal(drainRoundStartIndex(t0, 0), 0);
});

ok("rotate + 180s prevents permanent m1 skip vs sequential first-source monopolize", () => {
  // Simulation: sequential full-budget would visit only cpa_tl first tick.
  // Fair RR visits all withMissing sources while budget remains.
  const withMissing = ["cpa_tl", "kma", "m1_top"] as const;
  const order = rotateSourcesFrom(withMissing, drainRoundStartIndex(0, withMissing.length));
  let budget = CONTENT_DRAIN_DEADLINE_MS;
  const visited: string[] = [];
  for (const src of order) {
    if (budget < MIN_SOURCE_DRAIN_MS) break;
    visited.push(src);
    budget -= SOURCE_DRAIN_SLOT_MS;
  }
  assert.deepEqual(visited, ["cpa_tl", "kma", "m1_top"]);
  assert.ok(visited.includes("m1_top"), "m1_top must get a slot in first pass");
});

ok("mergeGenerateNewContentResult accumulates rounds", () => {
  const emptyRound = {
    checked: 1,
    generated: 1,
    failed: 0,
    lockedSkipped: 0,
    cooldownSkipped: 0,
    factsPendingSkipped: 0,
    cachedAfterFailure: 0,
    warmedFacts: 0,
  };
  const a: GenerateNewContentResult = {
    content: { rounds: [emptyRound], totalGenerated: 1, totalFailed: 0 },
    timedOut: false,
    missingRemaining: 5,
  };
  const b: GenerateNewContentResult = {
    content: { rounds: [emptyRound], totalGenerated: 1, totalFailed: 1 },
    timedOut: true,
    missingRemaining: 3,
  };
  const m = mergeGenerateNewContentResult(a, b);
  assert.equal(m.content.totalGenerated, 2);
  assert.equal(m.content.totalFailed, 1);
  assert.equal(m.content.rounds.length, 2);
  assert.equal(m.missingRemaining, 3);
  assert.equal(m.timedOut, true);
});

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nAll content-pipeline drain budget tests passed");
