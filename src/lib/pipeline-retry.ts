/** Minimal pipeline step to re-run on QA hard failure (with downstream cascade). */
export type PipelineRetryStep = "step1" | "step2" | "step3" | "step4" | "step5" | "step6" | "step6b" | "step7" | "step8";

/** Soft wall-clock abort so CF kill does not leave silent content_gen_failures locks. */
export class PipelineDeadlineError extends Error {
  constructor(message = "pipeline_deadline") {
    super(message);
    this.name = "PipelineDeadlineError";
  }
}

/** Throw when remaining time before deadlineAt is below reserveMs (default 2s). */
export function ensurePipelineDeadline(
  deadlineAt: number | null | undefined,
  reserveMs = 2000,
  nowMs = Date.now(),
): void {
  if (deadlineAt == null || !Number.isFinite(deadlineAt)) return;
  if (nowMs > deadlineAt - reserveMs) {
    throw new PipelineDeadlineError("pipeline_deadline");
  }
}

export const PIPELINE_STEP_ORDER: Record<PipelineRetryStep, number> = {
  step1: 1,
  step2: 2,
  step3: 3,
  step4: 4,
  step5: 5,
  step6: 6,
  step6b: 7,
  step7: 8,
  step8: 9,
};

export function shouldRunPipelineStep(from: PipelineRetryStep, step: PipelineRetryStep): boolean {
  return PIPELINE_STEP_ORDER[from] <= PIPELINE_STEP_ORDER[step];
}

/** Max completion tokens reserved per step (must match ensurePipelineBudget calls). */
export const PIPELINE_STEP_COMPLETION_BUDGET: Record<PipelineRetryStep, number> = {
  step1: 6000,
  step2: 512,
  step3: 1024,
  step4: 256,
  step5: 512,
  step6: 6000,
  step6b: 1024,
  step7: 2500,
  step8: 4096,
};

const PIPELINE_STEP_SEQUENCE: PipelineRetryStep[] = [
  "step1",
  "step2",
  "step3",
  "step4",
  "step5",
  "step6",
  "step6b",
  "step7",
  "step8",
];

/** Sum of max completion budgets for steps re-run from `from` (inclusive). */
export function sumRequestedCompletionBudgetFrom(
  from: PipelineRetryStep,
  opts: { includeStep6b?: boolean } = {},
): number {
  const includeStep6b = opts.includeStep6b ?? true;
  let sum = 0;
  for (const step of PIPELINE_STEP_SEQUENCE) {
    if (!shouldRunPipelineStep(from, step)) continue;
    if (step === "step6b" && !includeStep6b) continue;
    sum += PIPELINE_STEP_COMPLETION_BUDGET[step];
  }
  return sum;
}

/**
 * Before a QA partial retry, release completion budget for steps that will be re-run
 * so ensurePipelineBudget does not reject the retry after a full pass.
 */
export function releasePipelineBudgetForPartialRetry(
  requestedCompletionTokens: number,
  from: PipelineRetryStep,
  opts: { includeStep6b?: boolean } = {},
): number {
  const release = sumRequestedCompletionBudgetFrom(from, opts);
  return Math.max(0, requestedCompletionTokens - release);
}

export const PIPELINE_MAX_COMPLETION_BUDGET = PIPELINE_STEP_SEQUENCE.reduce(
  (sum, step) => sum + PIPELINE_STEP_COMPLETION_BUDGET[step],
  0,
);

const TITLE_HARD_ERRORS = new Set([
  "garbled-display-title",
  "generic-descriptor-in-title",
  "affiliate-noise-in-title",
  "german-descriptor-in-title",
]);

const HTML_HARD_ERRORS = new Set([
  "description-html-too-short",
  "html-entities-present",
  "unsubstituted-brand-placeholder",
  "supplement-template-on-appliance",
  "oral-fungus-topical-leak",
]);

/** Map QA hard errors to the earliest step that must be re-run (plus downstream). */
export function classifyQaRetryStep(hardErrors: string[]): PipelineRetryStep {
  if (hardErrors.length === 0) return "step7";

  let minOrder = Number.POSITIVE_INFINITY;

  for (const err of hardErrors) {
    if (TITLE_HARD_ERRORS.has(err)) {
      minOrder = Math.min(minOrder, PIPELINE_STEP_ORDER.step2);
    } else if (
      HTML_HARD_ERRORS.has(err) ||
      err.startsWith("stale-template:") ||
      err === "non-bulgarian-locale-leak"
    ) {
      minOrder = Math.min(minOrder, PIPELINE_STEP_ORDER.step6);
    }
  }

  if (!Number.isFinite(minOrder)) return "step1";

  const entry = Object.entries(PIPELINE_STEP_ORDER).find(([, order]) => order === minOrder);
  return (entry?.[0] as PipelineRetryStep | undefined) ?? "step1";
}
