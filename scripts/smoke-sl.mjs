/**
 * Slovenian locale smoke — recenze-ceny.cz
 * Usage: node scripts/smoke-sl.mjs [--base=https://recenze-ceny.cz]
 */
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7)?.replace(/\/$/, "") ||
  "https://recenze-ceny.cz";

const paths = ["/", "/category", "/sitemap.xml", "/robots.txt"];

let fail = 0;
for (const p of paths) {
  const url = `${base}${p}`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    const ok = res.status >= 200 && res.status < 400;
    console.log(`${ok ? "OK" : "FAIL"} ${res.status} ${url}`);
    if (!ok) fail += 1;
    if (p === "/" && ok) {
      const html = await res.text();
      if (!html.includes("sl") && !html.includes("Najbolj")) {
        console.warn("WARN: homepage may not be Slovenian-branded");
      }
    }
  } catch (e) {
    fail += 1;
    console.log(`FAIL ${url}`, e.message);
  }
}

if (fail) process.exit(1);
console.log("\nSmoke SL OK");
