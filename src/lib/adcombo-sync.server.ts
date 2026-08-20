import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resolveFirstSeenAt, isMissingFirstSeenColumnError } from "./offer-first-seen.server";
import { getCategoryContent } from "./content.cs";
import { MARKET_GEO } from "./market";
import { LEAD_ERRORS_CS } from "./lead-errors.cs";
import { classifyByText, classifyTitleFirst } from "./classify";
import { buildPartnerClassifyBlob } from "./partner-feed-text";
import { resolveOfferSlug } from "./slugify";
import { normalizeProductTitle, cleanBrandName } from "./brand-clean";
import { SITE } from "./site";
import type { Offer } from "./types";
import {
  emptyPageBeforeEndError,
  isFeedPageExhausted,
} from "./feed-sync-guards";
import { fetchFeed } from "./feed-sync-http";
import { deactivateMissingActiveOffers } from "./feed-sync-deactivate.server";

const OFFERS_URL = "https://api.adcombo.com/offer/info/";
const ORDER_URL = "https://api.adcombo.com/api/v2/order/create/";

const CATEGORY_BLACKLIST_RE =
  /(betting|gambling|casino|dating|insurance|finance|loan|sweepstake|survey|software|subscription)/i;
const TEXT_BLACKLIST_RE =
  /(casino|bet\b|betting|slot|poker|crypto|forex|trading|binary|dating|gambl)/i;

type AdcomboPayout = {
  country_code?: string;
  amount?: number;
  currency?: string;
};

type AdcomboPriceRow = {
  price?: number;
  price_raw?: number;
  currency?: string;
};

export type AdcomboRawOffer = {
  id: number;
  name: string;
  countries?: string;
  categories?: string[];
  thumbs?: string[];
  payout?: AdcomboPayout[];
  total_price?: { default?: AdcomboPriceRow[]; [k: string]: AdcomboPriceRow[] | undefined };
  type?: string;
  state?: string;
  description?: Record<string, string>;
  /** Landing price for IT order/create — stored at sync time. */
  order_price_it?: number;
  order_currency_it?: string;
};

type AdcomboRow = {
  offer_id: number;
  title: string;
  picture_url: string | null;
  category: string | null;
  raw: AdcomboRawOffer;
  is_active: boolean;
  synced_at: string;
};

type AdcomboDbRow = AdcomboRow & {
  first_seen_at?: string | null;
};

function normalizeCurrency(raw?: string): string {
  if (!raw) return "EUR";
  const t = raw.trim();
  if (t === "$") return "USD";
  if (t === "€") return "EUR";
  return t.toUpperCase();
}

function hasGeo(countries: string | undefined, geo: string): boolean {
  if (!countries) return false;
  return countries
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .includes(geo);
}

export function adcomboBlockReason(o: AdcomboRawOffer): string | null {
  if (o.state !== "active") return "state:inactive";
  if (String(o.type ?? "").toUpperCase() !== "COD") return "type:not_cod";
  if (!hasGeo(o.countries, MARKET_GEO)) return "geo:no_cz";
  const cats = (o.categories ?? []).join(" ");
  const catMatch = cats.match(CATEGORY_BLACKLIST_RE);
  if (catMatch) return `category:${catMatch[1]!.toLowerCase()}`;
  const text = `${o.name ?? ""} ${cats}`;
  const textMatch = text.match(TEXT_BLACKLIST_RE);
  if (textMatch) return `text:${textMatch[1]!.toLowerCase()}`;
  return null;
}

function orderPriceForIt(o: AdcomboRawOffer): { price: number | null; currency: string } {
  const itPayout = o.payout?.find((p) => String(p.country_code).toUpperCase() === MARKET_GEO);
  const row = o.total_price?.default?.[0] ?? o.total_price?.[MARKET_GEO]?.[0];
  const raw =
    row?.price_raw != null
      ? Number(row.price_raw)
      : itPayout?.amount != null
        ? Number(itPayout.amount)
        : row?.price != null
          ? Number(row.price)
          : NaN;
  const currency = normalizeCurrency(
    row?.currency ?? itPayout?.currency ?? "EUR",
  );
  if (!Number.isFinite(raw) || raw <= 0) return { price: null, currency };
  return { price: Math.round(raw), currency };
}

