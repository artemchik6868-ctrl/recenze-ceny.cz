/**
 * Polish locale smoke — recenze-ceny.cz
 * Usage: node scripts/smoke-pl.mjs [--base=https://recenze-ceny.cz]
 */
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7)?.replace(/\/$/, "") ||
  "https://recenze-ceny.cz";

const ERROR_MARKERS = ["Coś poszło nie tak", "Nie można załadować tej strony"];
const SL_MARKERS = ["Plačilo ob prevzemu", "Naročite", "Ljubljana", "Slovenij", "Informacije o", "izdelek", "naravno dopolnilo"];
const IT_MARKERS = ["Servizio temporaneamente", "Offerta non trovata", "Consegna e pagamento in Italia"];
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
  for (const marker of SL_MARKERS) {
    if (html.includes(marker)) {
      console.log(`FAIL ${url} — SL leakage: ${marker}`);
      fail += 1;
      return false;
    }
  }
  for (const marker of IT_MARKERS) {
    if (html.includes(marker)) {
      console.log(`FAIL ${url} — IT leakage: ${marker}`);
      fail += 1;
      return false;
    }
  }
  return true;
}

async function checkUrl(url, { expectHtml = false } = {}) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    const ok = res.status >= 200 && res.status < 400;
    console.log(`${ok ? "OK" : "FAIL"} ${res.status} ${url}`);
    if (!ok) {
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
  await checkUrl(`${base}${p}`, { expectHtml });
}

const categoryHtml = await checkUrl(`${base}/category/joint-care`, { expectHtml: true });
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
console.log("\nSmoke PL OK");
