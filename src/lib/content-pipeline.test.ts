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
  sourceSlotDeadlineMs,
  rankDrainSourcesByBacklog,
  sourceDeadlineForQueueSlot,
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

ok("SOURCE_DRAIN_SLOT_MS is large enough for one claim after setup", () => {
  assert.ok(SOURCE_DRAIN_SLOT_MS >= MIN_SOURCE_DRAIN_MS);
  const slotDeadline = sourceDrainDeadlineMs(SOURCE_DRAIN_SLOT_MS);
  assert.ok(slotDeadline != null);
  assert.ok(slotDeadline! - 3500 >= MIN_CONTENT_OFFER_MS);
  const afterSetup = slotDeadline! - 3500 - 15_000;
  assert.ok(
    afterSetup >= MIN_CONTENT_OFFER_MS,
    `after 15s setup ${afterSetup} < claim gate ${MIN_CONTENT_OFFER_MS}`,
  );
});

ok("58s historical slot misses claim gate after 15s setup", () => {
  const historical = MIN_CONTENT_OFFER_MS + 8_000;
  const afterSetup = historical - 1000 - 3500 - 15_000;
  assert.ok(afterSetup < MIN_CONTENT_OFFER_MS);
});

ok("with 180s budget two 90s slots fit (3×58s could not claim)", () => {
  const slots = Math.floor(CONTENT_DRAIN_DEADLINE_MS / SOURCE_DRAIN_SLOT_MS);
  assert.ok(slots >= 2, `expected ≥2 slots, got ${slots}`);
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

ok("sourceSlotDeadlineMs caps 180s so the first source cannot monopolize", () => {
  const capped = sourceSlotDeadlineMs(CONTENT_DRAIN_DEADLINE_MS);
  assert.equal(capped, SOURCE_DRAIN_SLOT_MS - 1000);
  assert.ok(capped! < CONTENT_DRAIN_DEADLINE_MS - 1000);
  assert.equal(sourceSlotDeadlineMs(MIN_SOURCE_DRAIN_MS - 1), null);
});

ok("solo cpagetti (last/only) gets leftover ~180s, not a 90s cap", () => {
  const last = sourceDeadlineForQueueSlot({
    remainingMs: CONTENT_DRAIN_DEADLINE_MS,
    isLast: true,
  });
  assert.equal(last, CONTENT_DRAIN_DEADLINE_MS - 1000);
  assert.ok(last! > SOURCE_DRAIN_SLOT_MS);
  const first = sourceDeadlineForQueueSlot({
    remainingMs: CONTENT_DRAIN_DEADLINE_MS,
    isLast: false,
  });
  assert.equal(first, SOURCE_DRAIN_SLOT_MS - 1000);
});

ok("two-source queue: first still 90s; last gets whatever wall remains", () => {
  const first = sourceDeadlineForQueueSlot({
    remainingMs: CONTENT_DRAIN_DEADLINE_MS,
    isLast: false,
  });
  assert.equal(first, SOURCE_DRAIN_SLOT_MS - 1000);
  const leftoverAfterFastFirst = CONTENT_DRAIN_DEADLINE_MS - 30_000;
  const last = sourceDeadlineForQueueSlot({
    remainingMs: leftoverAfterFastFirst,
    isLast: true,
  });
  assert.equal(last, leftoverAfterFastFirst - 1000);
  assert.ok(last! > SOURCE_DRAIN_SLOT_MS - 1000);
  assert.equal(
    sourceDeadlineForQueueSlot({ remainingMs: MIN_SOURCE_DRAIN_MS - 1, isLast: true }),
    null,
  );
});

ok("rankDrainSourcesByBacklog puts small holes before fat cpagetti", () => {
  const ranked = rankDrainSourcesByBacklog([
    { source: "cpagetti", count: 8 },
    { source: "shakes", count: 2 },
    { source: "m1_top", count: 2 },
  ]);
  assert.deepEqual(
    ranked.map((r) => r.source),
    ["shakes", "m1_top", "cpagetti"],
  );
});

ok("after one slot, remaining budget still visits a second source (no early return)", () => {
  let remaining = CONTENT_DRAIN_DEADLINE_MS;
  const visited: string[] = [];
  for (const src of ["shakes", "m1_top", "cpagetti"] as const) {
    if (sourceSlotDeadlineMs(remaining) == null) break;
    visited.push(src);
    remaining -= SOURCE_DRAIN_SLOT_MS;
  }
  assert.deepEqual(visited, ["shakes", "m1_top"]);
  assert.ok(visited.includes("m1_top"), "m1_top must get a slot in the first pass");
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
