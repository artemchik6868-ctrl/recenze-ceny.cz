/**
 * ES storefront smoke — HTML checks for Spanish locale (no IT leakage).
 * Usage: node scripts/smoke-es.mjs [url]
 * Default: workers.dev + recenze-ceny.cz
 */
const urls = process.argv[2]
  ? [process.argv[2]]
  : [
      "https://product-reviews.farmserverfarmserver.workers.dev/",
      "https://recenze-ceny.cz/",
    ];

const IT_BAD = [
  "Pagamento alla",
  "Ordina oggi",
  "contrassegno",
  "corriere",
  "settimane",
  "integratore",
  "è un complemento",
  "La formula agisce",
  "In questa selezione trovi",
  "Cerchi «",
  "Spediamo con",
  "Italia",
  "Verificato",
  "Specifiche",
];

const ES_GOOD = [
  "es-ES",
  '"ES"',
  "areaServed",
  "Pago",
  "pago contra reembolso",
  "mensajería",
  "España",
];

const CATEGORY_PATHS = ["/category/joint-care", "/category/prostate-health"];

let failed = 0;

for (const base of urls) {
  const origin = base.replace(/\/$/, "");
  console.log("\n===", origin, "===");

  const home = await fetch(origin + "/").then((r) => r.text());
  const badHome = IT_BAD.filter((x) => home.includes(x));
  const goodHome = ES_GOOD.filter((x) => home.includes(x));
  console.log("home BAD:", badHome.length ? badHome : "none");
  console.log("home GOOD:", goodHome);

  if (badHome.length) failed++;
  if (!home.includes('"ES"') && !home.includes("areaServed")) {
    console.log("FAIL missing ES badge/schema on home");
    failed++;
  }

  for (const path of CATEGORY_PATHS) {
    const html = await fetch(origin + path).then((r) => r.text());
    const bad = IT_BAD.filter((x) => html.includes(x));
    const hasSubtitle =
      html.includes("cápsula") ||
      html.includes("cápsulas") ||
      html.includes("complemento") ||
      html.includes("próstata") ||
      html.includes("articulaciones");
    console.log(`${path} status snippets: subtitle-ish=${hasSubtitle} BAD=${bad.length ? bad : "none"}`);
    if (bad.length) failed++;
    if (!hasSubtitle) {
      console.log(`WARN ${path} — no expected Spanish category fragment (page may be empty)`);
    }
  }
}

process.exit(failed > 0 ? 1 : 0);
