/**
 * Shared facts recovery policy: classify exhausted errors and soft re-probe rules.
 * Landing + image drains use the same transient vs terminal taxonomy.
 */

export type FactsExhaustClass = "terminal_dead" | "transient_fetch" | "thin_llm" | "other";

/** Soft re-probe age for transient CDN/egress exhausted (days). */
export const FACTS_REPROBE_TRANSIENT_FETCH_DAYS_DEFAULT = 7;
/** Soft re-probe age for thin/LLM/safety exhausted (days). */
export const FACTS_REPROBE_THIN_LLM_DAYS_DEFAULT = 14;

/** Parse first HTTP status from free-form error text (`HTTP 404`, `http_502`, …). */
export function parseFactsHttpStatus(errorMessage: string | null | undefined): number | null {
  const e = String(errorMessage ?? "");
  const m1 = e.match(/\bHTTP\s+(\d{3})\b/i);
  if (m1) {
    const n = Number(m1[1]);
    return Number.isFinite(n) ? n : null;
  }
  const m2 = e.match(/\bhttp_(\d{3})\b/i);
  if (m2) {
    const n = Number(m2[1]);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Codes treated as confirmed-dead landings only after confirm streak (not one-shot). */
export const TERMINAL_DEAD_HTTP_CODES = new Set([404, 410]);
/** Confirm 404/410 this many consecutive times before exhausting. */
export const TERMINAL_DEAD_CONFIRM_AFTER = 3;

/**
 * Classify landing exhausted/fetch errors for ops + recovery.
 * `no_url` / `skip_geo` are terminal by status, not by this helper.
 */
export function classifyLandingExhaustError(
  error: string | null | undefined,
): FactsExhaustClass {
  const e = String(error ?? "");
  if (!e) return "other";
  if (/empty\/unusable facts|thin attempts|llm returned empty/i.test(e)) return "thin_llm";
  if (/no adaptive landing|no landing url|non-cs landing|skip_geo/i.test(e)) return "terminal_dead";

  const http = parseFactsHttpStatus(e);
  if (http != null && TERMINAL_DEAD_HTTP_CODES.has(http)) {
    // 404/410 still re-probeable if soft-exhausted during confirm window classification of error —
    // terminal_dead only after confirmed exhaust; for classify we treat confirmed 404 message as terminal
    // once exhausted (ops stock). Recovery uses age-based reopen for non-fresh transient first.
    return "terminal_dead";
  }
  if (
    http != null ||
    /timeout|aborted|network|fetch|download|ECONN|ENOTFOUND|530|502|503|504|403/i.test(e)
  ) {
    return "transient_fetch";
  }
  return "other";
}

/**
 * Map image exhaust classes into shared taxonomy.
 * llm_cap/safety → thin_llm; fetch → transient_fetch.
 */
export function classifyImageExhaustToFacts(
  imageClass: "llm_cap" | "safety" | "fetch" | "other",
): FactsExhaustClass {
  if (imageClass === "fetch") return "transient_fetch";
  if (imageClass === "llm_cap" || imageClass === "safety") return "thin_llm";
  return "other";
}

export function factsReprobeTransientFetchDays(): number {
  const n = Number(process.env.FACTS_REPROBE_TRANSIENT_FETCH_DAYS);
  if (Number.isFinite(n) && n >= 0) return n;
  return FACTS_REPROBE_TRANSIENT_FETCH_DAYS_DEFAULT;
}

export function factsReprobeThinLlmDays(): number {
  const n = Number(process.env.FACTS_REPROBE_THIN_LLM_DAYS);
  if (Number.isFinite(n) && n >= 0) return n;
  return FACTS_REPROBE_THIN_LLM_DAYS_DEFAULT;
}

export function landingFactsReprobePerTick(): number {
  const n = Number(process.env.LANDING_FACTS_REPROBE_PER_TICK);
  if (Number.isFinite(n) && n >= 0) return Math.min(3, Math.floor(n));
  return 1;
}

/**
 * Days required before an exhausted row of a given class may soft-reprobe.
 * Returns 0 when class is never re-probed (or re-probe disabled).
 */
export function minReprobeAgeDaysForClass(cls: FactsExhaustClass): number {
  if (cls === "terminal_dead") return 0;
  if (cls === "transient_fetch") return factsReprobeTransientFetchDays();
  if (cls === "thin_llm" || cls === "other") return factsReprobeThinLlmDays();
  return 0;
}

/**
 * Soft re-probe eligibility for exhausted rows (landing or image).
 * terminal_dead: never (URL/hash change must reopen).
 * transient_fetch: after transient TTL (default 7d).
 * thin_llm / other: after thin TTL (default 14d).
 */
export function shouldReprobeExhaustedFacts(opts: {
  status: string;
  exhaustClass: FactsExhaustClass;
  updatedAt: string | null | undefined;
  now?: number;
  /** Override min age days (tests). 0 disables. */
  minAgeDays?: number;
}): boolean {
  if (opts.status !== "exhausted") return false;
  if (opts.exhaustClass === "terminal_dead") return false;
  const minAgeDays = opts.minAgeDays ?? minReprobeAgeDaysForClass(opts.exhaustClass);
  if (minAgeDays <= 0) return false;
  const updated = opts.updatedAt ? Date.parse(opts.updatedAt) : NaN;
  if (!Number.isFinite(updated)) return false;
  const now = opts.now ?? Date.now();
  return now - updated >= minAgeDays * 24 * 60 * 60 * 1000;
}

/** Empty counter map for exhaust class breakdowns (warehouse or fresh). */
export function emptyFactsExhaustClassCounts(): Record<FactsExhaustClass, number> {
  return { terminal_dead: 0, transient_fetch: 0, thin_llm: 0, other: 0 };
}

/**
 * Count exhausted rows eligible for soft re-probe (transient/thin after TTL).
 * Pure helper for ops metrics + tests — drains use the same rules.
 */
export function countReprobeEligible(
  rows: Array<{
    status: string;
    exhaustClass: FactsExhaustClass;
    updatedAt: string | null | undefined;
  }>,
  now?: number,
): number {
  let n = 0;
  for (const row of rows) {
    if (
      shouldReprobeExhaustedFacts({
        status: row.status,
        exhaustClass: row.exhaustClass,
        updatedAt: row.updatedAt,
        now,
      })
    ) {
      n += 1;
    }
  }
  return n;
}
