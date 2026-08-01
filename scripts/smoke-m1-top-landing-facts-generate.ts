/**
 * Local smoke: live m1.top tracking_link landing facts (LLM extract) + force AI generate for 3 CZ offers.
 *
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/smoke-m1-top-landing-facts-generate.ts
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

process.env.M1_TOP_LANDING_FACTS_LIVE = "llm";
process.env.M1_TOP_LANDING_FACTS_LLM = "1";

const FEED_URL = "https://m1.top/offers_export_api/";
const MARKET_GEO = "CZ";

/** Usage: ...generate.ts [limit=5] [skip=6153,6151,6075] */
const argLimit = Number(process.argv.find((a) => a.startsWith("limit="))?.slice(6) ?? 3);
const argSkip = new Set(
  (process.argv.find((a) => a.startsWith("skip="))?.slice(5) ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0),
);
const LIMIT = Number.isFinite(argLimit) && argLimit > 0 ? argLimit : 3;

type M1Target = { code?: string; price?: string; pay?: string; currency?: string };
type M1Offer = {
  id?: string | number;
  name?: string;
  product_id?: string | number;
  info?: string;
  img?: string;
  target?: M1Target[];
  tracking_link?: string[] | null;
};

async function pickCzOffersWithLandings(limit: number, skip: Set<number>): Promise<M1Offer[]> {
  const { fetchM1FeedJson } = await import("../src/lib/m1-top-sync.server.ts");
  const all = (await fetchM1FeedJson()) as M1Offer[];
  const cz = (all ?? []).filter((o) => {
    const id = Number(o.id);
    if (skip.has(id)) return false;
    const hasCz = (o.target ?? []).some((t) => t.code === MARKET_GEO);
    const links = (o.tracking_link ?? []).filter((u) => String(u ?? "").trim());
    return hasCz && links.length > 0;
  });
  if (cz.length < limit) {
    throw new Error(`Need ${limit} CZ offers with tracking_link (after skip), found ${cz.length}`);
  }
  return cz.slice(0, limit);
}

async function ensureOffersInDb(offers: M1Offer[]) {
  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
  const { classifyByText } = await import("../src/lib/classify.ts");
  const now = new Date().toISOString();
  const rows = offers.map((o) => {
    const id = Number(o.id);
    const inT = (o.target ?? []).find((t) => t.code === MARKET_GEO)!;
    const price = Number(inT.price);
    const pay = Number(inT.pay);
    const name = String(o.name || `Offer ${id}`);
    const slug = classifyByText(name, "other");
    return {
      offer_id: id,
      name,
      picture_url: (o.img ?? "").replace("/offer_img100x100/", "/offer_img300x300/") || null,
      category: slug,
      price_uah: Number.isFinite(price) ? price : null,
      pay_uah: Number.isFinite(pay) ? pay : null,
      raw: o,
      is_active: true,
      synced_at: now,
    };
  });
  const { error } = await supabaseAdmin.from("m1_offers").upsert(rows as never, {
    onConflict: "offer_id",
  });
  if (error) throw new Error(`upsert m1_offers: ${error.message}`);
  console.error(`[ensure] upserted ${rows.length} m1 offers with live tracking_link`);
}

const offers = await pickCzOffersWithLandings(LIMIT, argSkip);
const IDS = offers.map((o) => Number(o.id));
console.error(
  `[pick] limit=${LIMIT} skip=[${[...argSkip].join(",")}] CZ+tracking_link ids: ${IDS.join(", ")}`,
);
for (const o of offers) {
  const link = (o.tracking_link ?? []).find((u) => String(u ?? "").trim());
  console.error(`  ${o.id} ${String(o.name).slice(0, 60)} → ${String(link).split("?")[0]}`);
}

await ensureOffersInDb(offers);

const { loadLiveM1TopLandingFactsWithLlm } = await import("../src/lib/landing-facts.server.ts");
const { getOrGenerateProductContentDetailed } = await import("../src/lib/ai-content.server.ts");
const { resolveOfferSlug } = await import("../src/lib/slugify.ts");
const { cleanBrandName } = await import("../src/lib/brand-clean.ts");
const { getM1TopRawOffer } = await import("../src/lib/m1-top-sync.server.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

const results = [];
for (const offerId of IDS) {
  const started = Date.now();
  console.error(`\n=== smoke m1_top:${offerId} (llm) ===`);
  try {
    const landing = await loadLiveM1TopLandingFactsWithLlm(offerId);
    console.error(
      `landing method=${landing.method} status=${landing.status} lang=${landing.langHint} url=${landing.sourceUrl} fetchMs=${landing.timing.fetchMs} extractMs=${landing.timing.extractMs} json=${landing.jsonChars}`,
    );
    if (landing.facts) {
      console.error(
        `facts form=${landing.facts.form} role=${landing.facts.role} ingredients=${landing.facts.ingredients?.length ?? 0} benefits=${landing.facts.benefits?.length ?? 0} dosage=${landing.facts.dosage}`,
      );
    }
    if (landing.error) console.error(`landing error: ${landing.error}`);
    if (landing.promptBlock) {
      console.error(`promptBlock:\n${landing.promptBlock}`);
    }

    const genStarted = Date.now();
    const generated = await getOrGenerateProductContentDetailed("m1_top", offerId, "uk", "other", {
      forceRegen: true,
    });
    const genMs = Date.now() - genStarted;
    const html = generated.content?.description_html ?? "";

    const raw = await getM1TopRawOffer(offerId);
    const title = String(raw?.name ?? `Offer ${offerId}`);
    const brand = cleanBrandName(title);
    const slug = resolveOfferSlug({
      title,
      brand,
      offerId,
      source: "m1_top",
    });

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
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = resolve(root, `scripts/out/smoke-m1-top-landing-facts-generate-${stamp}.json`);
const latestPath = resolve(root, "scripts/out/smoke-m1-top-landing-facts-generate.json");
const payload = JSON.stringify(results, null, 2);
writeFileSync(outPath, payload, "utf8");
writeFileSync(latestPath, payload, "utf8");
console.log(payload);
console.error(`\nWrote ${outPath}`);
console.error(`Also ${latestPath}`);
console.error("\n=== PDP URLs ===");
for (const r of results) {
  if ("url" in r && r.url) console.error(r.url);
}
