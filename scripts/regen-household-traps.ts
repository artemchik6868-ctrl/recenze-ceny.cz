/** Check + regen household-trap Shakes offers. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPartnerClassifyBlob } from "../src/lib/partner-feed-text";
import { resolveIntentListingSlug } from "../src/lib/catalog-shelf";
import { classifyTitleFirst } from "../src/lib/classify";
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

const TARGETS: Array<[OfferSource, number]> = [
  ["shakes", 16086],
  ["shakes", 17638],
  ["shakes", 17640],
  ["shakes", 18856],
  ["shakes", 18930],
];

const dryRun = process.argv.includes("--dry-run");
const doRegen = process.argv.includes("--regen");

const { persistResolvedCategorySlug, loadResolvedCategoryMap } = await import(
  "../src/lib/catalog-shelf.server.ts"
);
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
const resolvedMap = await loadResolvedCategoryMap();

for (const [source, id] of TARGETS) {
  const { data } = await supabaseAdmin
    .from("shakes_offers")
    .select("offer_id, title, category, raw")
    .eq("offer_id", id)
    .maybeSingle();
  if (!data) {
    console.log("MISSING", source, id);
    continue;
  }
  const row = data as { title: string; category: string | null; raw: unknown };
  const blob = buildPartnerClassifyBlob("shakes", row.raw, row.title, row.category);
  const syncSlug = classifyTitleFirst(row.title, blob, "other");
  const newSlug = resolveIntentListingSlug({
    source,
    offerId: id,
    syncSlug,
    resolvedSlug: resolvedMap.get(`${source}:${id}`),
    rawTitle: row.title,
    feedText: blob,
  });
  const key = `${source}:${id}`;
  const oldResolved = resolvedMap.get(key);
  console.log(key, "sync=", syncSlug, "listing=", newSlug, "resolved=", oldResolved ?? "null");
  if (!dryRun && newSlug !== "other" && newSlug !== oldResolved) {
    const ok = await persistResolvedCategorySlug(source, id, newSlug);
    console.log("  persist", newSlug, ok ? "OK" : "FAIL");
  }
}

if (doRegen && !dryRun) {
  const { getOrGenerateProductContent } = await import("../src/lib/ai-content.server.ts");
  const { loadOffers } = await import("../src/lib/offers.server.ts");
  const offers = await loadOffers();
  for (const [source, id] of TARGETS) {
    const o = offers.find((x) => x.source === source && x.id === id);
    if (!o) continue;
    console.log("REGEN", source, id, o.categorySlug);
    await getOrGenerateProductContent(o.source, o.id, "uk", o.categorySlug, { forceRegen: true });
  }
}
