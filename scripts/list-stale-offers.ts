/**
 * List active offers whose AI content source_hash no longer matches the feed
 * (price change, title/category drift, or pipeline version bump).
 *
 * Usage: npx tsx scripts/list-stale-offers.ts [--json]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PIPELINE_SOURCES } from "../src/lib/content-pipeline.server";
import { getExpectedSourceHash, PIPELINE_VERSION } from "../src/lib/ai-content.server";
import { loadOffers } from "../src/lib/offers.server";
import { supabaseAdmin } from "../src/integrations/supabase/client.server";
import { formatDisplayPrice } from "../src/lib/market";
import type { OfferSource } from "../src/lib/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv(): void {
  const raw = readFileSync(resolve(root, ".env"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    const key = m[1].trim();
    if (!(key in process.env) || process.env[key] === "") process.env[key] = v;
  }
}

type StaleRow = {
  source: OfferSource;
  offer_id: number;
  title: string;
  slug: string;
  categorySlug: string;
  current_price: string | null;
  price_in_content: string | null;
  likely_price_change: boolean;
  generated_at: string | null;
  stored_hash: string;
  expected_hash: string;
  pipeline_version_stale: boolean;
};

function extractPriceFromHtml(html: string | null): string | null {
  if (!html) return null;
  const m = html.match(/(\d[\d\s.,]*)\s*lei\b/i);
  if (!m) return null;
  const n = Number(m[1].replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? String(Math.round(n)) : m[1].trim();
}

function isContentComplete(row: {
  display_title_uk: string | null;
  description_html_uk: string | null;
  faq_uk: unknown;
}): boolean {
  const faqLen = Array.isArray(row.faq_uk) ? row.faq_uk.length : 0;
  return Boolean(row.display_title_uk && row.description_html_uk && faqLen >= 3);
}

async function loadCompleteIds(source: OfferSource): Promise<Set<number>> {
  const { data } = await supabaseAdmin
    .from("product_content")
    .select("offer_id,display_title_uk,description_html_uk,faq_uk")
    .eq("source", source);
  const out = new Set<number>();
  for (const row of data ?? []) {
    if (isContentComplete(row as Parameters<typeof isContentComplete>[0])) {
      out.add((row as { offer_id: number }).offer_id);
    }
  }
  return out;
}

async function listStaleForSource(
  source: OfferSource,
  offerByKey: Map<string, { title: string; slug: string; categorySlug: string; price: string | null }>,
): Promise<StaleRow[]> {
  const complete = await loadCompleteIds(source);
  if (complete.size === 0) return [];

  const { data: rows } = await supabaseAdmin
    .from("product_content")
    .select("offer_id,source_hash,description_html_uk,generated_at")
    .eq("source", source);

  const out: StaleRow[] = [];
  for (const row of rows ?? []) {
    const id = row.offer_id as number;
    if (!complete.has(id)) continue;
    const stored = String(row.source_hash ?? "");
    const expected = await getExpectedSourceHash(source, id);
    if (!expected || expected === stored) continue;

    const key = `${source}:${id}`;
    const offer = offerByKey.get(key);
    const priceInContent = extractPriceFromHtml(row.description_html_uk as string | null);
    const currentPrice = offer?.price ?? null;
    const likelyPriceChange =
      Boolean(priceInContent && currentPrice) && priceInContent !== currentPrice;

    out.push({
      source,
      offer_id: id,
      title: offer?.title ?? `#${id}`,
      slug: offer?.slug ?? "",
      categorySlug: offer?.categorySlug ?? "",
      current_price: currentPrice,
      price_in_content: priceInContent,
      likely_price_change: likelyPriceChange,
      generated_at: (row.generated_at as string | null) ?? null,
      stored_hash: stored,
      expected_hash: expected ?? "",
      pipeline_version_stale: false,
    });
  }
  return out;
}

async function main(): Promise<void> {
  loadEnv();
  const json = process.argv.includes("--json");

  const offers = await loadOffers();
  const offerByKey = new Map<
    string,
    { title: string; slug: string; categorySlug: string; price: string | null }
  >();
  for (const o of offers) {
    offerByKey.set(`${o.source}:${o.id}`, {
      title: o.displayTitle || o.title,
      slug: o.slug,
      categorySlug: o.categorySlug,
      price: o.priceEUR != null ? String(o.priceEUR) : null,
    });
  }

  const all: StaleRow[] = [];
  const bySource: Record<string, number> = {};

  for (const source of PIPELINE_SOURCES) {
    process.stderr.write(`scanning ${source}…\n`);
    const rows = await listStaleForSource(source, offerByKey);
    bySource[source] = rows.length;
    all.push(...rows);
  }

  all.sort((a, b) => a.source.localeCompare(b.source) || a.offer_id - b.offer_id);
  const priceLikely = all.filter((r) => r.likely_price_change);

  const summary = {
    pipeline_version: PIPELINE_VERSION,
    total_stale: all.length,
    likely_price_change: priceLikely.length,
    by_source: bySource,
    offers: all.map((r) => ({
      ...r,
      url: r.categorySlug && r.slug ? `/${r.categorySlug}/${r.slug}` : null,
      current_price_display:
        r.current_price != null ? formatDisplayPrice(Number(r.current_price)) : null,
      price_in_content_display:
        r.price_in_content != null ? formatDisplayPrice(Number(r.price_in_content)) : null,
    })),
  };

  if (json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(`Stale AI content (source_hash drift): ${all.length} offers`);
  console.log(`Likely price-only change (HTML price ≠ feed): ${priceLikely.length}`);
  console.log("By source:", bySource);
  console.log("");
  for (const r of summary.offers) {
    const url = r.url ?? `${r.source}:${r.offer_id}`;
    const priceNote =
      r.likely_price_change && r.price_in_content_display && r.current_price_display
        ? `  price ${r.price_in_content_display} → ${r.current_price_display}`
        : r.current_price_display
          ? `  feed ${r.current_price_display}`
          : "";
    const pipe = r.pipeline_version_stale ? " [pipeline bump]" : "";
    console.log(`${r.source}:${r.offer_id}  ${r.title}${pipe}`);
    console.log(`  ${url}${priceNote}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
