/**
 * Regenerate product_content rows with non-Czech locale leaks (German/PL/Cyrillic/SL).
 *
 * Usage:
 *   npx tsx scripts/regen-locale-leaks-ro.ts --dry-run
 *   npx tsx scripts/regen-locale-leaks-ro.ts --limit=20
 *   npx tsx scripts/regen-locale-leaks-ro.ts --only=shakes:12541
 *   npx tsx scripts/regen-locale-leaks-ro.ts --bad-titles --dry-run
 *   npx tsx scripts/regen-locale-leaks-ro.ts --garbled-titles --dry-run
 *   npx tsx scripts/regen-locale-leaks-ro.ts --bad-body --dry-run
 *   npx tsx scripts/regen-locale-leaks-ro.ts --bad-cards --dry-run
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OfferSource } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[m[1].trim()] = v;
}

const dryRun = process.argv.includes("--dry-run");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const pauseArg = process.argv.find((a) => a.startsWith("--pause-ms="));

const onlyKeys = onlyArg
  ? new Set(onlyArg.slice(7).split(",").map((s) => s.trim()).filter(Boolean))
  : null;
const limit = limitArg ? Number(limitArg.slice(8)) : Infinity;
const pauseMs = pauseArg ? Number(pauseArg.slice(11)) : 1500;

const { hasNonCzechProductContent, hasNonCzechLocaleLeak, hasGermanLocaleLeak } = await import(
  "../src/lib/locale-leak-cz.ts"
);
const { containsAffiliateSkuTokens, splitBrandAndTail } = await import("../src/lib/brand-clean.ts");
const { isGenericBgDescriptor, titleNeedsBgRefresh } = await import("../src/lib/title-translate.server.ts");
const { loadResolvedCategoryMap } = await import("../src/lib/catalog-shelf.server.ts");
const { loadOffers } = await import("../src/lib/offers.server.ts");
const { offerDisplayTitle } = await import("../src/lib/offer-display.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
const { getOrGenerateProductContent, PIPELINE_VERSION } = await import(
  "../src/lib/ai-content.server.ts"
);

const offers = await loadOffers().catch(() => [] as Awaited<ReturnType<typeof loadOffers>>);
const byKey = new Map(offers.map((o) => [`${o.source}:${o.id}`, o]));
const resolvedMap = await loadResolvedCategoryMap().catch(() => new Map<string, string>());

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (i < attempts - 1) await sleep(1500 * (i + 1));
    }
  }
  throw last;
}

function inferCategoryFromTitle(title: string | null | undefined): string | null {
  const t = (title ?? "").toLowerCase();
  if (/hondrofrost|hondroine|artizynt|fortuflex|gelenkgel|gel za sklepe|joint gel|articula/i.test(t)) {
    return "klouby";
  }
  if (/kapseln f.r die augen|vision|vedere|clearvision|eye support/i.test(t)) return "zrak";
  if (/schnarch|sforait|snor/i.test(t)) return "chrapani";
  if (/f.r die haare|hair|păr/i.test(t)) return "vypadavani-vlasu";
  return null;
}

type ContentRow = {
  source: string;
  offer_id: number;
  display_title_uk: string | null;
  subtitle_uk: string | null;
  description_html_uk: string | null;
  faq_uk: unknown;
};

const CONTENT_COLS = "source, offer_id, display_title_uk, subtitle_uk, description_html_uk, faq_uk";
const germanDisplayOnly = process.argv.includes("--german-display");
const badTitlesOnly = process.argv.includes("--bad-titles");
const badCardsOnly = process.argv.includes("--bad-cards");
const garbledTitlesOnly = process.argv.includes("--garbled-titles");
const badBodyOnly = process.argv.includes("--bad-body");

function isBadCardTitle(title: string | null | undefined): boolean {
  return /Produs pentru/i.test(title ?? "");
}

function isBadCardSubtitle(subtitle: string | null | undefined): boolean {
  const s = subtitle ?? "";
  if (!s.trim()) return false;
  return (
    /Suport (mobilitatea|funcția|eficient|reducerea|vitalitatea|oral)/i.test(s) ||
    /Supliment mobilitatea/i.test(s) ||
    /Gel aplicare externă confort/i.test(s)
  );
}

function isBadCardCopy(row: Pick<ContentRow, "display_title_uk" | "subtitle_uk">): boolean {
  return isBadCardTitle(row.display_title_uk) || isBadCardSubtitle(row.subtitle_uk);
}

function isBadDisplayTitle(title: string | null | undefined): boolean {
  const t = title ?? "";
  if (!t.trim()) return false;
  if (hasGermanLocaleLeak(t)) return true;
  if (containsAffiliateSkuTokens(t) || /\blow\s+low\b/i.test(t)) return true;
  const { tail } = splitBrandAndTail(t);
  if (isGenericBgDescriptor(tail)) return true;
  return false;
}

async function loadBadCardCandidates(): Promise<ContentRow[]> {
  const patterns = ["%Produs pentru%", "%produs pentru%", "%Suport mobilitatea%", "%Gel aplicare extern%"];
  const byKey = new Map<string, ContentRow>();
  for (const pattern of patterns) {
    try {
      for (const col of ["display_title_uk", "subtitle_uk"] as const) {
        const rows = await withRetry(async () => {
          const { data, error } = await supabaseAdmin
            .from("product_content")
            .select(CONTENT_COLS)
            .ilike(col, pattern);
          if (error) throw error;
          return (data ?? []) as ContentRow[];
        });
        for (const row of rows) {
          if (isBadCardCopy(row)) byKey.set(`${row.source}:${row.offer_id}`, row);
        }
        await sleep(300);
      }
    } catch (err) {
      console.warn(`regen-locale-leaks-ro: bad-cards ilike ${pattern} failed:`, err);
    }
  }
  return [...byKey.values()];
}

async function loadBadTitleCandidates(): Promise<ContentRow[]> {
  const patterns = [
    "%Gelenkgel%",
    "%Gelenk%",
    "%für%",
    "%Kapseln%",
    "%low low%",
    "%LOW LOW%",
    "%— produs%",
    "% - produs%",
  ];
  const byKey = new Map<string, ContentRow>();
  for (const pattern of patterns) {
    try {
      const rows = await withRetry(async () => {
        const { data, error } = await supabaseAdmin
          .from("product_content")
          .select(CONTENT_COLS)
          .ilike("display_title_uk", pattern);
        if (error) throw error;
        return (data ?? []) as ContentRow[];
      });
      for (const row of rows) {
        if (isBadDisplayTitle(row.display_title_uk)) {
          byKey.set(`${row.source}:${row.offer_id}`, row);
        }
      }
      await sleep(400);
    } catch (err) {
      console.warn(`regen-locale-leaks-ro: bad-title ilike ${pattern} failed:`, err);
    }
  }
  return [...byKey.values()];
}

async function loadGermanDisplayCandidates(): Promise<ContentRow[]> {
  const patterns = ["%Gelenk%", "%für%", "%Kapseln%", "%Mittel%", "%ä%", "%ö%", "%ü%", "%ß%", "%Nachtfahr%", "%Heizl%"];
  const byKey = new Map<string, ContentRow>();
  for (const pattern of patterns) {
    try {
      const rows = await withRetry(async () => {
        const { data, error } = await supabaseAdmin
          .from("product_content")
          .select(CONTENT_COLS)
          .ilike("display_title_uk", pattern);
        if (error) throw error;
        return (data ?? []) as ContentRow[];
      });
      for (const row of rows) {
        byKey.set(`${row.source}:${row.offer_id}`, row);
      }
      await sleep(400);
    } catch (err) {
      console.warn(`regen-locale-leaks-ro: ilike ${pattern} failed:`, err);
    }
  }
  return [...byKey.values()];
}

async function loadGarbledTitleCandidates(): Promise<ContentRow[]> {
  const all: ContentRow[] = [];
  for (const source of PIPELINE_SOURCES) {
    try {
      const pageSize = 100;
      for (let from = 0; ; from += pageSize) {
        const page = await withRetry(async () => {
          const { data, error } = await supabaseAdmin
            .from("product_content")
            .select(CONTENT_COLS)
            .eq("source", source)
            .range(from, from + pageSize - 1);
          if (error) throw error;
          return (data ?? []) as ContentRow[];
        });
        if (!page?.length) break;
        for (const row of page) {
          if (titleNeedsBgRefresh(row.display_title_uk ?? "")) all.push(row);
        }
        if (page.length < pageSize) break;
        await sleep(200);
      }
    } catch (err) {
      console.warn(`regen-locale-leaks-ro: garbled skip source ${source}:`, err);
    }
  }
  return all;
}

const PIPELINE_SOURCES: OfferSource[] = [
  "cpa_tl",
  "kma",
  "m1_top",
  "cpagetti",
  "adcombo",
  "shakes",
];

function isBadBodyHtml(html: string | null | undefined): boolean {
  const h = html ?? "";
  if (!h.trim()) return false;
  if (/\blow\s+low\b/i.test(h)) return true;
  if (containsAffiliateSkuTokens(h)) return true;
  return false;
}

async function loadBadBodyCandidates(): Promise<ContentRow[]> {
  const patterns = ["%low low%", "%LOW LOW%", "%low%low%"];
  const byKey = new Map<string, ContentRow>();
  for (const pattern of patterns) {
    try {
      const rows = await withRetry(async () => {
        const { data, error } = await supabaseAdmin
          .from("product_content")
          .select(CONTENT_COLS)
          .ilike("description_html_uk", pattern);
        if (error) throw error;
        return (data ?? []) as ContentRow[];
      });
      for (const row of rows) {
        if (isBadBodyHtml(row.description_html_uk)) {
          byKey.set(`${row.source}:${row.offer_id}`, row);
        }
      }
      await sleep(400);
    } catch (err) {
      console.warn(`regen-locale-leaks-ro: bad-body ilike ${pattern} failed:`, err);
    }
  }
  return [...byKey.values()];
}

async function loadContentRows(): Promise<ContentRow[]> {
  if (garbledTitlesOnly) return loadGarbledTitleCandidates();
  if (badCardsOnly) return loadBadCardCandidates();
  if (badTitlesOnly) return loadBadTitleCandidates();
  if (badBodyOnly) return loadBadBodyCandidates();
  if (germanDisplayOnly) return loadGermanDisplayCandidates();
  if (onlyKeys?.size) {
    const rows: ContentRow[] = [];
    for (const key of onlyKeys) {
      const [source, idStr] = key.split(":");
      const data = await withRetry(async () => {
        const { data: row, error } = await supabaseAdmin
          .from("product_content")
          .select(CONTENT_COLS)
          .eq("source", source)
          .eq("offer_id", Number(idStr))
          .maybeSingle();
        if (error) throw error;
        return row;
      });
      if (data) rows.push(data as ContentRow);
    }
    return rows;
  }

  const all: ContentRow[] = [];
  for (const source of PIPELINE_SOURCES) {
    try {
      const pageSize = 50;
      for (let from = 0; ; from += pageSize) {
        const page = await withRetry(async () => {
          const { data, error } = await supabaseAdmin
            .from("product_content")
            .select(CONTENT_COLS)
            .eq("source", source)
            .range(from, from + pageSize - 1);
          if (error) throw error;
          return data as ContentRow[] | null;
        });
        if (!page?.length) break;
        all.push(...page);
        if (page.length < pageSize) break;
        await sleep(200);
      }
    } catch (err) {
      console.warn(`regen-locale-leaks-ro: skip source ${source} load:`, err);
    }
  }
  return all;
}

let contentRows: ContentRow[] = [];
try {
  contentRows = await loadContentRows();
} catch (err) {
  console.error("regen-locale-leaks-ro: DB error", err);
  process.exit(1);
}
if (contentRows.length === 0) {
  console.error("regen-locale-leaks-ro: no product_content rows loaded");
  process.exit(1);
}

const leakingKeys: string[] = [];
for (const row of contentRows ?? []) {
  const key = `${row.source}:${row.offer_id}`;
  const dto = {
    display_title: row.display_title_uk,
    description_html: row.description_html_uk,
    faq: row.faq_uk,
  };
  if (badTitlesOnly) {
    if (isBadDisplayTitle(row.display_title_uk)) leakingKeys.push(key);
  } else if (badCardsOnly) {
    if (isBadCardCopy(row)) leakingKeys.push(key);
  } else if (badBodyOnly) {
    if (isBadBodyHtml(row.description_html_uk)) leakingKeys.push(key);
  } else if (garbledTitlesOnly) {
    if (titleNeedsBgRefresh(row.display_title_uk ?? "")) leakingKeys.push(key);
  } else if (hasNonCzechProductContent(dto)) {
    leakingKeys.push(key);
  }
}

const catalogOnlyLeaks: string[] = [];
for (const o of offers) {
  const key = `${o.source}:${o.id}`;
  if (leakingKeys.includes(key)) continue;
  const title = offerDisplayTitle(o);
  if (hasNonCzechLocaleLeak(title) || hasNonCzechLocaleLeak(o.title)) {
    catalogOnlyLeaks.push(key);
  }
}

let targetKeys = onlyKeys
  ? [...onlyKeys]
  : badTitlesOnly || badCardsOnly || garbledTitlesOnly || badBodyOnly || germanDisplayOnly
    ? leakingKeys
    : leakingKeys;

targetKeys = targetKeys.sort();
if (Number.isFinite(limit)) targetKeys = targetKeys.slice(0, limit);

console.log(
  `\n=== regen-locale-leaks-ro — ${targetKeys.length}/${leakingKeys.length} DB leaking rows, ${catalogOnlyLeaks.length} catalog-only (dry=${dryRun}) pipeline=${PIPELINE_VERSION} ===\n`,
);
if (catalogOnlyLeaks.length) {
  console.log(
    `Catalog-only (runtime H1 fix applies, no DB regen): ${catalogOnlyLeaks.slice(0, 10).join(", ")}${catalogOnlyLeaks.length > 10 ? "…" : ""}\n`,
  );
}

let ok = 0;
let skip = 0;
let fail = 0;

async function fetchBriefCategory(source: string, offerId: number): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("product_briefs")
    .select("resolved_category_slug, category_slug")
    .eq("source", source)
    .eq("offer_id", offerId)
    .maybeSingle();
  const row = data as { resolved_category_slug?: string | null; category_slug?: string | null } | null;
  return row?.resolved_category_slug?.trim() || row?.category_slug?.trim() || null;
}

for (const key of targetKeys) {
  const offer = byKey.get(key);
  const row = contentRows.find((r) => `${r.source}:${r.offer_id}` === key);
  const [source, idStr] = key.split(":");
  let categorySlug = offer?.categorySlug ?? resolvedMap.get(key) ?? null;
  if (!categorySlug) {
    categorySlug =
      inferCategoryFromTitle(row?.display_title_uk) ??
      (await fetchBriefCategory(source, Number(idStr))) ??
      "other";
  }
  if (!row && !onlyKeys?.has(key)) {
    console.log(`SKIP ${key} — no product_content row`);
    skip += 1;
    continue;
  }
  console.log(`REGEN ${key} (${categorySlug})`);
  console.log(`  feed: ${offer?.title.slice(0, 60) ?? "(catalog loader unavailable)"}`);
  console.log(`  was:  ${String(row?.display_title_uk ?? "").slice(0, 70)}`);
  if (dryRun) {
    ok += 1;
    continue;
  }
  try {
    const out = await getOrGenerateProductContent(
      source as OfferSource,
      Number(idStr),
      "uk",
      categorySlug,
      { forceRegen: true },
    );
    if (
      out &&
      !hasNonCzechProductContent(out) &&
      !isBadDisplayTitle(out.display_title) &&
      !isBadCardTitle(out.display_title) &&
      !isBadCardSubtitle(out.subtitle) &&
      out.description_html &&
      out.description_html.length >= 400
    ) {
      ok += 1;
      console.log(`  OK   display=${out.display_title?.slice(0, 70)} html=${out.description_html.length}`);
    } else if (out?.description_html && out.description_html.length >= 400) {
      fail += 1;
      console.log(`  FAIL still leaking display=${out.display_title?.slice(0, 70)}`);
    } else {
      fail += 1;
      console.log(`  FAIL tier=${out?.content_tier ?? "null"}`);
    }
  } catch (err) {
    fail += 1;
    console.log(`  FAIL ${String(err).slice(0, 120)}`);
  }
  if (pauseMs > 0) await new Promise((r) => setTimeout(r, pauseMs));
}

console.log(`\nDone — ok=${ok} skip=${skip} fail=${fail}`);
