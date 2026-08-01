/**
 * Swiss locale smoke — recenze-ceny.cz
 * Usage: node scripts/smoke-cz.mjs [--base=https://recenze-ceny.cz]
 */
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7)?.replace(/\/$/, "") ||
  process.env.CZ_WORKERS_DEV_BASE?.replace(/\/$/, "") ||
  "https://recenze-ceny.cz";

const ERROR_MARKERS = ["Etwas ist schiefgelaufen", "Seite konnte nicht geladen werden", "Coś poszło nie tak"];
const PL_MARKERS = ["Płatność przy odbiorze", "Zamów", "Polsce", "zł", "Strona główna", "Coś poszło"];
const SL_MARKERS = ["Plačilo ob prevzemu", "Ljubljana", "Slovenij"];
const AT_LEAK_MARKERS = [
  "meinungcheck.at",
  "Meinung Check",
  "Österreich",
  "Renngasse",
  "+43",
  "1010 Wien",
];
const DE_LEAK_MARKERS = [
  "erfahrungen-check.de",
  "Erfahrungen Check",
  "Deutschland",
  "Berlin, 10997",
  "Eisenbahnstraße",
  "Partner DE",
  "Lager DE",
  "Versand aus DE-Lager",
  "DE-Vertrieb",
  "Online-Shop DE",
  'geo.placename", content: "Germany"',
  'geo.region", content: "DE"',
  "dr. Carmen Ruiz",
];
const productLinkRe = /href="(\/[^"]+\/[^"]+-g\d+)"/g;

const staticPaths = [
  "/",
  "/category",
  "/category/joint-care",
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
  "/favicon.ico",
  "/favicon.png",
];

let fail = 0;

function checkLocaleLeaks(url, html) {
  for (const [label, markers] of [
    ["PL", PL_MARKERS],
    ["SL", SL_MARKERS],
    ["AT", AT_LEAK_MARKERS],
    ["DE", DE_LEAK_MARKERS],
  ]) {
    for (const marker of markers) {
      if (html.includes(marker)) {
        console.log(`FAIL ${url} — ${label} leakage: ${marker}`);
        fail += 1;
        return false;
      }
    }
  }
  return true;
}

async function checkUrl(url, { expectHtml = false, allow404 = false } = {}) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    const ok = res.status >= 200 && res.status < 400;
    const softOk = allow404 && res.status === 404;
    console.log(`${ok || softOk ? "OK" : "FAIL"} ${res.status} ${url}${softOk ? " (empty shelf — OK at launch)" : ""}`);
    if (!ok && !softOk) {
      fail += 1;
      return null;
    }
    if (expectHtml) {
      const html = await res.text();
      for (const marker of ERROR_MARKERS) {
        if (html.includes(marker)) {
          console.log(`FAIL ${url} — error boundary: ${marker}`);
          fail += 1;
          return null;
        }
      }
      checkLocaleLeaks(url, html);
      return html;
    }
    return null;
  } catch (e) {
    fail += 1;
    console.log(`FAIL ${url}`, e.message);
    return null;
  }
}

for (const p of staticPaths) {
  const expectHtml =
    p.endsWith(".xml") || p.endsWith(".txt") || p.endsWith(".ico") || p.endsWith(".png")
      ? false
      : true;
  await checkUrl(`${base}${p}`, {
    expectHtml,
    allow404: p.startsWith("/category/") && p !== "/category",
  });
}

const categoryHtml = await checkUrl(`${base}/category/joint-care`, { expectHtml: true, allow404: true });
if (categoryHtml) {
  const links = new Set();
  let m;
  while ((m = productLinkRe.exec(categoryHtml)) !== null && links.size < 5) {
    links.add(m[1]);
  }
  if (links.size === 0) {
    console.warn("WARN: no product links on /category/joint-care");
  } else {
    for (const path of links) {
      await checkUrl(`${base}${path}`, { expectHtml: true });
    }
  }
}

if (fail) process.exit(1);
console.log("\nSmoke CH OK");
