/**
 * Persist + regen offers mis-shelved under respiratory-health (generic partner bucket trap).
 * Usage: npx tsx scripts/regen-respiratory-traps.ts [--dry-run]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyTitleFirst } from "../src/lib/classify";
import { resolveIntentListingSlug } from "../src/lib/catalog-shelf";
import { buildPartnerClassifyBlob } from "../src/lib/partner-feed-text";
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
    .select("raw, category")
    .eq("offer_id", offerId)
    .maybeSingle();
  return data ?? null;
}

const { loadOffers } = await import("../src/lib/offers.server.ts");
const { loadResolvedCategoryMap, persistResolvedCategorySlug } = await import(
  "../src/lib/catalog-shelf.server.ts"
);
const { getOrGenerateProductContent } = await import("../src/lib/ai-content.server.ts");

async function loadContentMap(): Promise<Map<string, { display_title_uk?: string | null }>> {
  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
  const { data } = await supabaseAdmin
    .from("product_content")
    .select("source, offer_id, display_title_uk");
  const map = new Map<string, { display_title_uk?: string | null }>();
  if (data) {
    for (const r of data as Array<{ source: string; offer_id: number; display_title_uk?: string | null }>) {
      map.set(`${r.source}:${r.offer_id}`, r);
    }
  }
  return map;
}

const offers = await loadOffers();
const resolvedMap = await loadResolvedCategoryMap();
const contentMap = await loadContentMap();

const targets: Array<{ key: string; expected: string; reason: string }> = [];

for (const o of offers) {
  const key = `${o.source}:${o.id}`;
  const rawTitle = o.title || o.brand || "";
  const row = await loadRaw(o.source, o.id);
  const categoryField =
    (row as { category?: string | null } | null)?.category ?? o.categoryKey ?? o.categoryName ?? "";
  const blob = row?.raw
    ? buildPartnerClassifyBlob(o.source, row.raw, rawTitle, categoryField)
    : o.feedClassifyText || String(categoryField);
  const syncSlug = classifyTitleFirst(rawTitle, blob, "other");
  const persisted = resolvedMap.get(key);
  const content = contentMap.get(key);
  const dispUkForIntent = content?.display_title_uk?.trim() ?? null;
  const productRoleFromH1 = dispUkForIntent?.includes("—")
    ? dispUkForIntent.split(/\s*[—–-]\s*/).slice(1).join(" ").trim()
    : undefined;
  const expected = resolveIntentListingSlug({
    source: o.source,
    offerId: o.id,
    syncSlug,
    resolvedSlug: persisted,
    rawTitle,
    brand: o.brand,
    productRole: productRoleFromH1,
    displayH1: dispUkForIntent ?? undefined,
    feedText: blob,
  });
  const wasOnRespiratory =
    persisted === "dychaci-cesty" ||
    syncSlug === "dychaci-cesty" ||
    o.categorySlug === "dychaci-cesty";
  if (!wasOnRespiratory || expected === "dychaci-cesty") continue;
  targets.push({
    key,
    expected,
    reason: `${persisted ?? syncSlug ?? o.categorySlug} → ${expected} «${rawTitle.slice(0, 40)}»`,
  });
}

console.log(`\n=== regen-respiratory-traps — ${targets.length} offers (dry=${dryRun}) ===\n`);

let ok = 0;
for (const t of targets) {
  console.log(t.key, t.reason);
  if (dryRun) {
    ok += 1;
    continue;
  }
  const [source, idStr] = t.key.split(":");
  await persistResolvedCategorySlug(source as OfferSource, Number(idStr), t.expected);
  const out = await getOrGenerateProductContent(
    source as OfferSource,
    Number(idStr),
    "uk",
    t.expected,
    { forceRegen: true },
  );
  if (out?.description_html) ok += 1;
}

console.log(`\nDone — ok=${ok}/${targets.length}`);
