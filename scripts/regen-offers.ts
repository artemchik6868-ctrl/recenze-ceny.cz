/**
 * Regenerate specific offers and persist to product_content.
 * Usage: npx tsx scripts/regen-offers.ts shakes:19998 adcombo:16983
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
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const keys = process.argv.slice(2);
if (!keys.length) {
  console.error("Usage: npx tsx scripts/regen-offers.ts source:id [source:id ...]");
  process.exit(1);
}

const { loadOffers } = await import("../src/lib/offers.server.ts");
const { getOrGenerateProductContentDetailed } = await import("../src/lib/ai-content.server.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

let failed = 0;
for (const key of keys) {
  const [source, idRaw] = key.split(":");
  const id = Number(idRaw);
  if (!source || !Number.isFinite(id)) {
    console.error(`Invalid key: ${key}`);
    failed += 1;
    continue;
  }
  const offers = await loadOffers();
  const offer = offers.find((o) => o.source === source && o.id === id) ?? null;
  if (!offer) {
    console.error(`Offer not found: ${key}`);
    failed += 1;
    continue;
  }
  console.log(`\n--- regen ${key} (${offer.categorySlug}) ---`);
  try {
    const r = await getOrGenerateProductContentDetailed(
      source as OfferSource,
      id,
      "uk",
      offer.categorySlug,
      { forceRegen: true },
    );
    const { data: row } = await supabaseAdmin
      .from("product_content")
      .select("display_title_uk, qa_status_uk, qa_reason_uk")
      .eq("source", source)
      .eq("offer_id", id)
      .maybeSingle();
    console.log(`OK status=${r.status} title=${(row as { display_title_uk?: string } | null)?.display_title_uk ?? "?"}`);
    console.log(`qa=${(row as { qa_status_uk?: string } | null)?.qa_status_uk} reason=${(row as { qa_reason_uk?: string } | null)?.qa_reason_uk}`);
  } catch (err) {
    console.error(`FAIL ${key}:`, err);
    failed += 1;
  }
}
process.exit(failed ? 1 : 0);
