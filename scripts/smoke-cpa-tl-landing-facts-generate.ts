/**
 * Local smoke: live CPA.tl CZ landing facts (LLM extract) + force AI generate for 3 offers.
 *
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/smoke-cpa-tl-landing-facts-generate.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

process.env.CPA_TL_LANDING_FACTS_LIVE = "llm";
process.env.CPA_TL_LANDING_FACTS_LLM = "1";

/** Gluconix, ArtiZynt, Uromexil Forte — CZ landings from live feed. */
const IDS = [23334, 21180, 9181];

const FEED_URL = "https://cpa.tl/api/offers";

async function ensureOffersInDb(ids: number[]) {
  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
  const { data: existing } = await supabaseAdmin
    .from("cpa_tl_offers")
    .select("offer_id")
    .in("offer_id", ids);
  const have = new Set((existing ?? []).map((r) => Number((r as { offer_id: number }).offer_id)));
  const missing = ids.filter((id) => !have.has(id));
  if (!missing.length) {
    console.error(`[ensure] all ${ids.length} offers already in cpa_tl_offers`);
    return;
  }
  console.error(`[ensure] fetching feed for missing: ${missing.join(",")}`);
  const res = await fetch(FEED_URL, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`CPA.tl feed HTTP ${res.status}`);
  const json = (await res.json()) as { data: Array<Record<string, unknown>> };
  const byId = new Map((json.data ?? []).map((o) => [Number(o.id), o]));
  const now = new Date().toISOString();
  const rows = missing.map((id) => {
    const o = byId.get(id);
    if (!o) throw new Error(`Offer ${id} not in live CPA.tl feed`);
    return {
      offer_id: id,
      title: String(o.title ?? `Offer ${id}`),
      picture_url: (o.picture_url as string) ?? null,
      category: (o.category as string) ?? null,
      raw: o,
      is_active: true,
      synced_at: now,
    };
  });
  const { error } = await supabaseAdmin.from("cpa_tl_offers").upsert(rows as never, {
    onConflict: "offer_id",
  });
  if (error) throw new Error(`upsert cpa_tl_offers: ${error.message}`);
  console.error(`[ensure] upserted ${rows.length} offers`);
}

const { loadLiveCpaTlLandingFactsWithLlm } = await import("../src/lib/landing-facts.server.ts");
const { getOrGenerateProductContentDetailed } = await import("../src/lib/ai-content.server.ts");
const { resolveOfferSlug } = await import("../src/lib/slugify.ts");
const { cleanBrandName } = await import("../src/lib/brand-clean.ts");
const { getCpaTlRawOffer } = await import("../src/lib/cpa-tl-sync.server.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

await ensureOffersInDb(IDS);

const results = [];
for (const offerId of IDS) {
  const started = Date.now();
  console.error(`\n=== smoke cpa_tl:${offerId} (llm) ===`);
  try {
    const landing = await loadLiveCpaTlLandingFactsWithLlm(offerId);
    console.error(
      `landing method=${landing.method} status=${landing.status} lang=${landing.langHint} url=${landing.sourceUrl} fetchMs=${landing.timing.fetchMs} extractMs=${landing.timing.extractMs} json=${landing.jsonChars}`,
    );
    if (landing.facts) {
      console.error(
        `facts form=${landing.facts.form} role=${landing.facts.role} ingredients=${landing.facts.ingredients?.length ?? 0} benefits=${landing.facts.benefits?.length ?? 0} dosage=${landing.facts.dosage}`,
      );
    }
    if (landing.promptBlock) {
      console.error(`promptBlock:\n${landing.promptBlock}`);
    }
    const genStarted = Date.now();
    const generated = await getOrGenerateProductContentDetailed("cpa_tl", offerId, "uk", "other", {
      forceRegen: true,
    });
    const genMs = Date.now() - genStarted;
    const html = generated.content?.description_html ?? "";

    const raw = await getCpaTlRawOffer(offerId);
    const title = String(raw?.title ?? `Offer ${offerId}`);
    const brand = cleanBrandName(title);
    const slug = resolveOfferSlug({
      title,
      brand,
      offerId,
      source: "cpa_tl",
    });

    const { data: catRow } = await supabaseAdmin
      .from("product_briefs")
      .select("resolved_category_slug")
      .eq("source", "cpa_tl")
      .eq("offer_id", offerId)
      .maybeSingle();
    const category =
      (catRow as { resolved_category_slug?: string } | null)?.resolved_category_slug ?? "other";
    const url = `https://recenze-ceny.cz/${category}/${slug}`;

    const row = {
      offerId,
      ok: generated.status === "generated",
      url,
      category,
      slug,
      elapsed_ms: Date.now() - started,
      landing: {
        status: landing.status,
        langHint: landing.langHint,
        sourceUrl: landing.sourceUrl,
        jsonChars: landing.jsonChars,
        fullTextChars: landing.fullTextChars,
        method: landing.method ?? null,
        usage: landing.usage ?? null,
        facts: landing.facts,
        heuristicFacts: "heuristicFacts" in landing ? landing.heuristicFacts : null,
        timing: landing.timing,
        error: landing.error ?? null,
        promptBlock: landing.promptBlock,
      },
      generate: {
        status: generated.status,
        error: generated.error ?? null,
        genMs,
        tokens: generated.metrics?.totalTokens ?? null,
        displayTitle: generated.content?.display_title ?? null,
        htmlLen: html.length,
        hasSlozeni: /složen/i.test(html),
        hasFormHint: /gel|kapsle|kapky|krém/i.test(html),
        htmlPreview: html.slice(0, 400),
      },
    };
    results.push(row);
    console.error(
      `generate status=${row.generate.status} genMs=${genMs} totalMs=${row.elapsed_ms} htmlLen=${row.generate.htmlLen}`,
    );
    console.error(`URL ${url}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({ offerId, ok: false, error: message, elapsed_ms: Date.now() - started });
    console.error(`FAILED ${offerId}:`, message);
  }
}

mkdirSync(resolve(root, "scripts/out"), { recursive: true });
const outPath = resolve(root, "scripts/out/smoke-cpa-tl-landing-facts-generate.json");
writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
console.log(JSON.stringify(results, null, 2));
console.error(`\nWrote ${outPath}`);
console.error("\n=== PDP URLs ===");
for (const r of results) {
  if ("url" in r && r.url) console.error(r.url);
}
