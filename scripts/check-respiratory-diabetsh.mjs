/**
 * Quick check: former respiratory shakes slugs + diabetsh classification.
 * Run: npx tsx scripts/check-respiratory-diabetsh.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const RESPIRATORY_IDS = [
  21086, 21094, 21182, 21654, 21928, 21948, 21956, 21968, 21976, 15928, 19794, 21980,
];
const DIABETSH_IDS = [16638, 16648];

const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
const { buildPartnerClassifyBlob } = await import("../src/lib/partner-feed-text.ts");
const { classifyTitleFirst } = await import("../src/lib/classify.ts");
const { inferProductIntentSlug } = await import("../src/lib/product-intent.de.ts");
const { resolveIntentListingSlug } = await import("../src/lib/catalog-shelf.ts");
const { loadResolvedCategoryMap } = await import("../src/lib/catalog-shelf.server.ts");

const resolvedMap = await loadResolvedCategoryMap();

const { data: contentRows } = await supabaseAdmin
  .from("product_content")
  .select("source, offer_id, display_title_uk")
  .eq("source", "shakes")
  .in("offer_id", [...RESPIRATORY_IDS, ...DIABETSH_IDS]);

const displayById = new Map(
  (contentRows ?? []).map((r) => [r.offer_id, r.display_title_uk]),
);

console.log("\n=== Former respiratory shakes (categorySlug check) ===\n");
console.log("id\tresolved\tintent\texpected\tdisplayTitle");
for (const id of RESPIRATORY_IDS) {
  const { data } = await supabaseAdmin
    .from("shakes_offers")
    .select("title, category, raw, is_active")
    .eq("offer_id", id)
    .maybeSingle();
  if (!data) {
    console.log(`${id}\tMISSING`);
    continue;
  }
  const title = data.title || "";
  const blob = buildPartnerClassifyBlob("shakes", data.raw, title, data.category ?? "");
  const expected = classifyTitleFirst(title, blob, "other");
  const intent = inferProductIntentSlug(title, "", blob);
  const key = `shakes:${id}`;
  const listing = resolveIntentListingSlug({
    source: "shakes",
    offerId: id,
    syncSlug: expected,
    resolvedSlug: resolvedMap.get(key),
    rawTitle: title,
    feedText: blob,
  });
  const disp = (displayById.get(id) ?? "").slice(0, 55);
  console.log(`${id}\t${listing}\t${intent ?? "?"}\t${expected}\t${disp}`);
}

const { count: respCount } = await supabaseAdmin
  .from("shakes_offers")
  .select("offer_id", { count: "exact", head: true })
  .eq("is_active", true)
  .eq("category", "dychaci-cesty");

console.log(`\nshakes_offers.category=respiratory-health (active): ${respCount ?? 0}`);

const { data: allShakes } = await supabaseAdmin
  .from("shakes_offers")
  .select("offer_id, title, category, raw")
  .eq("is_active", true);
let resolvedResp = 0;
for (const row of allShakes ?? []) {
  const blob = buildPartnerClassifyBlob("shakes", row.raw, row.title ?? "", row.category ?? "");
  const listing = resolveIntentListingSlug({
    source: "shakes",
    offerId: row.offer_id,
    syncSlug: classifyTitleFirst(row.title ?? "", blob, "other"),
    resolvedSlug: resolvedMap.get(`shakes:${row.offer_id}`),
    rawTitle: row.title ?? "",
    feedText: blob,
  });
  if (listing === "dychaci-cesty") resolvedResp += 1;
}
console.log(`resolved listingSlug=respiratory-health (active shakes): ${resolvedResp}`);

console.log("\n=== Diabetsh classification (16638, 16648) ===\n");
for (const id of DIABETSH_IDS) {
  const { data } = await supabaseAdmin
    .from("shakes_offers")
    .select("title, category, raw, is_active")
    .eq("offer_id", id)
    .maybeSingle();
  if (!data) {
    console.log(`${id}: MISSING`);
    continue;
  }
  const title = data.title || "";
  const blob = buildPartnerClassifyBlob("shakes", data.raw, title, data.category ?? "");
  const expected = classifyTitleFirst(title, blob, "other");
  const intent = inferProductIntentSlug(title, "", blob);
  const key = `shakes:${id}`;
  const resolved = resolvedMap.get(key);
  const listing = resolveIntentListingSlug({
    source: "shakes",
    offerId: id,
    syncSlug: expected,
    resolvedSlug: resolved,
    rawTitle: title,
    feedText: blob,
  });
  console.log(`--- shakes:${id} active=${data.is_active} ---`);
  console.log(`title: ${title}`);
  console.log(`sync category col: ${data.category ?? "(null)"}`);
  console.log(`resolved DB slug: ${resolved ?? "(none)"}`);
  console.log(`intent: ${intent ?? "?"}`);
  console.log(`classifyTitleFirst: ${expected}`);
  console.log(`listingSlug: ${listing}`);
  console.log(`display: ${(displayById.get(id) ?? "").slice(0, 80)}`);
  console.log(`blob[0:200]: ${blob.slice(0, 200).replace(/\s+/g, " ")}`);
  console.log("");
}
