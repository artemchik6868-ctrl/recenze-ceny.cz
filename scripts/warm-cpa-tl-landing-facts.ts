/**
 * Warm CPA.tl landing facts (DB drain) + force-regen offers with CZ/CS landings.
 * Uses DB inject only (no live LLM during generate).
 *
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/warm-cpa-tl-landing-facts.ts
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
delete process.env.CPA_TL_LANDING_FACTS_LIVE;
delete process.env.CPA_TL_LANDING_FACTS_LLM;

const { syncCpaTlOffers } = await import("../src/lib/cpa-tl-sync.server.ts");
const { drainCpaTlLandingFacts } = await import("../src/lib/landing-facts.server.ts");
const { pickCpaTlCzLandingUrl } = await import("../src/lib/landing-facts.ts");
const { getOrGenerateProductContentDetailed } = await import("../src/lib/ai-content.server.ts");
const { resolveOfferSlug } = await import("../src/lib/slugify.ts");
const { cleanBrandName } = await import("../src/lib/brand-clean.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

console.error("=== sync cpa_tl ===");
const synced = await syncCpaTlOffers();
console.error(JSON.stringify(synced));

console.error("=== drain cpa_tl_landing_facts ===");
let remaining = Infinity;
const drainRounds = [];
for (let i = 0; i < 12 && remaining > 0; i++) {
  const r = await drainCpaTlLandingFacts({ deadlineMs: 120_000, limit: 8 });
  drainRounds.push(r);
  remaining = r.remaining;
  console.error(
    `round ${i + 1}: processed=${r.processed} ok=${r.okCount} failed=${r.failed} remaining=${r.remaining}`,
  );
  if (r.processed === 0) break;
}

const { data: offers } = await supabaseAdmin
  .from("cpa_tl_offers")
  .select("offer_id, title, raw, category")
  .eq("is_active", true);
const withLanding = (offers ?? []).filter((o) => {
  const raw = (o as { raw?: unknown }).raw;
  return !!pickCpaTlCzLandingUrl(
    (raw ?? {}) as {
      landings?: Array<{ url?: string; language_code?: string; language?: string }>;
    },
  );
});
console.error(`=== regen ${withLanding.length} offers with CZ landing ===`);

const results = [];
for (const row of withLanding) {
  const offerId = Number((row as { offer_id: number }).offer_id);
  const name = String((row as { title?: string }).title ?? `Offer ${offerId}`);
  const started = Date.now();
  console.error(`\n--- regen cpa_tl:${offerId} ---`);
  try {
    const generated = await getOrGenerateProductContentDetailed("cpa_tl", offerId, "uk", "other", {
      forceRegen: true,
    });
    const brand = cleanBrandName(name);
    const slug = resolveOfferSlug({ title: name, brand, offerId, source: "cpa_tl" });
    const { data: catRow } = await supabaseAdmin
      .from("product_briefs")
      .select("resolved_category_slug")
      .eq("source", "cpa_tl")
      .eq("offer_id", offerId)
      .maybeSingle();
    const { data: pcRow } = await supabaseAdmin
      .from("product_content")
      .select("categories")
      .eq("source", "cpa_tl")
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
const outPath = resolve(root, "scripts/out/warm-cpa-tl-landing-facts.json");
writeFileSync(outPath, JSON.stringify({ synced, drainRounds, results }, null, 2), "utf8");
console.error(`\nWrote ${outPath}`);
console.error("\n=== PDP URLs ===");
for (const r of results) {
  if ("url" in r && r.url) console.error(r.url);
}
console.error(`\nDone ok=${results.filter((r) => r.ok).length}/${results.length}`);
