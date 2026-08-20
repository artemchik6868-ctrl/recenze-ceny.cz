import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resolveFirstSeenAt, isMissingFirstSeenColumnError } from "./offer-first-seen.server";
import { getCategoryContent } from "./content.cs";
import { MARKET_GEO } from "./market";
import { classifyByText, classifyTitleFirst } from "./classify";
import { buildPartnerClassifyBlob } from "./partner-feed-text";
import { resolveOfferSlug } from "./slugify";
import { cleanBrandName } from "./brand-clean";
import type { Offer } from "./types";
import { fetchFeed } from "./feed-sync-http";
import { deactivateMissingActiveOffers } from "./feed-sync-deactivate.server";

const FEED_URL = "https://api.cpa.tl/api/offers";

const CATEGORY_SLUG_MAP: Record<string, string> = {
  "Нутра: диабет": "cukrovka",
  "Нутра: гипертония": "krevni-tlak",
  "Нутра: паразиты": "paraziti",
  "Нутра: суставы": "klouby",
  "Нутра: потенция": "potence",
  "Нутра: похудение": "hubnuti",
  "Нутра: простатит": "prostata",
  "Нутра: зрение": "zrak",
  "Нутра: геморрой": "hemoroidy",
  "Нутра: женское здоровье": "zdravi-zen",
};

function extractCategoryKey(raw: string): string {
  const dashIdx = raw.lastIndexOf("—");
  const tail = dashIdx >= 0 ? raw.slice(dashIdx + 1) : raw;
  return tail.trim();
}

function brandFromTitle(title: string): string {
  return cleanBrandName(title);
}


type RawGoal = {
  geo: string;
  landing_price?: string;
  landing_currency?: string;
};
type RawLanding = { url: string; language_code?: string; language?: string };
export type CpaTlRawOffer = {
  id: number;
  title: string;
  category: string;
  picture_url: string;
  description: string;
  published_at: string;
  goals: RawGoal[];
  landings: RawLanding[];
};

type CpaTlRow = {
  offer_id: number;
  title: string;
  picture_url: string | null;
  category: string | null;
  raw: CpaTlRawOffer;
  is_active: boolean;
  synced_at: string;
  first_seen_at?: string | null;
};

/** Fetch full CPA.tl feed and upsert into cpa_tl_offers. */
export async function syncCpaTlOffers(): Promise<{
  fetched: number;
  ua: number;
  upserted: number;
  deactivated: number;
  skipped?: string;
}> {
  const res = await fetchFeed(FEED_URL);
  if (!res.ok) {
    // cpa.tl (www) is WAF-blocked; api.cpa.tl is the live feed. Skip deactivate on 403.
    if (res.status === 403) {
      console.warn("[cpa_tl] feed HTTP 403 — skip (no deactivate); Worker retries api.cpa.tl");
      return { fetched: 0, ua: 0, upserted: 0, deactivated: 0, skipped: "http_403" };
    }
    throw new Error(`CPA.tl feed HTTP ${res.status}`);
  }
  const json = (await res.json()) as { data: CpaTlRawOffer[] };
  const all = json.data || [];

  const ua = all.filter((o) => o.goals?.some((g) => g.geo === MARKET_GEO));

  const rows = ua.map((o) => ({
    offer_id: Number(o.id),
    title: String(o.title || `Offer ${o.id}`),
    picture_url: o.picture_url ?? null,
    category: o.category ?? null,
    raw: o,
    is_active: true,
    synced_at: new Date().toISOString(),
  }));

  if (rows.length > 0) {
    const { error } = await supabaseAdmin
      .from("cpa_tl_offers")
      .upsert(rows as never, { onConflict: "offer_id" });
    if (error) throw new Error(`upsert cpa_tl_offers: ${error.message}`);
  }

  const ids = rows.map((r) => r.offer_id);
  const { deactivated } = await deactivateMissingActiveOffers("cpa_tl_offers", ids);

  return {
    fetched: all.length,
    ua: ua.length,
    upserted: rows.length,
    deactivated,
  };
}

function normalize(raw: CpaTlRawOffer, syncedAt: string, firstSeenAt: string): Offer | null {
  const inGoal = raw.goals?.find((g) => g.geo === MARKET_GEO);
  if (!inGoal) return null;

  const categoryKey = extractCategoryKey(raw.category);
  const classifyBlob = buildPartnerClassifyBlob("cpa_tl", raw, raw.title, raw.category);
  // Title-first: an unambiguous brand/title cue ("Papillom", "Massage Gun",
  // "Blood Pressure Monitor") must outrank a coarse feed bucket. Fall back
  // to the static bucket map, then to a broader title+category re-scan.
  const titleFirst = classifyTitleFirst(raw.title, classifyBlob, "other");
  const mapped = CATEGORY_SLUG_MAP[categoryKey];
  const categorySlug =
    titleFirst !== "other"
      ? titleFirst
      : mapped ?? classifyByText(`${raw.title} ${classifyBlob}`, "other");
  const content = getCategoryContent(categorySlug);

  const brand = brandFromTitle(raw.title);
  const slug = resolveOfferSlug({
    title: raw.title,
    brand,
    offerId: raw.id,
    source: "cpa_tl",
  });

  return {
    id: raw.id,
    source: "cpa_tl",
    slug,
    title: brand,
    brand,
    subtitle: content.subtitleHi(brand),
    categoryKey,
    categoryName: content.nameHi,
    categorySlug,
    image: raw.picture_url,
    priceEUR: (() => {
      const raw = inGoal.landing_price ? Number(inGoal.landing_price) : NaN;
      if (!Number.isFinite(raw) || raw <= 0) return 0;
      return Math.round(raw);
    })(),
    landingUrl: null,
    publishedAt: raw.published_at || syncedAt,
    firstSeenAt,
    feedClassifyText: classifyBlob || undefined,
  };
}

/** Load active CPA.tl offers from DB and map to unified Offer shape.
 *  Filter removed: non-nutra items are reclassified by keyword in normalize(). */
export async function loadCpaTlOffersAsOffers(): Promise<Offer[]> {
  const baseSelect =
    "offer_id, title, picture_url, category, raw, synced_at, is_active";
  let { data, error } = await supabaseAdmin
    .from("cpa_tl_offers")
    .select(`${baseSelect}, first_seen_at`)
    .eq("is_active", true);
  if (error && isMissingFirstSeenColumnError(error.message)) {
    console.warn("loadCpaTlOffersAsOffers: first_seen_at missing, using synced_at fallback");
    ({ data, error } = await supabaseAdmin
      .from("cpa_tl_offers")
      .select(baseSelect)
      .eq("is_active", true));
  }
  if (error) {
    console.error("loadCpaTlOffersAsOffers:", error.message);
    return [];
  }
  return (data as CpaTlRow[])
    .map((row) =>
      normalize(row.raw, row.synced_at, resolveFirstSeenAt(row)),
    )
    .filter((o): o is Offer => o !== null)
    .sort((a, b) => (a.publishedAt > b.publishedAt ? -1 : 1));
}

/** Get the raw CPA.tl payload for a single offer (used by AI content & lead routing). */
export async function getCpaTlRawOffer(
  offerId: number,
): Promise<CpaTlRawOffer | null> {
  const { data, error } = await supabaseAdmin
    .from("cpa_tl_offers")
    .select("raw")
    .eq("offer_id", offerId)
    .maybeSingle();
  if (error || !data) return null;
  return (data.raw as CpaTlRawOffer) ?? null;
}
