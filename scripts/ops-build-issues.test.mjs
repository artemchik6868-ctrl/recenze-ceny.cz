/**
 * Tier B vs warehouse: warehouse counts must not page; fresh counts must.
 * Run: node scripts/ops-build-issues.test.mjs
 */
import assert from "node:assert/strict";
import {
  buildIssuesFromStatus,
  fingerprintIssues,
  isWarehouseStockAlert,
} from "./ops-build-issues.mjs";

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

/** Current prod-like warehouse stock (not an incident). */
const warehouseStatus = {
  ok: true,
  alerts: ["shakes: 1 offers have repeated AI failures"],
  totals: {
    missing_content: 0,
    stale_content: 0,
    repeated_failures: 1,
    facts_pending: 0,
    cooldown_blocked: 0,
  },
  ops: {
    stale_content: 0,
    repeated_failures: 1,
    feed_wave_error: null,
    feed_wave_stale: false,
    indexing_errors_24h: 5,
    indexing_rate_limited_24h: 30,
    indexing_config_skips_24h: 0,
    indexing_error_samples: [],
    inspect_errors_24h: 0,
    image_facts_high_fail: 0,
    image_facts_exhausted: 7,
    image_facts_fetch_error: 0,
    image_facts_exhausted_fresh: 0,
    image_facts_fetch_error_fresh: 0,
    image_facts_llm_exhausted: 7,
    image_facts_exhausted_by_class: {
      terminal_dead: 0,
      transient_fetch: 0,
      thin_llm: 7,
      other: 0,
    },
    image_facts_error_samples: ["exhausted:max_llm_per_image"],
    landing_facts_high_fail: 10,
    landing_facts_retryable: 0,
    landing_facts_exhausted: 10,
    landing_facts_retryable_fresh: 0,
    landing_facts_exhausted_fresh: 0,
    landing_facts_exhausted_by_class: {
      terminal_dead: 3,
      transient_fetch: 7,
      thin_llm: 0,
      other: 0,
    },
    landing_facts_error_samples: [],
    image_facts_reprobe_eligible: 4,
    landing_facts_reprobe_eligible: 7,
    gsc_sitemap_errors: 0,
    gsc_sitemap_error: null,
    gsc_sitemap_skipped: null,
  },
};

ok("warehouse stock ≥5 does not page", () => {
  const issues = buildIssuesFromStatus(warehouseStatus);
  assert.deepEqual(
    issues.map((i) => i.code),
    [],
    JSON.stringify(issues),
  );
  assert.equal(fingerprintIssues(issues), "");
});

ok("fresh image fetch_error ≥5 pages", () => {
  const status = structuredClone(warehouseStatus);
  status.ops.image_facts_fetch_error_fresh = 7;
  const issues = buildIssuesFromStatus(status);
  assert.ok(issues.some((i) => i.code === "image_facts_fetch"));
  assert.ok(!issues.some((i) => /circuit/i.test(i.text)));
});

ok("fresh image exhausted ≥5 pages with fresh class", () => {
  const status = structuredClone(warehouseStatus);
  status.ops.image_facts_exhausted_fresh = 6;
  status.ops.image_facts_exhausted_fresh_by_class = {
    terminal_dead: 0,
    transient_fetch: 1,
    thin_llm: 5,
    other: 0,
  };
  const issues = buildIssuesFromStatus(status);
  assert.ok(issues.some((i) => i.code === "image_facts_exhausted_fresh"));
  assert.ok(issues[0].text.includes("thin_llm=5"));
});

ok("fresh landing retryable ≥5 pages", () => {
  const status = structuredClone(warehouseStatus);
  status.ops.landing_facts_retryable_fresh = 8;
  const issues = buildIssuesFromStatus(status);
  assert.ok(issues.some((i) => i.code === "landing_facts_retryable"));
});

ok("fresh landing exhausted ≥5 pages", () => {
  const status = structuredClone(warehouseStatus);
  status.ops.landing_facts_exhausted_fresh = 5;
  status.ops.landing_facts_exhausted_fresh_by_class = {
    terminal_dead: 0,
    transient_fetch: 5,
    thin_llm: 0,
    other: 0,
  };
  const issues = buildIssuesFromStatus(status);
  assert.ok(issues.some((i) => i.code === "landing_facts_exhausted_fresh"));
});

ok("legacy warehouse alert strings detected", () => {
  assert.equal(
    isWarehouseStockAlert(
      "image-facts: 7 rows status exhausted/fetch_error (circuit risk)",
    ),
    true,
  );
  assert.equal(
    isWarehouseStockAlert("landing-facts: 10 rows with fail_count≥3 or exhausted"),
    true,
  );
  assert.equal(
    isWarehouseStockAlert("Image-facts: 7 строк exhausted/fetch_error (риск circuit breaker)"),
    true,
  );
  assert.equal(
    isWarehouseStockAlert("shakes: 1 offers have repeated AI failures"),
    false,
  );
});

ok("repeated AI ≥3 pages, 1 does not", () => {
  assert.equal(buildIssuesFromStatus(warehouseStatus).length, 0);
  const status = structuredClone(warehouseStatus);
  status.ops.repeated_failures = 3;
  status.totals.repeated_failures = 3;
  const issues = buildIssuesFromStatus(status);
  assert.ok(issues.some((i) => i.code === "ai_failures"));
});

ok("rate_limited-only indexing does not page (hard errors do)", () => {
  // pipeline-status already splits; rate_limited must not inflate indexing_errors_24h.
  const rateOnly = structuredClone(warehouseStatus);
  rateOnly.ops.indexing_errors_24h = 0;
  rateOnly.ops.indexing_rate_limited_24h = 30;
  assert.equal(buildIssuesFromStatus(rateOnly).length, 0);

  const hard = structuredClone(warehouseStatus);
  hard.ops.indexing_errors_24h = 12;
  hard.ops.indexing_rate_limited_24h = 30;
  hard.ops.indexing_error_samples = ["google:502 upstream"];
  const issues = buildIssuesFromStatus(hard);
  assert.ok(issues.some((i) => i.code === "indexing_errors"));
  assert.ok(issues[0].text.includes("502"));
});

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nops-build-issues.test.mjs: OK");
