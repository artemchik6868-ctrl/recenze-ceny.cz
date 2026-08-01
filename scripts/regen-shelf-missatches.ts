/**
 * Regen offers where title-first product intent ≠ current catalog shelf.
 *
 * Usage:
 *   npx tsx scripts/regen-shelf-mismatches.ts --dry-run
 *   npx tsx scripts/regen-shelf-mismatches.ts
 *   npx tsx scripts/regen-shelf-mismatches.ts --only=adcombo:39743
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SHELF_OVERRIDES } from "../src/lib/catalog-shelf-overrides";
import { buildPartnerClassifyBlob } from "../src/lib/partner-feed-text";
import { classifyTitleFirst } from "../src/lib/classify";
import { inferProductIntentSlug } from "../src/lib/product-intent.cs";
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
const onlyKeys = onlyArg
  ? new Set(onlyArg.slice(7).split(",").map((s) => s.trim()).filter(Boolean))
  : null;

const TABLE: Record<OfferSource, string> = {
  cpa_tl: "cpa_tl_offers",
  kma: "kma_offers",
  m1_top: "m1_offers",
  cpagetti: "cpagetti_offers",
  adcombo: "adcombo_offers",
  shakes: "shakes_offers",

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

function expectedShelf(
  _source: OfferSource,
  _offerId: number,
  title: string,
  brand: string,
  blob: string,
  _syncSlug: string,
  _resolvedSlug: string | null | undefined,
): string | null {
  const intent = inferProductIntentSlug(title, brand, blob);
  if (intent && intent !== "other") return intent;
  const classified = classifyTitleFirst(title, blob, "other");
  return classified !== "other" ? classified : null;
}

function targetShelf(
  key: string,
  source: OfferSource,
  offerId: number,
  title: string,
  brand: string,
  blob: string,
  syncSlug: string,
  resolvedSlug: string | null | undefined,
  currentSlug: string,
): string {
  const override = SHELF_OVERRIDES[key];
  if (override) return override;
  return (
    expectedShelf(source, offerId, title, brand, blob, syncSlug, resolvedSlug) ?? currentSlug
  );
}

function isShelfMismatch(
  key: string,
  source: OfferSource,
  offerId: number,
  title: string,
  brand: string,
  blob: string,
  syncSlug: string,
  resolvedSlug: string | null | undefined,
  currentSlug: string,
): boolean {
  const expected =
    SHELF_OVERRIDES[key] ??
    expectedShelf(source, offerId, title, brand, blob, syncSlug, resolvedSlug);
  if (!expected) return false;
  return expected !== currentSlug;
}

const { loadOffers } = await import("../src/lib/offers.server.ts");
const { loadResolvedCategoryMap, persistResolvedCategorySlug } = await import(
  "../src/lib/catalog-shelf.server.ts"
);
const { getOrGenerateProductContent, PIPELINE_VERSION } = await import(
  "../src/lib/ai-content.server.ts"
);

const offers = await loadOffers();
const resolvedMap = await loadResolvedCategoryMap();
const byKey = new Map(offers.map((o) => [`${o.source}:${o.id}`, o]));

const keys = new Set<string>(Object.keys(SHELF_OVERRIDES));

if (!onlyKeys) {
  for (const o of offers) {
    const key = `${o.source}:${o.id}`;
    const rawTitle = o.title || o.brand || "";
    const raw = await loadRaw(o.source, o.id);
    const blob = raw
      ? buildPartnerClassifyBlob(o.source, raw, rawTitle, o.categoryKey ?? o.categoryName ?? "")
      : o.feedClassifyText || String(o.categoryKey ?? o.categoryName ?? "");
    const syncSlug = classifyTitleFirst(rawTitle, blob, "other");
    if (
      isShelfMismatch(
        key,
        o.source,
        o.id,
        rawTitle,
        o.brand,
        blob,
        syncSlug,
        resolvedMap.get(key),
        o.categorySlug,
      )
    ) {
      keys.add(key);
    }
  }
}

const targetKeys = onlyKeys
  ? [...onlyKeys].filter((k) => byKey.has(k))
  : [...keys];

console.log(
  `\n=== regen-shelf-mismatches — ${targetKeys.length} offers (dry=${dryRun}) pipeline=${PIPELINE_VERSION} ===\n`,
);

let ok = 0;
let skip = 0;
let fail = 0;

for (const key of targetKeys.sort()) {
  const offer = byKey.get(key);
  if (!offer) {
    console.log(`SKIP ${key} — not in catalog`);
    skip += 1;
    continue;
  }
  const rawTitle = offer.title || offer.brand || "";
  const raw = await loadRaw(offer.source, offer.id);
  const blob = raw
    ? buildPartnerClassifyBlob(
        offer.source,
        raw,
        rawTitle,
        offer.categoryKey ?? offer.categoryName ?? "",
      )
    : offer.feedClassifyText || String(offer.categoryKey ?? offer.categoryName ?? "");
  const syncSlug = classifyTitleFirst(rawTitle, blob, "other");
  const expected = targetShelf(
    key,
    offer.source,
    offer.id,
    rawTitle,
    offer.brand,
    blob,
    syncSlug,
    resolvedMap.get(key),
    offer.categorySlug,
  );
  console.log(`REGEN ${key}`);
  console.log(`  feed: ${rawTitle.slice(0, 60)}`);
  console.log(`  was:  ${offer.categorySlug} → expected: ${expected}`);
  if (dryRun) {
    ok += 1;
    continue;
  }
  const [source, idStr] = key.split(":");
  await persistResolvedCategorySlug(source as OfferSource, Number(idStr), expected);
  const out = await getOrGenerateProductContent(
    source as OfferSource,
    Number(idStr),
    "uk",
    expected,
    { forceRegen: true },
  );
  if (out?.description_html && out.description_html.length >= 400) {
    ok += 1;
    console.log(`  OK   display=${out.display_title?.slice(0, 70)} html=${out.description_html.length}`);
  } else {
    fail += 1;
    console.log(`  FAIL tier=${out?.content_tier ?? "null"}`);
  }
}

console.log(`\nDone — ok=${ok} skip=${skip} fail=${fail}`);
