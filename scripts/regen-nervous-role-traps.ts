/**
 * Regen offers on nervous-system with stale anti-stress role (memory/neuropathy trap).
 * Usage: npx tsx scripts/regen-nervous-role-traps.ts [--dry-run]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { inferProductRoleCs } from "../src/lib/product-role.ro";
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
const sourceArg = process.argv.find((a) => a.startsWith("--source="));
const offerArg = process.argv.find((a) => a.startsWith("--offer="));
const filterSource = sourceArg ? (sourceArg.slice(9) as OfferSource) : null;
const filterOffer = offerArg ? Number(offerArg.slice(8)) : null;

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

const KNOWN_TRAP_ROLES: Partial<Record<string, string>> = {
  "cpagetti:17055": "capsule pentru memorie și concentrare",
  "cpagetti:17061": "capsule pentru neuropatie",
};
const ANTI_STRESS_STALE_RE = /anti\s*stres|anxiet|liniște\s*interioară|liniste\s*interioara/i;
const MEMORY_NEURO_INFERRED_RE = /memorie|concentrare|neuropat|spomin/i;
const MEMORY_NEURO_FEED_RE =
  /memorsh|spominsh|memorysh|spomin|neuropat|neurosh|neuropatsh|\bmemory\b|cognitive|pamięć|pamiec|нейропат|neuropati/i;

function inferNervousRole(
  rawTitle: string,
  brand: string | undefined,
  blob: string,
): string | null {
  const inferred = inferProductRoleCs(rawTitle, brand, blob);
  if (inferred && MEMORY_NEURO_INFERRED_RE.test(inferred)) return inferred;
  if (!MEMORY_NEURO_FEED_RE.test(blob)) return null;
  if (/neuropat|neurosh|neuropatsh|нейропат|neuropati/i.test(blob)) {
    return "capsule pentru neuropatie";
  }
  return "capsule pentru memorie și concentrare";
}

function extractStaleRole(displayTitle: string | null | undefined): string {
  const t = displayTitle?.trim();
  if (!t) return "";
  const parts = t.split(/\s*[—–-]\s*/);
  return parts.length > 1 ? parts.slice(1).join(" ").trim() : t;
}

const offers = await loadOffers();
let filtered = offers.filter((o) => o.categorySlug === "stres");
if (filterSource) filtered = filtered.filter((o) => o.source === filterSource);
if (filterOffer != null && Number.isFinite(filterOffer)) {
  filtered = filtered.filter((o) => o.id === filterOffer);
}
const contentMap = await loadContentMap();

const targets: Array<{ key: string; inferred: string; stale: string; reason: string }> = [];

for (const o of filtered) {
  const key = `${o.source}:${o.id}`;
  const forceTarget =
    filterOffer != null &&
    filterSource != null &&
    o.source === filterSource &&
    o.id === filterOffer;
  const rawTitle = o.title || o.brand || "";
  const row = await loadRaw(o.source, o.id);
  const categoryField =
    (row as { category?: string | null } | null)?.category ?? o.categoryKey ?? o.categoryName ?? "";
  const blob = row?.raw
    ? buildPartnerClassifyBlob(o.source, row.raw, rawTitle, categoryField)
    : o.feedClassifyText || String(categoryField);

  let inferred = inferNervousRole(rawTitle, o.brand, blob) ?? KNOWN_TRAP_ROLES[key] ?? null;

  const dispUk = contentMap.get(key)?.display_title_uk ?? null;
  const stale = extractStaleRole(dispUk);
  if (!inferred && !forceTarget) continue;
  if (!ANTI_STRESS_STALE_RE.test(stale) && !forceTarget) continue;

  targets.push({
    key,
    inferred: inferred!,
    stale: stale || "(missing)",
    reason: `«${stale.slice(0, 35)}» → «${(inferred ?? "regen").slice(0, 40)}» «${rawTitle.slice(0, 30)}»`,
  });
}

console.log(`\n=== regen-nervous-role-traps — ${targets.length} offers (dry=${dryRun}) ===\n`);

let ok = 0;
for (const t of targets) {
  console.log(t.key, t.reason);
  if (dryRun) {
    ok += 1;
    continue;
  }
  const [source, idStr] = t.key.split(":");
  const out = await getOrGenerateProductContent(
    source as OfferSource,
    Number(idStr),
    "uk",
    "stres",
    { forceRegen: true },
  );
  if (out?.description_html) ok += 1;
}

console.log(`\nDone — ok=${ok}/${targets.length}`);
