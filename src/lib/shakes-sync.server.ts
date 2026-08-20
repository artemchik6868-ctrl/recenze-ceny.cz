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
import { phoneNationalCS } from "./phone.cs";
import { fetchFeed } from "./feed-sync-http";
import { deactivateMissingActiveOffers } from "./feed-sync-deactivate.server";

const OFFERS_URL = "https://shakes.pro/index.php?r=offer/offers/json";
const ORDER_URL = "https://shakes.pro/index.php";

const CATEGORY_BLACKLIST_RE =
  /(betting|gambling|casino|dating|insurance|finance|loan|sweepstake|survey|software|subscription)/i;
const TEXT_BLACKLIST_RE =
  /(casino|bet\b|betting|slot|poker|crypto|forex|trading|binary|dating|gambl)/i;

export type ShakesGoal = {
  geo?: string;
  type?: string;
  cost?: string | number;
  currency?: string;
  landing_price?: string | number;
  landing_currency?: string;
};

export type ShakesLanding = {
  type?: string;
  url?: string;
  title?: string;
};

export type ShakesRawOffer = {
  id: number;
  title?: string;
  hold?: number;
  postclick?: number;
  goals?: ShakesGoal[];
  landings?: ShakesLanding[];
  image?: string;
  landing_price?: string | number;
  traffic_types?: Record<string, { name?: string; allowed?: boolean }>;
  /** Stored at sync: canonical landing URL for order API. */
  landing_url_it?: string;
};

type ShakesRow = {
  offer_id: number;
  title: string;
  picture_url: string | null;
  category: string | null;
  raw: ShakesRawOffer;
  is_active: boolean;
  synced_at: string;
};

type ShakesDbRow = ShakesRow & {
  first_seen_at?: string | null;
};

function hasEsGoal(o: ShakesRawOffer): boolean {
  return (o.goals ?? []).some((g) => String(g.geo ?? "").toUpperCase() === MARKET_GEO);
}

export function pickLandingUrl(o: ShakesRawOffer): string | null {
  const landings = o.landings ?? [];
  if (!landings.length) return null;
  const url = landings[0]?.url;
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/+/, "")}`;
}

export function pictureUrlFromOffer(o: ShakesRawOffer): string | null {
  const img = o.image;
  if (!img || !String(img).trim()) return null;
  if (/^https?:\/\//i.test(img)) return img;
  return `https://shakes.pro${img.startsWith("/") ? img : `/${img}`}`;
}

function isEsMarketOffer(o: ShakesRawOffer): boolean {
  if (!hasEsGoal(o)) return false;
  const title = String(o.title ?? "");
  if (/\[RU EUR\]/i.test(title)) return false;
  if (/\bfree\b/i.test(title) && Number(o.landing_price) === 0) return false;
  if (!pickLandingUrl(o)) return false;
  return true;
}

export function shakesBlockReason(o: ShakesRawOffer): string | null {
  if (!isEsMarketOffer(o)) {
    if (!hasEsGoal(o)) return "geo:no_cz";
    if (/\[RU EUR\]/i.test(String(o.title ?? ""))) return "title:ru_eur";
    if (/\bfree\b/i.test(String(o.title ?? "")) && Number(o.landing_price) === 0) {
      return "title:free_zero_price";
    }
    if (!pickLandingUrl(o)) return "landing:missing";
    return "geo:no_cz";
  }
  const title = String(o.title ?? "");
  const text = `${title} ${JSON.stringify(o.traffic_types ?? "")}`;
  const catMatch = text.match(CATEGORY_BLACKLIST_RE);
  if (catMatch) return `category:${catMatch[1]!.toLowerCase()}`;
  const textMatch = text.match(TEXT_BLACKLIST_RE);
  if (textMatch) return `text:${textMatch[1]!.toLowerCase()}`;
  return null;
}

function isAllowed(o: ShakesRawOffer): boolean {
  return shakesBlockReason(o) === null;
}

