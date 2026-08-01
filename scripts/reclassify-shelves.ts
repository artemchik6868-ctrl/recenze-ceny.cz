/**
 * Reclassify catalog shelves from feed title + partner rich text (title-first).
 *
 * Usage:
 *   npx tsx scripts/reclassify-shelves.ts --dry-run
 *   npx tsx scripts/reclassify-shelves.ts --source=kma --offer=11443
 *   npx tsx scripts/reclassify-shelves.ts --persist
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyTitleFirst } from "../src/lib/classify";
import {
  loadResolvedCategoryMap,
  persistResolvedCategorySlug,
} from "../src/lib/catalog-shelf.server";
import { resolveIntentListingSlug } from "../src/lib/catalog-shelf";
import { buildPartnerClassifyBlob } from "../src/lib/partner-feed-text";
import type { OfferSource } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const dryRun = process.argv.includes("--dry-run") || !process.argv.includes("--persist");
const regenAfter = process.argv.includes("--regen");
const sourceArg = process.argv.find((a) => a.startsWith("--source="));
const offerArg = process.argv.find((a) => a.startsWith("--offer="));
const filterSource = sourceArg ? sourceArg.slice(9) : null;
const filterOffer = offerArg ? Number(offerArg.slice(8)) : null;

/** Golden cases — title + partner blob (not brand-only). */
const GOLDEN_ASSERTS: Array<{ title: string; feed: string; expected: string }> = [
  { title: "Detoxil — liver support capsules", feed: "Паразиты", expected: "jatra" },
  { title: "Diabexol — diabetes glucose control", feed: "Паразиты", expected: "cukrovka" },
  { title: "Pest Repeller — ultrasonic rodent", feed: "Паразиты", expected: "zahradni-naradi" },
  { title: "Menstrual Cup — feminine hygiene", feed: "Adult", expected: "zdravi-zen" },
  { title: "Rhino Correct — nose shape clip", feed: "enlargement", expected: "kosmeticke-nastroje" },
  { title: "RhinoFix — nasal corrector clip", feed: "enlargement", expected: "kosmeticke-nastroje" },
  { title: "Rhino Gold — male enlargement gel", feed: "enlargement", expected: "zvetseni-penisu" },
  { title: "Detoxil", feed: "Parasites liver detox hepatic support capsules", expected: "jatra" },
  { title: "Detoxil", feed: "Parasites digestion gastrointestinal tract stomach", expected: "traveni" },
  { title: "Toxofil", feed: "Паразиты papillomas warts skin", expected: "papilomy" },
  { title: "Parazol", feed: "Паразиты, папилломы", expected: "paraziti" },
  { title: "Parazol — antiparasitic tea", feed: "Паразиты, папилломы", expected: "paraziti" },
  { title: "Flybra", feed: "Home gadgets push-up bra sujetador", expected: "obleceni" },
  { title: "Pest Reject", feed: "Parasites ultrasonic rodent repellent gadget", expected: "zahradni-naradi" },
  { title: "Balansulin — control automático de azúcar", feed: "diabetes glucose supplement", expected: "cukrovka" },
  { title: "Insuvit — metabolismo automático glucosa", feed: "control glucémico", expected: "cukrovka" },
  { title: "GPS para coche + sensor aparcamiento", feed: "parking sensor vehicle", expected: "autodoplnky" },
  { title: "Funda parasol parabrisas coche", feed: "windshield sun shade cover", expected: "autodoplnky" },
  { title: "Detoxionis — cápsulas para desintoxicar", feed: "other Para el coche", expected: "detox" },
  { title: "Cordless Grass Trimmer", feed: "General", expected: "zahradni-naradi" },
  { title: "Beard Trimmer — grooming", feed: "Beauty", expected: "osobni-pece" },
  { title: "Reishield", feed: "kapsule proti hemoroidom Atemwege", expected: "intimate-comfort" },
  { title: "Reishield", feed: "papilomi borodavke Atemwege", expected: "papilomy" },
  { title: "Reishield", feed: "alkohol odvisnost Atemwege", expected: "alkoholismus" },
  { title: "Cordyceps", feed: "za sluh hearing Atemwege", expected: "sluch" },
  { title: "Reishield", feed: "shujšanje weight loss Atemwege", expected: "hubnuti" },
  { title: "Herzena", feed: "de1.herzena.hypertsh.com minzdrav", expected: "krevni-tlak" },
  { title: "Promicil", feed: "de1-promicil.fungsh.com promicil", expected: "plisen-nehtu" },
  { title: "Benaga Chaga", feed: "de1.benagachaga.diabetsh.com benagachagadiab diabet", expected: "cukrovka" },
  { title: "Cordyceps Pulse", feed: "del1-cordycepspulse.liverhsh.com", expected: "jatra" },
  { title: "Benaga Chaga", feed: "Verdauungsmittel", expected: "traveni" },
  { title: "Venzen", feed: "hearing sluh BB cushion fond de ten", expected: "anti-aging" },
  { title: "Knee", feed: "blood pressure hypertension brace support", expected: "klouby" },
  { title: "Rhino Correct", feed: "home gadgets nose clip", expected: "kosmeticke-nastroje" },
  { title: "Gigant gel", feed: "adult enlargement", expected: "zvetseni-penisu" },
  { title: "Vermixin", feed: "immunity immune system parasites", expected: "paraziti" },
  { title: "Cleorix", feed: "immunity antiparasitic cleanse", expected: "paraziti" },
  { title: "Curling iron", feed: "hearing sluh", expected: "osobni-pece" },
  { title: "LED face mask", feed: "sluch", expected: "kosmeticke-nastroje" },
  { title: "Eyebrow powder", feed: "vision eye care", expected: "anti-aging" },
  { title: "Benaga", feed: "household testosterone boost", expected: "potence" },
  { title: "Balancio", feed: "de1 balancioloss com", expected: "hubnuti" },
  { title: "Neoflorax", feed: "de1 neoflorax othersh com", expected: "traveni" },
  { title: "Benaga Chaga", feed: "benagachaga othersh Verdauungsmittel", expected: "traveni" },
  { title: "Cordyceps Pulse", feed: "cordycepspulse rejuvsh com", expected: "anti-aging" },
  { title: "Щипцы для завивки волос", feed: "Слух", expected: "osobni-pece" },
  { title: "бигуди", feed: "Слух", expected: "osobni-pece" },
  { title: "Stubble Beard — триммер для бороды", feed: "Слух", expected: "osobni-pece" },
  { title: "AirCalm — аромаувлажнитель", feed: "Слух", expected: "domaci-klima" },
  { title: "DM-Norm", feed: "Imunitate immunity imunitet", expected: "cukrovka" },
  { title: "DM-Norm G", feed: "glicemie glucose control diabetes", expected: "cukrovka" },
  { title: "Cordyceps Pulse", feed: "hemorsh hemoroid Atemwege", expected: "intimate-comfort" },
  { title: "Deep Inhale", feed: "Atemwege respiratory pljuč", expected: "dychaci-cesty" },
  { title: "Epilator", feed: "Atemwege respiratory", expected: "osobni-pece" },
  { title: "DIY-Clock", feed: "Atemwege respiratory", expected: "modni-doplnky" },
  { title: "Laser", feed: "proiector laser Atemwege", expected: "domaci-vychytavky" },
  { title: "RGB LED Lent", feed: "respiratory", expected: "domaci-vychytavky" },
  { title: "BRANDCAMP", feed: "lopată multifuncțională", expected: "zahradni-naradi" },
  { title: "Reishield", feed: "kapsule za spomin memorsh", expected: "stres" },
  { title: "Reishield", feed: "neuropat neuropatie neurosh", expected: "stres" },
];

