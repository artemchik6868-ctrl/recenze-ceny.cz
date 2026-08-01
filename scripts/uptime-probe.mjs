/**
 * Lightweight uptime probe — home + /api/public/health with retries (anti-flap).
 * Usage: node scripts/uptime-probe.mjs [--base=https://recenze-ceny.cz] [--attempts=3]
 * Exit 0 on success, 1 on failure (after all retries).
 * Prints JSON summary on last line for workflow parsing: UPTIME_RESULT:{...}
 */
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7)?.replace(/\/$/, "") ||
  "https://recenze-ceny.cz";
const attempts = Number(
  process.argv.find((a) => a.startsWith("--attempts="))?.slice(11) || "3",
);

const PATHS = [
  { path: "/", kind: "html" },
  { path: "/api/public/health", kind: "health" },
];
const TIMEOUT_MS = 15_000;

async function probeOnce({ path, kind }) {
  const url = `${base}${path}`;
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": "recenze-ceny-uptime-probe/1.0" },
    });
    const ms = Date.now() - t0;
    if (res.status < 200 || res.status >= 400) {
      return { url, ok: false, status: res.status, ms, error: `HTTP ${res.status}` };
    }
    if (kind === "health") {
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) {
        const json = await res.json().catch(() => null);
        if (!json || json.ok !== true) {
          return { url, ok: false, status: res.status, ms, error: "health body not ok" };
        }
      } else {
        // Pre-deploy: catch-all may return HTML 200. Soft-ok so we don't false-alarm.
        console.warn(`WARN ${url} — health not JSON yet (${ct || "no ct"}); treating as soft-ok`);
      }
    }
    return { url, ok: true, status: res.status, ms, error: null };
  } catch (e) {
    return {
      url,
      ok: false,
      status: 0,
      ms: Date.now() - t0,
      error: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function probeRound() {
  const results = [];
  for (const p of PATHS) {
    results.push(await probeOnce(p));
  }
  return results;
}

function summarize(results) {
  return results
    .map((r) =>
      r.ok
        ? `OK ${r.status} ${r.ms}ms ${r.url}`
        : `FAIL ${r.status || "err"} ${r.ms}ms ${r.url}${r.error ? ` (${r.error})` : ""}`,
    )
    .join("\n");
}

let lastResults = [];
let passed = false;

for (let i = 1; i <= attempts; i++) {
  lastResults = await probeRound();
  const allOk = lastResults.every((r) => r.ok);
  console.log(`uptime-probe attempt ${i}/${attempts}\n${summarize(lastResults)}`);
  if (allOk) {
    passed = true;
    break;
  }
  if (i < attempts) {
    await new Promise((r) => setTimeout(r, 2000 * i));
  }
}

const payload = {
  ok: passed,
  base,
  results: lastResults,
  at: new Date().toISOString(),
};
console.log(`UPTIME_RESULT:${JSON.stringify(payload)}`);

if (!passed) {
  console.error("\nuptime-probe: FAIL");
  process.exit(1);
}
console.log("\nuptime-probe: OK");