function priceEurFromOffer(o: ShakesRawOffer): number | null {
  // Storefront price chain (see CZ-INFRA-SETUP.md § Shakes pricing):
  // 1) goals[geo=BG].landing_price (raw EUR from feed, rounded)
  // 2) fallback: raw.landing_price (EUR, rounded)
  // NOT used: goals[].cost (webmaster commission only)
  const plGoal = (o.goals ?? []).find((g) => String(g.geo ?? "").toUpperCase() === MARKET_GEO);
  const goalLanding =
    plGoal?.landing_price != null ? Number(plGoal.landing_price) : NaN;
  if (Number.isFinite(goalLanding) && goalLanding > 0) {
    return Math.round(goalLanding);
  }
  const raw = Number(o.landing_price);
  if (Number.isFinite(raw) && raw > 0) return Math.round(raw);
  return null;
}

function brandFromTitle(title: string): string {
  return cleanBrandName(title);
}

function categorySlugFromOffer(
  o: ShakesRawOffer,
  cleanedTitle: string,
  categoryField?: string | null,
): string {
  const blob = buildPartnerClassifyBlob("shakes", o, cleanedTitle, categoryField);
  const titleFirst = classifyTitleFirst(cleanedTitle, blob, "other");
  return titleFirst !== "other"
    ? titleFirst
    : classifyByText(`${cleanedTitle} ${blob}`, "other");
}

function normalizeOffersPayload(json: unknown): ShakesRawOffer[] {
  if (Array.isArray(json)) return json as ShakesRawOffer[];
  if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.offers)) return obj.offers as ShakesRawOffer[];
    return Object.values(obj).filter(
      (v): v is ShakesRawOffer =>
        !!v && typeof v === "object" && "id" in (v as object),
    );
  }
  return [];
}

async function fetchAllOffers(): Promise<ShakesRawOffer[]> {
  const apiKey = process.env.SHAKES_API_KEY;
  const url = new URL(OFFERS_URL);
  if (apiKey) url.searchParams.set("key", apiKey);
  const res = await fetchFeed(url.toString());
  if (!res.ok) throw new Error(`Shakes offers HTTP ${res.status}`);
  const json = await res.json();
  return normalizeOffersPayload(json);
}

export async function syncShakesOffers(): Promise<{
  fetched: number;
  allowed: number;
  upserted: number;
  deactivated: number;
  blocked: number;
  blockedByReason: Record<string, number>;
}> {
  const all = await fetchAllOffers();
  const blockedByReason: Record<string, number> = {};
  for (const o of all) {
    const reason = shakesBlockReason(o);
    if (reason) blockedByReason[reason] = (blockedByReason[reason] ?? 0) + 1;
  }
  const blocked = Object.values(blockedByReason).reduce((a, b) => a + b, 0);
  if (blocked > 0) {
    console.info("Shakes sync blocked offers:", blockedByReason);
  }

  const allowed = all.filter(isAllowed).map((o) => ({
    ...o,
    landing_url_it: pickLandingUrl(o) ?? undefined,
  }));

  const syncedAt = new Date().toISOString();
  const rows: ShakesRow[] = allowed.map((o) => ({
    offer_id: Number(o.id),
    title: normalizeProductTitle(String(o.title ?? `Offer ${o.id}`)),
    picture_url: pictureUrlFromOffer(o),
    category: null,
    raw: o,
    is_active: true,
    synced_at: syncedAt,
  }));

  if (rows.length > 0) {
    const { error } = await supabaseAdmin
      .from("shakes_offers")
      .upsert(rows as never, { onConflict: "offer_id" });
    if (error) throw new Error(`upsert shakes_offers: ${error.message}`);
  }

  const ids = rows.map((r) => r.offer_id);
  const { deactivated } = await deactivateMissingActiveOffers("shakes_offers", ids);

  return {
    fetched: all.length,
    allowed: allowed.length,
    upserted: rows.length,
    deactivated,
    blocked,
    blockedByReason,
  };
}

