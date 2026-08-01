/**
 * Czech Republicn locale smoke — recenze-ceny.cz
 * Usage: node scripts/smoke-cz.mjs [--base=https://recenze-ceny.cz]
 */
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7)?.replace(/\/$/, "") ||
  "https://recenze-ceny.cz";

const ERROR_MARKERS = ["Ceva nu a mers bine", "Coșul nu poate fi încărcat", "Coś poszło nie tak"];
const DE_MARKERS = ["Zahlung bei Lieferung", "Startseite", "Schweiz", "Bitte geben Sie", "Allgemeine Geschäftsbedingungen"];
const SL_MARKERS = ["Plačilo ob prevzemu", "Slovenij"];

const staticPaths = [
  "/",
  "/category",
  // Populated after first feed sync; 404 is OK on empty catalog.
  // "/category/joint-care",
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
  for (const marker of [...DE_MARKERS, ...SL_MARKERS]) {
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
      if (!html.includes('lang="ro"') && !html.includes("cs-CZ")) {
        console.log(`WARN ${url} — missing lang=ro`);
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

console.log(`smoke-ro base=${base}\n`);
for (const p of staticPaths) {
  await checkUrl(`${base}${p}`, { expectHtml: !p.endsWith(".xml") && !p.endsWith(".txt") });
}

if (fail) {
  console.log(`\nsmoke-ro: ${fail} failure(s)`);
  process.exit(1);
}
console.log("\nsmoke-ro: OK");