function priceEurFromIt(o: AdcomboRawOffer): number | null {
  const { price } = orderPriceForIt(o);
  return price;
}

function brandFromTitle(title: string): string {
  return cleanBrandName(title);
}

function categorySlugFromOffer(o: AdcomboRawOffer, title: string): string {
  const blob = buildPartnerClassifyBlob("adcombo", o, title, (o.categories ?? []).join(", "));
  const titleFirst = classifyTitleFirst(title, blob, "other");
  return titleFirst !== "other" ? titleFirst : classifyByText(`${title} ${blob}`, "other");
}

export type AdcomboPageCursor = {
  kind: "page";
  /** 1-based page number for the next fetch. */
  offset: number;
  offerIds: number[];
  fetched: number;
  allowed: number;
  blocked: number;
  blockedByReason: Record<string, number>;
  /** false after country=CZ probe returned empty/400. */
  countryFilter?: boolean;
};

export type AdcomboSyncChunkResult = {
  done: boolean;
  nextCursor?: AdcomboPageCursor;
  stats: {
    fetched: number;
    allowed: number;
    upserted: number;
    deactivated: number;
    blocked: number;
    blockedByReason: Record<string, number>;
    chunkPages: number;
    done: boolean;
  };
};

const ADCOMBO_PER_PAGE = 100;
/** Pages per Worker invocation. */
export const ADCOMBO_MAX_PAGES_PER_UNIT = 8;

async function fetchAdcomboPage(
  apiKey: string,
  page: number,
  countryFilter: boolean,
): Promise<{
  offers: AdcomboRawOffer[];
  total: number;
  status: number;
  countryFilter: boolean;
}> {
  const buildUrl = (withCountry: boolean) => {
    const url = new URL(OFFERS_URL);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(ADCOMBO_PER_PAGE));
    if (withCountry) url.searchParams.set("country", MARKET_GEO);
    return url;
  };

  let useCountry = countryFilter;
  let res = await fetchFeed(buildUrl(useCountry));
  if (useCountry && page === 1 && (res.status === 400 || res.status === 422)) {
    console.info("[adcombo] country=CZ not accepted — falling back to unfiltered feed");
    useCountry = false;
    res = await fetchFeed(buildUrl(false));
  }
  if (!res.ok) throw new Error(`AdCombo offers HTTP ${res.status}`);
  const json = (await res.json()) as { offers?: AdcomboRawOffer[]; total?: number };
  let pageOffers = json.offers ?? [];
  let total = json.total ?? pageOffers.length;
  if (useCountry && page === 1 && pageOffers.length === 0 && (json.total ?? 0) === 0) {
    console.info("[adcombo] country=CZ probe empty — falling back to unfiltered feed");
    useCountry = false;
    res = await fetchFeed(buildUrl(false));
    if (!res.ok) throw new Error(`AdCombo offers HTTP ${res.status}`);
    const retry = (await res.json()) as { offers?: AdcomboRawOffer[]; total?: number };
    pageOffers = retry.offers ?? [];
    total = retry.total ?? pageOffers.length;
  }
  return { offers: pageOffers, total, status: res.status, countryFilter: useCountry };
}