console.log("\n=== reclassify-shelves — golden asserts ===\n");
let assertFail = 0;
for (const g of GOLDEN_ASSERTS) {
  const got = classifyTitleFirst(g.title, g.feed, "other");
  const ok = got === g.expected;
  if (!ok) assertFail += 1;
  console.log(`${ok ? "OK" : "FAIL"}  «${g.title.slice(0, 45)}» + «${g.feed.slice(0, 40)}» → ${got} (want ${g.expected})`);
}
if (assertFail) {
  console.error(`\n${assertFail} golden assert(s) failed — fix INTENT_PATTERNS before persist.\n`);
  if (!process.argv.includes("--skip-asserts")) process.exit(1);
}

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
    .select("raw, title, name, category")
    .eq("offer_id", offerId)
    .maybeSingle();
  if (!data) return null;
  const row = data as { raw?: unknown; title?: string; name?: string; category?: string };
  return row.raw ?? null;
}

const { loadOffers } = await import("../src/lib/offers.server.ts");
const offers = await loadOffers();
const resolvedMap = await loadResolvedCategoryMap();

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
const contentMap = await loadContentMap();
let filtered = offers;
if (filterSource) filtered = filtered.filter((o) => o.source === filterSource);
if (filterOffer != null && Number.isFinite(filterOffer)) {
  filtered = filtered.filter((o) => o.id === filterOffer);
}

