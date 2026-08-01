/**
 * Smoke test: CZ category page meta (title, description) without locale leaks.
 * Run: npm run test:seo-meta-category-cz
 */
import { buildCategoryHeadMeta } from "../src/lib/category-page-meta.ts";

const HU_LEAK = [
  /\btermék\b/i,
  /\boldalon\b/i,
  /\bHogyan válasszon\b/i,
  /\bMinőséggarancia\b/i,
  /\butánvétes\b/i,
  /\bSzállítás\b/i,
  /\bRendeljen\b/i,
];

const mockOffers = (slug, count, price = 690) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${slug}-${i}`,
    slug: `product-${i}`,
    categorySlug: slug,
    title: `Test Product ${i}`,
    displayTitle: `Test Product ${i}`,
    priceEUR: price + i * 10,
    aiCategoryResolved: true,
    contentGeneratedAt: "2026-01-01T00:00:00Z",
    image: "/test.jpg",
    formKind: "capsules",
  }));

const cases = [
  { slug: "klouby", offers: mockOffers("klouby", 5, 589) },
  { slug: "potence", offers: mockOffers("potence", 3, 790) },
  { slug: "sluch", offers: mockOffers("sluch", 4, 650) },
  { slug: "alkoholismus", offers: mockOffers("alkoholismus", 2, 690) },
  { slug: "zahradni-naradi", offers: mockOffers("zahradni-naradi", 4, 490) },
  { slug: "domaci-vychytavky", offers: mockOffers("domaci-vychytavky", 3, 179) },
  { slug: "osobni-pece", offers: mockOffers("osobni-pece", 2, 990) },
  { slug: "domaci-potreby", offers: mockOffers("domaci-potreby", 3, 1759) },
  { slug: "autodoplnky", offers: mockOffers("autodoplnky", 2, 990) },
  { slug: "empty-cat", offers: [] },
];

let fail = 0;
for (const c of cases) {
  const meta = buildCategoryHeadMeta({ slug: c.slug, offers: c.offers, lang: "cs" });
  if (!meta.title || meta.title.length < 10) {
    console.log(`FAIL ${c.slug}: title too short`);
    fail += 1;
    continue;
  }
  if (!meta.description || meta.description.length < 40) {
    console.log(`FAIL ${c.slug}: desc too short`);
    fail += 1;
    continue;
  }
  if (!meta.h1 || meta.h1.length < 3) {
    console.log(`FAIL ${c.slug}: h1 missing — ${meta.h1}`);
    fail += 1;
  }
  // Allow SERP-style single-phrase H1 (multi-word KW) OR classic «Name — keyword».
  const h1Ok =
    meta.h1.includes("—") ||
    meta.h1.trim().split(/\s+/).length >= 2 ||
    meta.h1.length >= 8;
  if (!h1Ok) {
    console.log(`FAIL ${c.slug}: h1 too weak — ${meta.h1}`);
    fail += 1;
  }
  const h1Parts = meta.h1.split("—").map((s) => s.trim().toLowerCase());
  if (h1Parts.length >= 2 && h1Parts[0] === h1Parts[1]) {
    console.log(`FAIL ${c.slug}: h1 keyword duplicates name — ${meta.h1}`);
    fail += 1;
  }
  if (c.slug === "zahradni-naradi") {
    const blob = `${meta.h1} ${meta.title} ${meta.description}`.toLowerCase();
    if (
      /\bpohodu\b/.test(blob) ||
      /lampy|kdy k lékaři|doplněk stravy/.test(blob) ||
      !/zahradní nářad/.test(blob)
    ) {
      console.log(`FAIL ${c.slug}: expected garden-tools hub meta, got h1=${meta.h1}`);
      fail += 1;
    }
  }
  if (c.slug === "domaci-vychytavky") {
    const blob = `${meta.h1} ${meta.title} ${meta.description}`.toLowerCase();
    if (!/vychytávk|gadget/.test(blob) || /kdy k lékaři|doplněk stravy/.test(blob)) {
      console.log(`FAIL ${c.slug}: expected gadget hub meta, got h1=${meta.h1}`);
      fail += 1;
    }
  }
  if (c.slug === "osobni-pece") {
    const blob = `${meta.h1} ${meta.title} ${meta.description}`.toLowerCase();
    if (
      !/přístroje pro osobní péči|osobní péči/.test(blob) ||
      /kdy k lékaři|doplněk stravy/.test(blob)
    ) {
      console.log(`FAIL ${c.slug}: expected personal-grooming hub meta, got h1=${meta.h1}`);
      fail += 1;
    }
  }
  if (c.slug === "domaci-potreby") {
    const blob = `${meta.h1} ${meta.title} ${meta.description}`.toLowerCase();
    if (
      !/domácí potřeb/.test(blob) ||
      /kdy k lékaři|doplněk stravy|medical expert/.test(blob)
    ) {
      console.log(`FAIL ${c.slug}: expected household hub meta, got h1=${meta.h1}`);
      fail += 1;
    }
  }
  if (c.slug === "autodoplnky") {
    const blob = `${meta.h1} ${meta.title} ${meta.description}`.toLowerCase();
    if (
      !/autodoplňk/.test(blob) ||
      /kdy k lékaři|doplněk stravy|medical expert|zdravotní/.test(blob)
    ) {
      console.log(`FAIL ${c.slug}: expected auto hub meta, got h1=${meta.h1}`);
      fail += 1;
    }
  }
  if (c.slug === "alkoholismus") {
    const blob = `${meta.h1} ${meta.title} ${meta.description}`.toLowerCase();
    if (!/odvykání alkoholu|alkohol/.test(blob) || !/doplňky stravy/.test(blob)) {
      console.log(`FAIL ${c.slug}: expected alcoholism commercial KW, got h1=${meta.h1}`);
      fail += 1;
    }
  }
  if (c.slug === "klouby") {
    const primaryKw = "doplňky stravy na klouby";
    const kwHits = meta.description.toLowerCase().split(primaryKw).length - 1;
    if (kwHits >= 2) {
      console.log(`FAIL ${c.slug}: primary KW repeated in description — ${meta.description}`);
      fail += 1;
    }
    if (meta.title.length > 60) {
      console.log(`FAIL ${c.slug}: title too long (${meta.title.length}) — ${meta.title}`);
      fail += 1;
    }
    if (!/recenze|srovnání|od\s+\d/i.test(meta.title)) {
      console.log(`FAIL ${c.slug}: title missing Recenze/Srovnání/od — ${meta.title}`);
      fail += 1;
    }
  }
  for (const re of HU_LEAK) {
    if (re.test(meta.title) || re.test(meta.description)) {
      console.log(`FAIL ${c.slug}: locale leak ${re}`);
      fail += 1;
    }
  }
  if (c.offers.length && !/Kč|od\s+\d/i.test(meta.title + meta.description)) {
    console.log(`FAIL ${c.slug}: missing CZK phrasing`);
    fail += 1;
  } else {
    console.log(`OK ${c.slug}: ${meta.title.slice(0, 55)}…`);
  }
}

if (fail) {
  console.log(`\ntest:seo-meta-category-cz: ${fail} failure(s)`);
  process.exit(1);
}
console.log("\ntest:seo-meta-category-cz: OK");
