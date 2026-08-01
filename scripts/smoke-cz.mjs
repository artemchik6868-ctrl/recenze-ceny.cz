/**
 * Czech locale smoke — recenze-ceny.cz
 * Usage: node scripts/smoke-cz.mjs [--base=https://recenze-ceny.cz]
 */
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7)?.replace(/\/$/, "") ||
  "https://recenze-ceny.cz";

const ERROR_MARKERS = ["Нещо се обърка", "Ceva nu a mers bine", "Coșul nu poate fi încărcat"];
const RO_MARKERS = ["Plata la livrare", "Categorii", "Despre noi", "dumneavoastră", "livrare în"];
const HU_MARKERS = ["Utánvétes fizetés", "Magyarországon", "Kategóriák", "Kezdőlap", "VelemenyLab"];
const DE_MARKERS = ["Zahlung bei Lieferung", "Startseite", "Schweiz"];

const staticPaths = [
  "/",
  "/api/public/health",
  "/category",
  "/about",
  "/contact",
  "/faq",
  "/delivery",
  "/payment",
  "/returns",
  "/privacy",
  "/terms",
  "/medical-expert",
  "/sitemap.xml",
  "/robots.txt",
];

let fail = 0;

function checkLocaleLeaks(url, html) {
  for (const marker of [...RO_MARKERS, ...DE_MARKERS, ...HU_MARKERS]) {
    if (html.includes(marker)) {
      console.log(`FAIL ${url} — locale leakage: ${marker}`);
      fail += 1;
      return false;
    }
  }
  return true;
}

async function checkUrl(url, { expectHtml = false, expectJsonOk = false, attempts = 3 } = {}) {
  for (let tryNo = 1; tryNo <= attempts; tryNo++) {
    const t0 = Date.now();
    try {
      const res = await fetch(url, { redirect: "follow" });
      const ms = Date.now() - t0;
      const ok = res.status >= 200 && res.status < 400;
      if (!ok) {
        if (tryNo < attempts) continue;
        console.log(`FAIL ${res.status} ${ms}ms ${url}`);
        fail += 1;
        return null;
      }
      if (expectJsonOk) {
        const ct = res.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) {
          // Pre-deploy catch-all may still return HTML 200 — warn, don't fail smoke.
          console.log(`WARN ${res.status} ${ms}ms ${url} — health not JSON yet (${ct || "no ct"})`);
          return null;
        }
        const json = await res.json().catch(() => null);
        if (!json || json.ok !== true) {
          console.log(`FAIL ${res.status} ${ms}ms ${url} — health body not ok`);
          fail += 1;
          return null;
        }
        console.log(`OK ${res.status} ${ms}ms ${url}`);
        return json;
      }
      if (!expectHtml) {
        console.log(`OK ${res.status} ${ms}ms ${url}`);
        return null;
      }
      const html = await res.text();
      console.log(`OK ${res.status} ${ms}ms ${url}`);
      for (const marker of ERROR_MARKERS) {
        if (html.includes(marker)) {
          console.log(`FAIL ${url} — error marker: ${marker}`);
          fail += 1;
        }
      }
      checkLocaleLeaks(url, html);
      if (!html.includes('lang="cs"') && !html.includes("cs-CZ")) {
        console.log(`WARN ${url} — missing lang=cs`);
      }
      return html;
    } catch (e) {
      if (tryNo < attempts) {
        await new Promise((r) => setTimeout(r, 1500 * tryNo));
        continue;
      }
      console.log(`FAIL ${url} — ${e.message}`);
      fail += 1;
      return null;
    }
  }
  return null;
}

console.log(`smoke-cz base=${base}\n`);
for (const p of staticPaths) {
  const isHealth = p === "/api/public/health";
  const isAsset = p.endsWith(".xml") || p.endsWith(".txt");
  await checkUrl(`${base}${p}`, {
    expectHtml: !isAsset && !isHealth,
    expectJsonOk: isHealth,
  });
}

if (fail) {
  console.log(`\nsmoke-cz: ${fail} failure(s)`);
  process.exit(1);
}
console.log("\nsmoke-cz: OK");
