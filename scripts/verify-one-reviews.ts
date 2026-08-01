/**
 * Verify: generate LLM reviews for one existing product_content row and
 * assemble UI personas via pickReviewsFromStored.
 *
 *   npx tsx scripts/verify-one-reviews.ts
 *   npx tsx scripts/verify-one-reviews.ts --source=shakes --offer=12345
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OfferSource } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(): void {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    if (process.env[key] !== undefined && process.env[key] !== "") continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    process.env[key] = v;
  }
}

function arg(name: string): string | null {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

async function main() {
  loadEnv();
  if (!process.env.AI_API_KEY && !process.env.LOVABLE_API_KEY) {
    console.error("Missing AI_API_KEY");
    process.exit(1);
  }

  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
  const { generateReviewsOnlyForOffer } = await import("../src/lib/ai-content.server.ts");
  const { pickReviewsFromStored, averageRating } = await import("../src/lib/reviews.ts");
  const { findOfferById } = await import("../src/lib/offers.server.ts");

  const sourceArg = arg("source") as OfferSource | null;
  const offerArg = arg("offer");

  let source: OfferSource;
  let offerId: number;
  let categorySlug = "other";
  let title = "";

  if (sourceArg && offerArg) {
    source = sourceArg;
    offerId = Number(offerArg);
    const { data } = await supabaseAdmin
      .from("product_content")
      .select("display_title_uk, reviews_uk")
      .eq("source", source)
      .eq("offer_id", offerId)
      .maybeSingle();
    if (!data?.display_title_uk) {
      console.error(`No product_content for ${source}:${offerId}`);
      process.exit(1);
    }
    title = data.display_title_uk;
    const offer = await findOfferById(offerId).catch(() => null);
    categorySlug = offer?.categorySlug ?? "other";
  } else {
    const { data, error } = await supabaseAdmin
      .from("product_content")
      .select("source, offer_id, display_title_uk, reviews_uk")
      .not("display_title_uk", "is", null)
      .not("description_html_uk", "is", null)
      .limit(30);
    if (error || !data?.length) {
      console.error("No product_content rows:", error?.message);
      process.exit(1);
    }
    const pick =
      data.find((r) => !Array.isArray(r.reviews_uk) || r.reviews_uk.length < 5) ?? data[0];
    source = pick.source as OfferSource;
    offerId = pick.offer_id;
    title = String(pick.display_title_uk);
    const offer = await findOfferById(offerId).catch(() => null);
    categorySlug = offer?.categorySlug ?? "other";
  }

  console.log(`Generating reviews for ${source}:${offerId} (${categorySlug}) — ${title}`);
  const res = await generateReviewsOnlyForOffer(source, offerId, categorySlug);
  console.log("generateReviewsOnlyForOffer:", res);
  if (!res.ok) process.exit(1);

  const { data: row, error: readErr } = await supabaseAdmin
    .from("product_content")
    .select("reviews_uk")
    .eq("source", source)
    .eq("offer_id", offerId)
    .maybeSingle();
  if (readErr || !row) {
    console.error("Readback failed:", readErr?.message);
    process.exit(1);
  }

  const stored = row.reviews_uk;
  console.log("\nreviews_uk length:", Array.isArray(stored) ? stored.length : 0);
  console.log(JSON.stringify(stored, null, 2));

  const ui = pickReviewsFromStored(offerId, stored, "cs");
  const avg = averageRating(ui);
  console.log("\nUI assembly:", ui.length, "reviews, avg=", avg);
  for (const r of ui) {
    console.log(`- ${r.name} (${r.city}, ${r.age}) ${r.rating}★: ${r.text.slice(0, 80)}…`);
  }
  if (ui.length < 3) {
    console.error("UI reviews too thin");
    process.exit(1);
  }
  console.log("\nverify-one-reviews OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
