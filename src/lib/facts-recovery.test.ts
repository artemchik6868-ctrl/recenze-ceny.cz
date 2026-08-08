import assert from "node:assert/strict";
import {
  classifyLandingExhaustError,
  classifyImageExhaustToFacts,
  shouldReprobeExhaustedFacts,
  countReprobeEligible,
  parseFactsHttpStatus,
  TERMINAL_DEAD_CONFIRM_AFTER,
} from "./facts-recovery";

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

const now = Date.parse("2026-08-05T12:00:00.000Z");
const old7d = "2026-07-20T00:00:00.000Z";
const recent = "2026-08-04T00:00:00.000Z";

ok("parseFactsHttpStatus", () => {
  assert.equal(parseFactsHttpStatus("HTTP 404"), 404);
  assert.equal(parseFactsHttpStatus("http_502"), 502);
  assert.equal(parseFactsHttpStatus("timeout"), null);
});

ok("classifyLandingExhaustError classes", () => {
  assert.equal(
    classifyLandingExhaustError("all 1 failed (last: x: HTTP 404)"),
    "terminal_dead",
  );
  assert.equal(
    classifyLandingExhaustError("all 1 failed (last: x: HTTP 530)"),
    "transient_fetch",
  );
  assert.equal(
    classifyLandingExhaustError(
      "llm returned empty/unusable facts (exhausted after 5 thin attempts)",
    ),
    "thin_llm",
  );
  assert.equal(classifyLandingExhaustError("non-cs landing"), "terminal_dead");
});

ok("classifyImageExhaustToFacts mapping", () => {
  assert.equal(classifyImageExhaustToFacts("fetch"), "transient_fetch");
  assert.equal(classifyImageExhaustToFacts("llm_cap"), "thin_llm");
  assert.equal(classifyImageExhaustToFacts("safety"), "thin_llm");
  assert.equal(classifyImageExhaustToFacts("other"), "other");
});

ok("shouldReprobeExhaustedFacts transient after TTL", () => {
  assert.equal(
    shouldReprobeExhaustedFacts({
      status: "exhausted",
      exhaustClass: "transient_fetch",
      updatedAt: old7d,
      now,
      minAgeDays: 7,
    }),
    true,
  );
  assert.equal(
    shouldReprobeExhaustedFacts({
      status: "exhausted",
      exhaustClass: "transient_fetch",
      updatedAt: recent,
      now,
      minAgeDays: 7,
    }),
    false,
  );
});

ok("shouldReprobeExhaustedFacts never terminal_dead", () => {
  assert.equal(
    shouldReprobeExhaustedFacts({
      status: "exhausted",
      exhaustClass: "terminal_dead",
      updatedAt: old7d,
      now,
      minAgeDays: 1,
    }),
    false,
  );
});

ok("TERMINAL_DEAD_CONFIRM_AFTER is 3", () => {
  assert.equal(TERMINAL_DEAD_CONFIRM_AFTER, 3);
});

ok("countReprobeEligible inventory burn-down", () => {
  const n = countReprobeEligible(
    [
      { status: "exhausted", exhaustClass: "transient_fetch", updatedAt: old7d },
      { status: "exhausted", exhaustClass: "terminal_dead", updatedAt: old7d },
      { status: "exhausted", exhaustClass: "thin_llm", updatedAt: recent },
      { status: "fetch_error", exhaustClass: "transient_fetch", updatedAt: old7d },
    ],
    now,
  );
  // only first row (transient old) qualifies at default TTLs
  assert.equal(n, 1);
});

if (failed) process.exit(1);
console.log("facts-recovery.test.ts: ok");
