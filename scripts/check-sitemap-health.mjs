/**
 * Quick sitemap health — 5 consecutive requests, fail if any non-200 or empty.
 * Usage: node scripts/check-sitemap-health.mjs [--base=https://recenze-ceny.cz]
 */
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7)?.replace(/\/$/, "") ||
  "https://recenze-ceny.cz";
const timeoutMs = Number(process.argv.find((a) => a.startsWith("--timeout-ms="))?.slice(13) || "20000");

let fail = 0;
for (let i = 1; i <= 5; i++) {
  try {
    const res = await fetch(`${base}/sitemap.xml`, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": "recenze-ceny-healthcheck/1.0" },
    });
    const text = await res.text();
    const urls = (text.match(/<loc>/g) ?? []).length;
    const ok = res.status === 200 && urls >= 10;
    console.log(`${ok ? "OK" : "FAIL"} attempt ${i}: ${res.status} (${urls} URLs)`);
    if (!ok) fail += 1;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.log(`FAIL attempt ${i}: ${message}`);
    fail += 1;
  }
  if (i < 5) {
    await new Promise((resolve) => setTimeout(resolve, 1100 * i));
  }
}
process.exit(fail > 0 ? 1 : 0);
