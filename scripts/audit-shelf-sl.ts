/**
 * Audit catalog shelf assignment vs title-first classifier.
 *
 * Usage: npx tsx scripts/audit-shelf-sl.ts [--json]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyTitleFirst } from "../src/lib/classify";
import { resolveIntentListingSlug } from "../src/lib/catalog-shelf";
import { buildPartnerClassifyBlob } from "../src/lib/partner-feed-text";
import { loadResolvedCategoryMap } from "../src/lib/catalog-shelf.server";
import { inferProductIntentSlug } from "../src/lib/product-intent.ro";
import type { OfferSource } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const TABLE: Record<OfferSource, string> = {
  cpa_tl: "cpa_tl_offers",
  kma: "kma_offers",
  m1_top: "m1_offers",
  cpagetti: "cpagetti_offers",
  adcombo: "adcombo_offers",
  shakes: "shakes_offers",
  terraleads: "terraleads_offers",
};

async function loadRaw(source: OfferSource, offerId: number): Promise<unknown> {
  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
  const { data } = await supabaseAdmin
    .from(TABLE[source])
    .select("raw")
    .eq("offer_id", offerId)
    .maybeSingle();
  return (data as { raw?: unknown } | null)?.raw ?? null;
}

function otherReason(title: string, blob: string, intent: string | null): string {
  if (/\bBeauty\b/i.test(blob)) return "beauty-bucket";
  if (!title.trim()) return "empty-title";
  if (intent) return "intent-found-but-other";
  if (title.split(/\s+/).length <= 1) return "brand-only-title";
  return "no-regex-match";
}

const { loadOffers } = await import("../src/lib/offers.server.ts");
const offers = await loadOffers();
const resolvedMap = await loadResolvedCategoryMap();

type Row = {
  key: string;
  source: OfferSource;
  id: number;
  title: string;
  syncSlug: string;
  resolvedSlug: string | null;
  listingSlug: string;
  expectedSlug: string;
  intentSlug: string | null;
  feedBucket: string;
  flags: string[];
};

const rows: Row[] = [];
const mismatchPairs = new Map<string, number>();
const otherBySource = new Map<string, number>();

for (const o of offers) {
  const key = `${o.source}:${o.id}`;
  const rawTitle = o.title || o.brand || "";
  const role = o.displayTitle?.includes("—")
    ? o.displayTitle.split(/\s*[—–-]\s*/).slice(1).join(" ").trim()
    : undefined;
  const raw = await loadRaw(o.source, o.id);
  const blob = raw
    ? buildPartnerClassifyBlob(o.source, raw, rawTitle, o.categoryKey || o.categoryName || "")
    : o.feedClassifyText || String(o.categoryKey || o.categoryName || "");
  const syncSlug = classifyTitleFirst(rawTitle, blob, "other");
  const intentSlug = inferProductIntentSlug(rawTitle, o.brand, blob);
  const expectedSlug = classifyTitleFirst(rawTitle, blob, "other");
  const resolvedSlug = resolvedMap.get(key) ?? null;
  const listingSlug = resolveIntentListingSlug({
    source: o.source,
    offerId: o.id,
    syncSlug,
    resolvedSlug,
    rawTitle,
    brand: o.brand,
    productRole: role,
    displayH1: o.displayTitle ?? undefined,
    feedText: blob,
  });
  const flags: string[] = [];

  if (o.categorySlug === "other") {
    flags.push("OTHER");
    otherBySource.set(o.source, (otherBySource.get(o.source) ?? 0) + 1);
    if (intentSlug && intentSlug !== "other") flags.push("OTHER_RESCUABLE");
  }
  if (expectedSlug !== "other" && expectedSlug !== listingSlug) {
    flags.push("MISMATCH");
    const pair = `${o.categorySlug}→${expectedSlug}`;
    mismatchPairs.set(pair, (mismatchPairs.get(pair) ?? 0) + 1);
  }
  if (listingSlug !== o.categorySlug) {
    flags.push("LISTING_DRIFT");
  }

  if (flags.length > 0 || o.categorySlug === "other") {
    rows.push({
      key,
      source: o.source,
      id: o.id,
      title: rawTitle.slice(0, 80),
      syncSlug,
      resolvedSlug,
      listingSlug,
      expectedSlug,
      intentSlug,
      feedBucket: blob.slice(0, 60),
      flags,
    });
  }
}

const summary = {
  totalOffers: offers.length,
  otherCount: offers.filter((o) => o.categorySlug === "other").length,
  mismatchCount: rows.filter((r) => r.flags.includes("MISMATCH")).length,
  otherRescuable: rows.filter((r) => r.flags.includes("OTHER_RESCUABLE")).length,
  topMismatchPairs: [...mismatchPairs.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([pair, count]) => ({ pair, count })),
  otherBySource: Object.fromEntries(otherBySource),
};

console.log("\n=== audit-shelf-sl ===\n");
console.log(JSON.stringify(summary, null, 2));

console.log("\n--- OTHER offers (sample) ---");
for (const r of rows.filter((x) => x.flags.includes("OTHER")).slice(0, 25)) {
  console.log(
    `${r.key} intent=${r.intentSlug ?? "-"} expected=${r.expectedSlug} reason=${otherReason(r.title, r.feedBucket, r.intentSlug)} | ${r.title}`,
  );
}

console.log("\n--- MISMATCH (sample) ---");
for (const r of rows.filter((x) => x.flags.includes("MISMATCH")).slice(0, 25)) {
  console.log(`${r.key} ${r.listingSlug} → ${r.expectedSlug} | ${r.title}`);
}

if (process.argv.includes("--json")) {
  const outDir = resolve(root, "scripts", ".cache");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, "audit-shelf-sl.json");
  writeFileSync(outPath, JSON.stringify({ summary, rows }, null, 2), "utf8");
  console.log(`\nWrote ${outPath}`);
}
