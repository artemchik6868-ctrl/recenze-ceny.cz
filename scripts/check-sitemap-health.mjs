/**
 * Quick sitemap health — 5 consecutive light probes.
 * Fail only when ≥2 attempts fail, or the last attempt fails (majority / tail).
 * Usage: node scripts/check-sitemap-health.mjs [--base=https://recenze-ceny.cz]
 */
import {
  decideHardFail,
  probeSitemapLight,
} from "./lib/sitemap-probe.mjs";

const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7)?.replace(/\/$/, "") ||
  "https://recenze-ceny.cz";
const timeoutMs = Number(process.argv.find((a) => a.startsWith("--timeout-ms="))?.slice(13) || "20000");
const ATTEMPTS = 5;
/** Soft: a single flaky attempt must not page production health. */
const FAIL_IF_ATTEMPTS_GE = 2;

const fetchXml = (url, init = {}) =>
  fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "user-agent": "recenze-ceny-healthcheck/1.0", ...(init.headers ?? {}) },
    ...init,
  });

let fail = 0;
let lastOk = false;
for (let i = 1; i <= ATTEMPTS; i++) {
  try {
    const result = await probeSitemapLight(base, fetchXml);
    lastOk = result.ok;
    console.log(
      `${result.ok ? "OK" : "FAIL"} attempt ${i}: status=${result.status} index=${result.shards} shards, static=${result.staticUrls} URLs (${result.reason})`,
    );
    if (!result.ok) fail += 1;
  } catch (e) {
    lastOk = false;
    const message = e instanceof Error ? e.message : String(e);
    console.log(`FAIL attempt ${i}: ${message}`);
    fail += 1;
  }
  if (i < ATTEMPTS) {
    await new Promise((resolve) => setTimeout(resolve, 1100 * i));
  }
}

const hardFail = decideHardFail(fail, lastOk, FAIL_IF_ATTEMPTS_GE);
if (hardFail) {
  console.log(
    `sitemap-health: FAIL (failed_attempts=${fail}/${ATTEMPTS}, last_ok=${lastOk}; threshold≥${FAIL_IF_ATTEMPTS_GE} or last fail)`,
  );
  process.exit(1);
}
if (fail > 0) {
  console.log(
    `sitemap-health: OK with soft failures (failed_attempts=${fail}/${ATTEMPTS}, last_ok=true)`,
  );
} else {
  console.log(`sitemap-health: OK (${ATTEMPTS}/${ATTEMPTS})`);
}
process.exit(0);
