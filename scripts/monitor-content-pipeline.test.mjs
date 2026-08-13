import assert from "node:assert/strict";
import {
  missingActionableCount,
  shouldFailPipelineHealth,
  shouldSelfHealBacklog,
} from "./monitor-content-pipeline.mjs";

let failed = 0;

function ok(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`fail - ${name}`);
    console.error(err);
  }
}

ok("self-heal stays disabled when flag is off", () => {
  assert.equal(
    shouldSelfHealBacklog({
      missingActionable: 3,
      maxMissingContent: 2,
      selfHealSlack: 3,
      selfHealDrain: false,
    }),
    false,
  );
});

ok("self-heal allows actionable backlog inside slack budget", () => {
  assert.equal(
    shouldSelfHealBacklog({
      missingActionable: 5,
      maxMissingContent: 2,
      selfHealSlack: 3,
      selfHealDrain: true,
    }),
    true,
  );
});

ok("self-heal refuses actionable backlog above ceiling", () => {
  assert.equal(
    shouldSelfHealBacklog({
      missingActionable: 6,
      maxMissingContent: 2,
      selfHealSlack: 3,
      selfHealDrain: true,
    }),
    false,
  );
});

ok("self-heal does not run at or below max threshold", () => {
  assert.equal(
    shouldSelfHealBacklog({
      missingActionable: 2,
      maxMissingContent: 2,
      selfHealSlack: 3,
      selfHealDrain: true,
    }),
    false,
  );
});

ok("facts-blocked stock is not actionable", () => {
  assert.equal(missingActionableCount(6, 6), 0);
});

ok("facts-blocked 6/6 does not fail health", () => {
  assert.equal(
    shouldFailPipelineHealth({
      missingActionable: missingActionableCount(6, 6),
      maxMissingContent: 2,
    }),
    false,
  );
});

ok("leftover actionable still fails when above max", () => {
  assert.equal(missingActionableCount(4, 1), 3);
  assert.equal(
    shouldFailPipelineHealth({
      missingActionable: missingActionableCount(4, 1),
      maxMissingContent: 2,
    }),
    true,
  );
});

ok("facts-only backlog does not self-heal", () => {
  assert.equal(
    shouldSelfHealBacklog({
      missingActionable: missingActionableCount(6, 6),
      maxMissingContent: 2,
      selfHealSlack: 3,
      selfHealDrain: true,
    }),
    false,
  );
});

ok("missing_actionable never goes negative", () => {
  assert.equal(missingActionableCount(2, 5), 0);
});

if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}

console.log("\nmonitor-content-pipeline.test.mjs: OK");
