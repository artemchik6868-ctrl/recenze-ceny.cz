/**
 * Warm m1 landing facts (DB drain) + force-regen all active CZ offers with tracking_link.
 *
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/warm-m1-landing-facts.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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

// Prod path: DB inject only (no live LLM during generate).
delete process.env.M1_TOP_LANDING_FACTS_LIVE;
delete process.env.M1_TOP_LANDING_FACTS_LLM;

const { syncM1TopOffers } = await import("../src/lib/m1-top-sync.server.ts");
const { drainM1TopLandingFacts } = await import("../src/lib/landing-facts.server.ts");
const { pickM1TopLandingUrl } = await import("../src/lib/landing-facts.ts");
const { getOrGenerateProductContentDetailed } = await import("../src/lib/ai-content.server.ts");
const { resolveOfferSlug } = await import("../src/lib/slugify.ts");
const { cleanBrandName } = await import("../src/lib/brand-clean.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

console.error("=== sync m1_top ===");
const synced = await syncM1TopOffers();
console.error(JSON.stringify(synced));

console.error("=== drain m1_landing_facts ===");
let remaining = Infinity;
const drainRounds = [];
for (let i = 0; i < 12 && remaining > 0; i++) {
  const r = await drainM1TopLandingFacts({ deadlineMs: 120_000, limit: 8 });
  drainRounds.push(r);
  remaining = r.remaining;
  console.error(
    `round ${i + 1}: processed=${r.processed} ok=${r.okCount} failed=${r.failed} remaining=${r.remaining}`,
  );
  if (r.processed === 0) break;
}

const { data: offers } = await supabaseAdmin
  .from("m1_offers")
  .select("offer_id, name, raw, category")
  .eq("is_active", true);
const withLink = (offers ?? []).filter((o) => {
  const raw = (o as { raw?: unknown }).raw;
  return !!pickM1TopLandingUrl((raw ?? {}) as { tracking_link?: string[] | null });
});
console.error(`=== regen ${withLink.length} offers with tracking_link ===`);

const results = [];
for (const row of withLink) {
  const offerId = Number((row as { offer_id: number }).offer_id);
  const name = String((row as { name?: string }).name ?? `Offer ${offerId}`);
  const started = Date.now();
  console.error(`\n--- regen m1_top:${offerId} ---`);
  try {
    const generated = await getOrGenerateProductContentDetailed("m1_top", offerId, "uk", "other", {
      forceRegen: true,
    });
    const brand = cleanBrandName(name);
    const slug = resolveOfferSlug({ title: name, brand, offerId, source: "m1_top" });
    const { data: catRow } = await supabaseAdmin
      .from("product_briefs")
      .select("resolved_category_slug")
      .eq("source", "m1_top")
      .eq("offer_id", offerId)
      .maybeSingle();
    const { data: pcRow } = await supabaseAdmin
      .from("product_content")
      .select("categories")
      .eq("source", "m1_top")
      .eq("offer_id", offerId)
      .maybeSingle();
    const categories = (pcRow as { categories?: string[] } | null)?.categories;
    const category =
      (catRow as { resolved_category_slug?: string } | null)?.resolved_category_slug ??
      (Array.isArray(categories) && categories[0] ? categories[0] : null) ??
      "other";
    const url = `https://recenze-ceny.cz/${category}/${slug}`;
    results.push({
      offerId,
      ok: generated.status === "generated",
      status: generated.status,
      url,
      title: generated.content?.display_title ?? null,
      ms: Date.now() - started,
    });
    console.error(`OK ${url}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({ offerId, ok: false, error: message, ms: Date.now() - started });
    console.error(`FAIL ${offerId}:`, message);
  }
}

mkdirSync(resolve(root, "scripts/out"), { recursive: true });
const outPath = resolve(root, "scripts/out/warm-m1-landing-facts.json");
writeFileSync(outPath, JSON.stringify({ synced, drainRounds, results }, null, 2), "utf8");
console.error(`\nWrote ${outPath}`);
console.error("\n=== PDP URLs ===");
for (const r of results) {
  if ("url" in r && r.url) console.error(r.url);
}
console.error(`\nDone ok=${results.filter((r) => r.ok).length}/${results.length}`);
