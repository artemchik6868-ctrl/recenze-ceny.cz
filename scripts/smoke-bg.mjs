/**
 * Czech Republicn locale smoke — recenze-ceny.cz
 * Usage: node scripts/smoke-cz.mjs [--base=https://recenze-ceny.cz]
 */
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7)?.replace(/\/$/, "") ||
  "https://recenze-ceny.cz";

const ERROR_MARKERS = ["Нещо се обърка", "Ceva nu a mers bine", "Coșul nu poate fi încărcat"];
const RO_MARKERS = ["Plata la livrare", "în Česká republika", "Categorii", "Despre noi", "dumneavoastră", "livrare în"];
const DE_MARKERS = ["Zahlung bei Lieferung", "Startseite", "Schweiz"];

const staticPaths = [
  "/",
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
  for (const marker of [...RO_MARKERS, ...DE_MARKERS]) {
    if (html.includes(marker)) {
      console.log(`FAIL ${url} — locale leakage: ${marker}`);
      fail += 1;
      return false;
    }
  }
  return true;
}

async function checkUrl(url, { expectHtml = false, attempts = 3 } = {}) {
  for (let tryNo = 1; tryNo <= attempts; tryNo++) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      const ok = res.status >= 200 && res.status < 400;
      if (!ok) {
        if (tryNo < attempts) continue;
        console.log(`FAIL ${res.status} ${url}`);
        fail += 1;
        return null;
      }
      if (!expectHtml) {
        console.log(`OK ${res.status} ${url}`);
        return null;
      }
      const html = await res.text();
      console.log(`OK ${res.status} ${url}`);
      for (const marker of ERROR_MARKERS) {
        if (html.includes(marker)) {
          console.log(`FAIL ${url} — error marker: ${marker}`);
          fail += 1;
        }
      }
      checkLocaleLeaks(url, html);
      if (!html.includes('lang="bg"') && !html.includes("cs-CZ")) {
        console.log(`WARN ${url} — missing lang=bg`);
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

console.log(`smoke-bg base=${base}\n`);
for (const p of staticPaths) {
  await checkUrl(`${base}${p}`, { expectHtml: !p.endsWith(".xml") && !p.endsWith(".txt") });
}

if (fail) {
  console.log(`\nsmoke-bg: ${fail} failure(s)`);
  process.exit(1);
}
console.log("\nsmoke-bg: OK");