export async function syncAdcomboOffersChunk(
  opts: {
    cursor?: AdcomboPageCursor | null;
    maxPages?: number;
  } = {},
): Promise<AdcomboSyncChunkResult> {
  const apiKey = process.env.ADCOMBO_API_KEY;
  if (!apiKey) throw new Error("ADCOMBO_API_KEY not configured");

  const maxPages = opts.maxPages ?? ADCOMBO_MAX_PAGES_PER_UNIT;
  let page = opts.cursor?.offset ?? 1;
  let fetched = opts.cursor?.fetched ?? 0;
  let allowedCount = opts.cursor?.allowed ?? 0;
  let blocked = opts.cursor?.blocked ?? 0;
  const blockedByReason: Record<string, number> = {
    ...(opts.cursor?.blockedByReason ?? {}),
  };
  const offerIds = [...(opts.cursor?.offerIds ?? [])];
  let countryFilter = opts.cursor?.countryFilter ?? true;

  const chunkAllowed: AdcomboRawOffer[] = [];
  let chunkPages = 0;
  let exhausted = false;

  for (let i = 0; i < maxPages; i++) {
    const pageResult = await fetchAdcomboPage(apiKey, page, countryFilter);
    countryFilter = pageResult.countryFilter;
    const pageOffers = pageResult.offers;
    const emptyErr = emptyPageBeforeEndError({
      offset: (page - 1) * ADCOMBO_PER_PAGE,
      pageLength: pageOffers.length,
      total: pageResult.total,
    });
    if (emptyErr) throw new Error(`AdCombo feed: ${emptyErr}`);

    chunkPages += 1;
    fetched += pageOffers.length;

    for (const o of pageOffers) {
      const reason = adcomboBlockReason(o);
      if (reason) {
        blockedByReason[reason] = (blockedByReason[reason] ?? 0) + 1;
        blocked += 1;
        continue;
      }
      const { price, currency } = orderPriceForIt(o);
      chunkAllowed.push({
        ...o,
        order_price_it: price ?? undefined,
        order_currency_it: currency,
      });
    }

    if (
      isFeedPageExhausted({
        httpStatus: pageResult.status,
        pageLength: pageOffers.length,
        pageSize: ADCOMBO_PER_PAGE,
        offset: (page - 1) * ADCOMBO_PER_PAGE,
        total: pageResult.total,
      })
    ) {
      exhausted = true;
      break;
    }
    page += 1;
  }

  const syncedAt = new Date().toISOString();
  const rows: AdcomboRow[] = chunkAllowed.map((o) => ({
    offer_id: Number(o.id),
    title: normalizeProductTitle(String(o.name ?? `Offer ${o.id}`)),
    picture_url: o.thumbs?.[0] ?? null,
    category: (o.categories ?? []).join(", ") || null,
    raw: o,
    is_active: true,
    synced_at: syncedAt,
  }));

  if (rows.length > 0) {
    const { error } = await supabaseAdmin
      .from("adcombo_offers")
      .upsert(rows as never, { onConflict: "offer_id" });
    if (error) throw new Error(`upsert adcombo_offers: ${error.message}`);
  }

  for (const id of rows.map((r) => r.offer_id)) {
    if (!offerIds.includes(id)) offerIds.push(id);
  }
  allowedCount += rows.length;

  const done = exhausted;
  let deactivated = 0;
  if (done) {
    const d = await deactivateMissingActiveOffers("adcombo_offers", offerIds);
    deactivated = d.deactivated;
  }

  if (blocked > 0 && done) {
    console.info("AdCombo sync blocked offers:", blockedByReason);
  }

  const stats = {
    fetched,
    allowed: allowedCount,
    upserted: rows.length,
    deactivated,
    blocked,
    blockedByReason,
    chunkPages,
    done,
  };

  if (done) {
    return { done: true, stats };
  }

  return {
    done: false,
    nextCursor: {
      kind: "page",
      // `page` already advanced to the next index after the last successful fetch.
      offset: page,
      offerIds,
      fetched,
      allowed: allowedCount,
      blocked,
      blockedByReason,
      countryFilter,
    },
    stats,
  };
}

export async function syncAdcomboOffers(): Promise<{
  fetched: number;
  allowed: number;
  upserted: number;
  deactivated: number;
  blocked: number;
  blockedByReason: Record<string, number>;
}> {
  let cursor: AdcomboPageCursor | null = null;
  let last = await syncAdcomboOffersChunk({ cursor, maxPages: 50 });
  let upserted = last.stats.upserted;
  while (!last.done) {
    cursor = last.nextCursor ?? null;
    last = await syncAdcomboOffersChunk({ cursor, maxPages: 50 });
    upserted += last.stats.upserted;
  }
  return {
    fetched: last.stats.fetched,
    allowed: last.stats.allowed,
    upserted,
    deactivated: last.stats.deactivated,
    blocked: last.stats.blocked,
    blockedByReason: last.stats.blockedByReason,
  };
}