console.log(`\n=== reclassify-shelves — ${filtered.length} offers (dryRun=${dryRun}) ===\n`);

let changed = 0;
let skip = 0;
const regenTargets: Array<{ source: OfferSource; id: number; slug: string }> = [];
const AUTO_SHELVES = new Set(["autodoplnky", "autodoplnky"]);

for (const o of filtered) {
  const rawTitle = o.title || o.brand || "";
  const raw = await loadRaw(o.source, o.id);
  const blob = raw
    ? buildPartnerClassifyBlob(o.source, raw, rawTitle, o.categoryKey || o.categoryName || "")
    : o.feedClassifyText || String(o.categoryKey || o.categoryName || "");
  const syncSlug = classifyTitleFirst(rawTitle, blob, "other");
  const content = contentMap.get(`${o.source}:${o.id}`);
  const dispUkForIntent = content?.display_title_uk?.trim() ?? null;
  const productRoleFromH1 = dispUkForIntent?.includes("—")
    ? dispUkForIntent.split(/\s*[—–-]\s*/).slice(1).join(" ").trim()
    : undefined;
  const newSlug = resolveIntentListingSlug({
    source: o.source,
    offerId: o.id,
    syncSlug,
    resolvedSlug: resolvedMap.get(`${o.source}:${o.id}`),
    rawTitle,
    brand: o.brand,
    productRole: productRoleFromH1,
    displayH1: dispUkForIntent ?? undefined,
    feedText: blob,
  });
  if (newSlug === "other" || newSlug === o.categorySlug) {
    skip += 1;
    continue;
  }
  changed += 1;
  const line = `${o.source}:${o.id}  ${o.categorySlug} → ${newSlug}  «${rawTitle.slice(0, 50)}»`;
  if (AUTO_SHELVES.has(o.categorySlug) || AUTO_SHELVES.has(newSlug)) {
    regenTargets.push({ source: o.source, id: o.id, slug: newSlug });
  }
  if (dryRun) {
    console.log(`DRY  ${line}`);
    continue;
  }
  const saved = await persistResolvedCategorySlug(o.source, o.id, newSlug);
  console.log(saved ? `OK   ${line}` : `FAIL ${line}`);
}

console.log(`\nDone — would_change=${changed} unchanged=${skip} dryRun=${dryRun}`);

if (regenAfter && !dryRun && regenTargets.length > 0) {
  const { getOrGenerateProductContent } = await import("../src/lib/ai-content.server.ts");
  console.log(`\n=== regen auto-shelf pack — ${regenTargets.length} offers ===\n`);
  let ok = 0;
  let fail = 0;
  for (const t of regenTargets) {
    const out = await getOrGenerateProductContent(t.source, t.id, "uk", t.slug, { forceRegen: true });
    if (out?.description_html && out.description_html.length >= 400) {
      ok += 1;
      console.log(`OK   ${t.source}:${t.id} → ${t.slug} html=${out.description_html.length}`);
    } else {
      fail += 1;
      console.log(`FAIL ${t.source}:${t.id} tier=${out?.content_tier ?? "null"}`);
    }
  }
  console.log(`\nRegen done — ok=${ok} fail=${fail}`);
}
