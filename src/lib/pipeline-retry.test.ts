import assert from "node:assert/strict";
import {
  classifyQaRetryStep,
  shouldRunPipelineStep,
  sumRequestedCompletionBudgetFrom,
  releasePipelineBudgetForPartialRetry,
  ensurePipelineDeadline,
  PipelineDeadlineError,
  PIPELINE_MAX_COMPLETION_BUDGET,
  PIPELINE_STEP_COMPLETION_BUDGET,
} from "./pipeline-retry";

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

ok("classifyQaRetryStep maps title errors to step2", () => {
  assert.equal(classifyQaRetryStep(["garbled-display-title"]), "step2");
  assert.equal(
    classifyQaRetryStep(["generic-descriptor-in-title", "niche-must-mention-missing"]),
    "step2",
  );
});

ok("classifyQaRetryStep maps html errors to step6", () => {
  assert.equal(classifyQaRetryStep(["description-html-too-short"]), "step6");
  assert.equal(classifyQaRetryStep(["stale-template:foo"]), "step6");
  assert.equal(classifyQaRetryStep(["non-bulgarian-locale-leak"]), "step6");
});

ok("classifyQaRetryStep picks earliest step when mixed", () => {
  assert.equal(
    classifyQaRetryStep(["garbled-display-title", "description-html-too-short"]),
    "step2",
  );
});

ok("shouldRunPipelineStep cascades downstream", () => {
  assert.equal(shouldRunPipelineStep("step2", "step1"), false);
  assert.equal(shouldRunPipelineStep("step2", "step2"), true);
  assert.equal(shouldRunPipelineStep("step2", "step7"), true);
  assert.equal(shouldRunPipelineStep("step6", "step6b"), true);
  assert.equal(shouldRunPipelineStep("step7", "step6"), false);
});

ok("PIPELINE_MAX_COMPLETION_BUDGET matches full pass", () => {
  assert.equal(
    sumRequestedCompletionBudgetFrom("step1", { includeStep6b: true }),
    PIPELINE_MAX_COMPLETION_BUDGET,
  );
  assert.equal(PIPELINE_MAX_COMPLETION_BUDGET, 21924);
});

ok("releasePipelineBudgetForPartialRetry frees step2 retry after full pass", () => {
  const after = releasePipelineBudgetForPartialRetry(
    PIPELINE_MAX_COMPLETION_BUDGET,
    "step2",
    { includeStep6b: true },
  );
  assert.equal(after, PIPELINE_STEP_COMPLETION_BUDGET.step1);
  assert.ok(after + PIPELINE_STEP_COMPLETION_BUDGET.step2 <= PIPELINE_MAX_COMPLETION_BUDGET);
});

ok("releasePipelineBudgetForPartialRetry handles skipped step6b", () => {
  const fullWithout6b =
    PIPELINE_MAX_COMPLETION_BUDGET - PIPELINE_STEP_COMPLETION_BUDGET.step6b;
  const after = releasePipelineBudgetForPartialRetry(fullWithout6b, "step6", {
    includeStep6b: false,
  });
  assert.equal(after, 8304);
  assert.ok(
    after + sumRequestedCompletionBudgetFrom("step6", { includeStep6b: false }) <=
      PIPELINE_MAX_COMPLETION_BUDGET,
  );
});

ok("ensurePipelineDeadline no-ops without deadline", () => {
  ensurePipelineDeadline(undefined);
  ensurePipelineDeadline(null);
});

ok("ensurePipelineDeadline throws when past reserve", () => {
  const now = 1_000_000;
  assert.throws(
    () => ensurePipelineDeadline(now + 1000, 2000, now),
    (err: unknown) => err instanceof PipelineDeadlineError && err.message === "pipeline_deadline",
  );
});

ok("ensurePipelineDeadline allows time before reserve", () => {
  const now = 1_000_000;
  ensurePipelineDeadline(now + 5000, 2000, now);
});

if (failed > 0) process.exit(1);