export async function loadAdcomboOffersAsOffers(): Promise<Offer[]> {
  const baseSelect = "offer_id, title, picture_url, category, raw, synced_at";
  let { data, error } = await supabaseAdmin
    .from("adcombo_offers")
    .select(`${baseSelect}, first_seen_at`)
    .eq("is_active", true);
  if (error && isMissingFirstSeenColumnError(error.message)) {
    console.warn("loadAdcomboOffersAsOffers: first_seen_at missing, using synced_at fallback");
    ({ data, error } = await supabaseAdmin
      .from("adcombo_offers")
      .select(baseSelect)
      .eq("is_active", true));
  }
  if (error) {
    console.error("loadAdcomboOffersAsOffers:", error.message);
    return [];
  }

  return (data as AdcomboDbRow[]).map((row) => {
    const raw = (row.raw ?? {}) as AdcomboRawOffer;
    const cleaned = normalizeProductTitle(row.title);
    const brand = brandFromTitle(cleaned);
    const categorySlug = categorySlugFromOffer(raw, cleaned);
    const content = getCategoryContent(categorySlug);
    return {
      id: row.offer_id,
      source: "adcombo" as const,
      slug: resolveOfferSlug({
        title: cleaned,
        brand,
        offerId: row.offer_id,
        source: "adcombo",
      }),
      title: cleaned,
      brand,
      subtitle: content.subtitleHi(brand),
      categoryKey: row.category ?? categorySlug,
      categoryName: content.nameHi,
      categorySlug,
      image: row.picture_url || "",
      priceEUR: priceEurFromIt(raw),
      landingUrl: null,
      publishedAt: row.synced_at,
      firstSeenAt: resolveFirstSeenAt(row),
    };
  });
}

export async function getAdcomboRawOffer(
  offerId: number,
): Promise<AdcomboRawOffer | null> {
  const { data, error } = await supabaseAdmin
    .from("adcombo_offers")
    .select("raw")
    .eq("offer_id", offerId)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { raw: AdcomboRawOffer }).raw ?? null;
}

export type AdcomboLeadInput = {
  offerId: number;
  name: string;
  phone: string;
  ip: string;
  userAgent: string;
  referer?: string;
  baseUrl?: string;
};

export async function submitAdcomboLead(
  input: AdcomboLeadInput,
): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  const t = LEAD_ERRORS_CS;

  const apiKey = process.env.ADCOMBO_API_KEY;
  if (!apiKey) return { ok: false, error: t.notConfigured };

  const raw = await getAdcomboRawOffer(input.offerId);
  if (!raw) return { ok: false, error: t.noOffer };

  const { price: computed } = orderPriceForIt(raw);
  const price = computed ?? raw.order_price_it ?? null;
  if (price == null) return { ok: false, error: t.noOffer };

  const params = new URLSearchParams({
    api_key: apiKey,
    name: input.name,
    phone: input.phone,
    offer_id: String(input.offerId),
    country_code: MARKET_GEO,
    price: String(price),
    ip: input.ip || "0.0.0.0",
    base_url: input.baseUrl ?? `${SITE.url}/`,
    referrer: input.referer ?? `${SITE.url}/`,
    ext_in_id: `${input.offerId}-${Date.now()}`,
  });

  try {
    const res = await fetch(`${ORDER_URL}?${params.toString()}`, {
      headers: { Accept: "application/json", "User-Agent": input.userAgent || "Mozilla/5.0" },
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    let obj: {
      code?: string;
      msg?: string;
      error?: string;
      order_id?: number | string;
      is_double?: boolean;
    } = {};
    try {
      obj = JSON.parse(text);
    } catch {
      return { ok: false, error: t.badResponse };
    }
    if (obj.code !== "ok") {
      return { ok: false, error: String(obj.error ?? t.rejected) };
    }
    if (obj.is_double) {
      return { ok: false, error: t.duplicate };
    }
    return { ok: true, leadId: String(obj.order_id ?? "ok") };
  } catch (err) {
    console.error("AdCombo lead submit failed:", err);
    return { ok: false, error: t.networkError };
  }
}