export async function loadShakesOffersAsOffers(): Promise<Offer[]> {
  const baseSelect = "offer_id, title, picture_url, category, raw, synced_at";
  let { data, error } = await supabaseAdmin
    .from("shakes_offers")
    .select(`${baseSelect}, first_seen_at`)
    .eq("is_active", true);
  if (error && isMissingFirstSeenColumnError(error.message)) {
    console.warn("loadShakesOffersAsOffers: first_seen_at missing, using synced_at fallback");
    ({ data, error } = await supabaseAdmin
      .from("shakes_offers")
      .select(baseSelect)
      .eq("is_active", true));
  }
  if (error) {
    console.error("loadShakesOffersAsOffers:", error.message);
    return [];
  }

  return (data as ShakesDbRow[]).map((row) => {
    const raw = (row.raw ?? {}) as ShakesRawOffer;
    const cleaned = normalizeProductTitle(row.title);
    const brand = brandFromTitle(cleaned);
    const categorySlug = categorySlugFromOffer(raw, cleaned, row.category);
    const feedClassifyText = buildPartnerClassifyBlob("shakes", raw, cleaned, row.category);
    const content = getCategoryContent(categorySlug);
    return {
      id: row.offer_id,
      source: "shakes" as const,
      slug: resolveOfferSlug({
        title: cleaned,
        brand,
        offerId: row.offer_id,
        source: "shakes",
      }),
      title: cleaned,
      brand,
      subtitle: content.subtitleHi(brand),
      categoryKey: row.category ?? categorySlug,
      categoryName: content.nameHi,
      categorySlug,
      image: row.picture_url || "",
      priceEUR: priceEurFromOffer(raw),
      landingUrl: raw.landing_url_it ?? pickLandingUrl(raw),
      publishedAt: row.synced_at,
      firstSeenAt: resolveFirstSeenAt(row),
      feedClassifyText: feedClassifyText || undefined,
    };
  });
}

export async function getShakesRawOffer(offerId: number): Promise<ShakesRawOffer | null> {
  const { data, error } = await supabaseAdmin
    .from("shakes_offers")
    .select("raw")
    .eq("offer_id", offerId)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { raw: ShakesRawOffer }).raw ?? null;
}

export type ShakesLeadInput = {
  offerId: number;
  name: string;
  phone: string;
  ip: string;
  userAgent: string;
  referer?: string;
};

export async function submitShakesLead(
  input: ShakesLeadInput,
): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  const t = LEAD_ERRORS_CS;

  const apiKey = process.env.SHAKES_API_KEY;
  const streamCode = process.env.SHAKES_STREAM_CODE;
  if (!apiKey || !streamCode) return { ok: false, error: t.notConfigured };

  const raw = await getShakesRawOffer(input.offerId);
  if (!raw) return { ok: false, error: t.noOffer };

  const landingUrl = raw.landing_url_it ?? pickLandingUrl(raw);
  if (!landingUrl) return { ok: false, error: t.noOffer };

  const phoneDigits = phoneNationalCS(input.phone);
  const orderUrl = `${ORDER_URL}?r=/api/order/in&key=${encodeURIComponent(apiKey)}`;
  const body = new URLSearchParams({
    createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    offerId: String(input.offerId),
    landingUrl,
    streamCode,
    name: input.name,
    phone: phoneDigits,
    countryCode: MARKET_GEO,
    ip: input.ip || "0.0.0.0",
    referrer: input.referer ?? `${SITE.url}/`,
    userAgent: input.userAgent || "Mozilla/5.0",
    sub1: `recenze-ceny-${input.offerId}`,
  });

  try {
    const res = await fetch(orderUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "User-Agent": input.userAgent || "Mozilla/5.0",
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    let obj: { status?: string; error?: string; msg?: string; orderId?: string | number } = {};
    try {
      obj = JSON.parse(text);
    } catch {
      return { ok: false, error: t.badResponse };
    }
    if (obj.status !== "ok") {
      return { ok: false, error: String(obj.error ?? obj.msg ?? t.rejected) };
    }
    return { ok: true, leadId: String(obj.orderId ?? "ok") };
  } catch (err) {
    console.error("Shakes lead submit failed:", err);
    return { ok: false, error: t.networkError };
  }
}
