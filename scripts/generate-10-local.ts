/**
 * Local batch AI content generation (no Worker HTTP).
 *
 * Usage:
 *   npx tsx scripts/generate-10-local.ts --random --save-json
 *   npx tsx scripts/generate-10-local.ts --batch=2
 *   npx tsx scripts/generate-10-local.ts --random --seed=42 --include-existing
 *   npx tsx scripts/generate-10-local.ts --random --count=10 --save-json --stale-only
 *   npx tsx scripts/generate-10-local.ts --count=10 --include-existing --exclude-keys=cpa_tl:4973,kma:6423
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deliveryH2For } from "../src/lib/pdp-variants";
import {
  hasGermanLocaleLeak,
  hasPolishLocaleLeak,
  hasRomanianLocaleLeak,
  hasSlovenianLocaleLeak,
  RO_DELIVERY_CITY_RE,
} from "../src/lib/locale-leak-cz";
import type { Offer, OfferSource } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const SOURCES: OfferSource[] = ["cpa_tl", "kma", "m1_top", "cpagetti", "adcombo", "shakes"];
const PREFERRED_CATS = [
  "klouby", "prostata", "zrak", "domaci-klima", "masazni-pristroje",
  "zahrada", "krevni-tlak", "potence", "hracky", "obleceni",
  "lekarske-pristroje", "hubnuti", "domaci-vychytavky", "modni-doplnky", "paraziti",
  "stres", "cukrovka", "intimate-comfort", "skin-care", "vypadavani-vlasu",
  "sleep-relax", "imunita", "detox", "zdravi-zen",
];

function parseArg(name: string, fallback: string | null = null): string | null {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

function parseBatchArg(): number {
  return Math.max(1, Number(parseArg("batch", "1")) || 1);
}

function parseCountArg(): number {
  return Math.max(1, Number(parseArg("count", "10")) || 10);
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickDiverseOffers(allOffers: Offer[], skip: Set<string>, count = 10): Offer[] {
  const picked: Offer[] = [];
  const usedCats = new Set<string>();
  const isSkipped = (o: Offer) => skip.has(`${o.source}:${o.id}`);

  for (const source of SOURCES) {
    const pool = allOffers.filter((o) => o.source === source && !isSkipped(o));
    for (const cat of PREFERRED_CATS) {
      if (picked.length >= count) break;
      if (usedCats.has(cat)) continue;
      const o = pool.find((x) => x.categorySlug === cat);
      if (o) {
        picked.push(o);
        usedCats.add(cat);
        break;
      }
    }
  }

  for (const source of SOURCES) {
    if (picked.length >= count) break;
    const pool = allOffers.filter((o) => o.source === source && !isSkipped(o));
    for (const o of pool) {
      if (picked.length >= count) break;
      if (picked.some((p) => p.source === o.source && p.id === o.id)) continue;
      if (usedCats.has(o.categorySlug)) continue;
      picked.push(o);
      usedCats.add(o.categorySlug);
    }
  }

  for (const source of SOURCES) {
    if (picked.length >= count) break;
    const pool = allOffers.filter((o) => o.source === source && !isSkipped(o));
    for (const o of pool) {
      if (picked.length >= count) break;
      if (picked.some((p) => p.source === o.source && p.id === o.id)) continue;
      picked.push(o);
    }
  }

  return picked.slice(0, count);
}

function pickRandomOffers(allOffers: Offer[], skip: Set<string>, count: number, seed: number | null): Offer[] {
  const pool = allOffers.filter((o) => !skip.has(`${o.source}:${o.id}`));
  const rand = seed != null ? mulberry32(seed) : Math.random;
  return shuffle(pool, rand).slice(0, count);
}

const LEAK_RE =
  /\b(Indicaciones|Composición|Cómo tomarlo|¿|integratore|consegna|corriere|contrassegno|Información sobre|disponible para pedido|complemento alimenticio|Asesor|médico|Madrid|España)\b/i;

const CITY_RE = RO_DELIVERY_CITY_RE;
const PLACEHOLDER_RE = /\$\{[^}]+\}/;

const useRandom = process.argv.includes("--random");
const saveJson = process.argv.includes("--save-json");
const batchNum = parseBatchArg();
const batchCount = parseCountArg();
const seedRaw = parseArg("seed");
const seed = seedRaw != null && seedRaw !== "" ? Number(seedRaw) : null;
const skipGenerated = !process.argv.includes("--include-existing");
const staleOnly = process.argv.includes("--stale-only");
const forcedExcludeKeys = new Set<string>();
const excludeKeysArg = parseArg("exclude-keys");
if (excludeKeysArg) {
  for (const key of excludeKeysArg.split(",")) {
    const k = key.trim();
    if (k) forcedExcludeKeys.add(k);
  }
}

const { loadOffers } = await import("../src/lib/offers.server.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
const { getOrGenerateProductContentDetailed, PIPELINE_VERSION, deriveContentTier } = await import(
  "../src/lib/ai-content.server.ts"
);
const allOffersList = await loadOffers();

async function buildStaleKeys(): Promise<Set<string>> {
  const staleKeys = new Set<string>();
  const briefKeys = new Set<string>();
  const { data: briefs } = await supabaseAdmin
    .from("product_briefs")
    .select("source, offer_id, pipeline_version");
  for (const row of briefs ?? []) {
    const r = row as { source: string; offer_id: number; pipeline_version: string | null };
    const key = `${r.source}:${r.offer_id}`;
    briefKeys.add(key);
    if (r.pipeline_version !== PIPELINE_VERSION) staleKeys.add(key);
  }
  const { data: withContent } = await supabaseAdmin
    .from("product_content")
    .select("source, offer_id")
    .not("description_html_uk", "is", null);
  for (const row of withContent ?? []) {
    const r = row as { source: string; offer_id: number };
    const key = `${r.source}:${r.offer_id}`;
    if (!briefKeys.has(key)) staleKeys.add(key);
  }
  return staleKeys;
}

const skipKeys = new Set<string>();
let poolMode = "missing-html";
if (skipGenerated) {
  const { data: existing } = await supabaseAdmin
    .from("product_content")
    .select("source,offer_id")
    .not("description_html_uk", "is", null);
  for (const row of existing ?? []) {
    const r = row as { source: string; offer_id: number };
    if (r.source && r.offer_id != null) skipKeys.add(`${r.source}:${r.offer_id}`);
  }
  console.log(`Skipping ${skipKeys.size} offers with existing HTML content`);

  const missingHtmlCount = allOffersList.filter((o) => !skipKeys.has(`${o.source}:${o.id}`)).length;
  if (missingHtmlCount === 0 && staleOnly) {
    const staleKeys = await buildStaleKeys();
    skipKeys.clear();
    for (const o of allOffersList) {
      const key = `${o.source}:${o.id}`;
      if (!staleKeys.has(key)) skipKeys.add(key);
    }
    poolMode = "stale-pipeline";
    console.log(`Stale pipeline pool: ${allOffersList.length - skipKeys.size} offers (pipeline !== ${PIPELINE_VERSION})`);
  }
} else {
  poolMode = "include-existing";
}

for (const key of forcedExcludeKeys) skipKeys.add(key);
if (forcedExcludeKeys.size > 0) {
  console.log(`Forced exclude: ${forcedExcludeKeys.size} offer keys`);
}

const poolSize = allOffersList.filter((o) => !skipKeys.has(`${o.source}:${o.id}`)).length;
console.log(`Pool size (eligible): ${poolSize} [${poolMode}]`);

if (poolSize === 0) {
  console.log(
    staleOnly
      ? "No eligible offers (missing HTML or stale pipeline)."
      : "Pool empty. Add --stale-only to regenerate outdated pipeline content.",
  );
  process.exit(0);
}

const BATCH = useRandom
  ? pickRandomOffers(allOffersList, skipKeys, batchCount, seed)
  : pickDiverseOffers(allOffersList, skipKeys, batchCount);

console.log(
  `\n=== LOCAL batch generate — pipeline=${PIPELINE_VERSION} batch=${batchNum} mode=${useRandom ? "random" : "diverse"} pool=${poolMode} seed=${seed ?? "none"} offers=${BATCH.length} ===\n`,
);

type Row = {
  display_title_uk: string | null;
  description_html_uk: string | null;
  faq_uk: unknown;
  qa_status_uk: string | null;
  qa_reason_uk: string | null;
};

type BatchEntry = {
  key: string;
  source: OfferSource;
  id: number;
  category: string;
  url: string;
  ms: number;
  tier: string;
  qa_status: string | null;
  qa_reason: string | null;
  html_len: number;
  faq_count: number;
  reviews_count: number;
  title: string | null;
  h2s: string[];
  delivery_h2: string | null;
  delivery_h2_expected: string;
  has_order_block: boolean;
  has_sestava: boolean;
  has_delivery: boolean;
  has_cities: boolean;
  html_head: string;
  faq_first: string | null;
  es_it_leak: boolean;
  de_leak: boolean;
  pl_leak: boolean;
  sl_leak: boolean;
  ro_leak: boolean;
  cyrillic_leak: boolean;
  brand_placeholder: boolean;
  si_marker: boolean;
  gen_status: string;
  pass: boolean;
  fail_reasons: string[];
  error?: string;
};

function evaluate(
  entry: Omit<BatchEntry, "pass" | "fail_reasons">,
): Pick<BatchEntry, "pass" | "fail_reasons"> {
  const fail: string[] = [];
  if (entry.gen_status === "cached_after_failure") fail.push("gen-error");
  if (entry.gen_status === "failed") fail.push("gen-error");
  if (entry.tier === "failed") fail.push("tier-failed");
  if (entry.html_len < 400) fail.push("html-too-short");
  if (entry.faq_count < 3) fail.push("faq-too-few");
  if (entry.cyrillic_leak) fail.push("cyrillic-leak");
  if (entry.de_leak) fail.push("de-leak");
  if (entry.pl_leak) fail.push("pl-leak");
  if (entry.sl_leak) fail.push("sl-leak");
  if (entry.ro_leak) fail.push("ro-leak");
  if (entry.es_it_leak) fail.push("es-it-leak");
  if (entry.brand_placeholder) fail.push("brand-placeholder");
  if (!entry.has_order_block) fail.push("order-block-missing");
  if (!entry.has_cities) fail.push("cities-missing");
  return { pass: fail.length === 0, fail_reasons: fail };
}

const { seoSlugFromRoTitle, shouldPreferRoDerivedSlug } = await import("../src/lib/slugify.ts");
const { splitBrandAndTail } = await import("../src/lib/brand-clean.ts");

async function resolveProductUrl(
  offer: Offer,
  displayTitle: string | null,
): Promise<{ category: string; slug: string; url: string }> {
  const { data: brief } = await supabaseAdmin
    .from("product_briefs")
    .select("resolved_category_slug")
    .eq("source", offer.source)
    .eq("offer_id", offer.id)
    .maybeSingle();
  const category =
    (brief as { resolved_category_slug?: string } | null)?.resolved_category_slug?.trim() ||
    offer.categorySlug ||
    "other";
  const display = displayTitle?.trim() || offer.displayTitle || offer.title;
  const { brand: displayBrand } = splitBrandAndTail(display);
  let slug = offer.slug;
  if (display && !displayBrand.trim()) {
    slug = seoSlugFromRoTitle(display, "", offer.id, offer.source);
  } else if (display && shouldPreferRoDerivedSlug(slug, display, offer.brand)) {
    slug = seoSlugFromRoTitle(display, offer.brand, offer.id, offer.source);
  }
  return {
    category,
    slug,
    url: `https://recenze-ceny.cz/${category}/${slug}`,
  };
}

const results: BatchEntry[] = [];

for (const offer of BATCH) {
  const { source, id } = offer;
  console.log(`--- ${source}:${id} (${offer.categorySlug}) ${offer.title.slice(0, 50)} ---`);
  const started = Date.now();
  let genStatus = "failed";
  try {
    const gen = await getOrGenerateProductContentDetailed(
      source,
      id,
      "uk",
      offer.categorySlug,
      { forceRegen: true },
    );
    genStatus = gen.status;
  } catch (err) {
    console.error(`FAIL ${source}:${id}:`, err);
    const { category, url } = await resolveProductUrl(offer, null);
    results.push({
      key: `${source}:${id}`,
      source,
      id,
      category,
      url,
      ms: Date.now() - started,
      tier: "failed",
      qa_status: null,
      qa_reason: null,
      html_len: 0,
      faq_count: 0,
      reviews_count: 0,
      title: null,
      h2s: [],
      delivery_h2: null,
      delivery_h2_expected: deliveryH2For(category, id),
      has_order_block: false,
      has_sestava: false,
      has_delivery: false,
      has_cities: false,
      html_head: "",
      faq_first: null,
      es_it_leak: false,
      de_leak: false,
      pl_leak: false,
      sl_leak: false,
      ro_leak: false,
      cyrillic_leak: false,
      brand_placeholder: false,
      si_marker: false,
      gen_status: "failed",
      pass: false,
      fail_reasons: ["gen-error"],
      error: String(err),
    });
    continue;
  }
  const ms = Date.now() - started;

  const { data: row } = await supabaseAdmin
    .from("product_content")
    .select("display_title_uk,description_html_uk,faq_uk,qa_status_uk,qa_reason_uk")
    .eq("source", source)
    .eq("offer_id", id)
    .maybeSingle();

  const pc = row as Row | null;
  const html = pc?.description_html_uk ?? "";
  const faq = Array.isArray(pc?.faq_uk) ? pc!.faq_uk : [];
  const { category, url } = await resolveProductUrl(offer, pc?.display_title_uk ?? null);
  const tier = deriveContentTier(pc?.qa_status_uk, pc?.qa_reason_uk, html);
  const blob = `${pc?.display_title_uk ?? ""}${html}${JSON.stringify(faq)}`;
  const hasCyrillic = /[\u0400-\u04FF]/.test(blob);
  const hasEsIt = LEAK_RE.test(blob);
  const hasSiMarker = /\bSI\b/.test(pc?.display_title_uk ?? "");
  const hasSestava = /složení|složka|složek|účinná látka|ingredien/i.test(html);
  const hasDelivery = /doručení|dobírka|kurýr|objednat|platba|česká republika/i.test(html);
  const hasCities = CITY_RE.test(html);
  const deLeak = hasGermanLocaleLeak(blob);
  const plLeak = hasPolishLocaleLeak(blob);
  const slLeak = hasSlovenianLocaleLeak(blob);
  const roLeak = hasRomanianLocaleLeak(blob);
  const h2s = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)].map((m) => m[1].trim());
  const deliveryH2Expected = deliveryH2For(category, id);
  const orderH2 = h2s.find((h) =>
    /jak objednat|objednávka|doprava|doručení|platba.*česk|dobírka/i.test(h),
  );
  const deliveryH2Actual = orderH2 ?? null;
  const hasOrderBlock = Boolean(orderH2) && hasDelivery;
  const brandPlaceholder = PLACEHOLDER_RE.test(blob);
  const reviewsCount = Array.isArray((pc as { reviews_uk?: unknown } | null)?.reviews_uk)
    ? ((pc as { reviews_uk: unknown[] }).reviews_uk.length)
    : 0;

  const base = {
    key: `${source}:${id}`,
    source,
    id,
    category,
    url,
    ms,
    tier,
    qa_status: pc?.qa_status_uk ?? null,
    qa_reason: pc?.qa_reason_uk ?? null,
    html_len: html.length,
    faq_count: faq.length,
    reviews_count: reviewsCount,
    title: pc?.display_title_uk ?? null,
    h2s,
    delivery_h2: deliveryH2Actual,
    delivery_h2_expected: deliveryH2Expected,
    has_order_block: hasOrderBlock,
    has_sestava: hasSestava,
    has_delivery: hasDelivery,
    has_cities: hasCities,
    html_head: html.slice(0, 150).replace(/\s+/g, " "),
    faq_first: (faq[0] as { q?: string })?.q ?? null,
    es_it_leak: hasEsIt,
    de_leak: deLeak,
    pl_leak: plLeak,
    sl_leak: slLeak,
    ro_leak: roLeak,
    cyrillic_leak: hasCyrillic,
    brand_placeholder: brandPlaceholder,
    si_marker: hasSiMarker,
    gen_status: genStatus,
  };
  const entry: BatchEntry = { ...base, ...evaluate(base) };
  results.push(entry);
  console.log(JSON.stringify(entry));
}

const passCount = results.filter((r) => r.pass).length;
const report = {
  generated_at: new Date().toISOString(),
  pipeline: PIPELINE_VERSION,
  mode: useRandom ? "random" : "diverse",
  seed,
  batch: batchNum,
  pool_size: poolSize,
  pool_mode: poolMode,
  stale_only: staleOnly,
  skip_existing: skipGenerated,
  pass_count: passCount,
  total: results.length,
  results,
};

console.log("\n=== SUMMARY ===");
for (const r of results) {
  if (r.error) {
    console.log(`${r.key} ERROR ${r.error}`);
    continue;
  }
  console.log(
    `${r.key} [${r.category}] tier=${r.tier} pass=${r.pass} html=${r.html_len} faq=${r.faq_count} reviews=${r.reviews_count} order_block=${r.has_order_block} placeholder=${r.brand_placeholder} de=${r.de_leak} pl=${r.pl_leak} sl=${r.sl_leak} ro=${r.ro_leak} cyr=${r.cyrillic_leak} | ${String(r.title).slice(0, 50)}`,
  );
  if (r.fail_reasons.length) console.log(`  fail: ${r.fail_reasons.join(", ")}`);
  console.log(`  ${r.url}`);
}
console.log(`\nPASS ${passCount}/${results.length}`);

if (saveJson) {
  const cacheDir = resolve(root, "scripts/.cache");
  mkdirSync(cacheDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outPath = resolve(cacheDir, `batch-generate-${ts}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nWrote ${outPath}`);
}
