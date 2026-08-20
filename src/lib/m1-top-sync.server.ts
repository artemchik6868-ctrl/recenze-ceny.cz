import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resolveFirstSeenAt, isMissingFirstSeenColumnError } from "./offer-first-seen.server";
import { getCategoryContent } from "./content.cs";
import { LEAD_ERRORS_CS } from "./lead-errors.cs";
import { MARKET_GEO } from "./market";
import { classifyByText, classifyTitleFirst } from "./classify";
import { buildPartnerClassifyBlob } from "./partner-feed-text";
import { resolveOfferSlug } from "./slugify";
import { cleanBrandName } from "./brand-clean";
import type { Offer } from "./types";
import { fetchFeed } from "./feed-sync-http";
import { deactivateMissingActiveOffers } from "./feed-sync-deactivate.server";

const FEED_URL = "https://m1.top/offers_export_api/";

export type M1Target = {
  code: string;
  currency: string;
  price: string;
  price_high?: string;
  pay: string;
  pay_currency?: string;
  geo_name?: string;
  callm1?: string;
};

export type M1RawOffer = {
  id: string | number;
  name: string;
  product_id: string | number;
  info?: string;
  top?: number;
  target: M1Target[];
  img?: string;
  cr?: number;
  epc?: number;
  /** Partner landing URLs (often promo hosts with /page/<hash>/). */
  tracking_link?: string[] | null;
  user_access?: number;
};

function categoryFromName(name: string): { key: string; slug: string } {
  const slug = classifyByText(name, "other");
  return { key: slug, slug };
}

function brandFromName(name: string): string {
  return cleanBrandName(name);
}


type M1Row = {
  offer_id: number;
  name: string;
  picture_url: string | null;
  category: string | null;
  price_uah: number | null;
  pay_uah: number | null;
  raw: M1RawOffer;
  is_active: boolean;
  synced_at: string;
};

/**
 * m1.top may answer 307 + ipp_* cookies (anti-bot). Follow redirects with a cookie jar.
 */
export async function fetchM1FeedJson(): Promise<M1RawOffer[]> {
  const apiKey = process.env.M1_TOP_API_KEY;
  const webmasterId = process.env.M1_TOP_WEBMASTER_ID;
  if (!apiKey || !webmasterId) {
    throw new Error("M1_TOP_API_KEY or M1_TOP_WEBMASTER_ID not configured");
  }

  let url = `${FEED_URL}?webmaster_id=${encodeURIComponent(webmasterId)}&api_key=${encodeURIComponent(apiKey)}`;
  const cookieJar = new Map<string, string>();
  const cookieHeader = () =>
    [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");

  for (let hop = 0; hop < 8; hop++) {
    const res = await fetchFeed(url, {
      redirect: "manual",
      headers: {
        Accept: "application/json",
        ...(cookieJar.size ? { Cookie: cookieHeader() } : {}),
      },
    });
    const rawCookie = res.headers.getSetCookie?.() ?? [];
    const single = res.headers.get("set-cookie");
    const parts = rawCookie.length ? rawCookie : single ? [single] : [];
    for (const c of parts) {
      const pair = c.split(";")[0]?.trim();
      if (!pair || !pair.includes("=")) continue;
      const eq = pair.indexOf("=");
      cookieJar.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error(`m1.top redirect without location (${res.status})`);
      url = new URL(loc, url).toString();
      continue;
    }
    if (!res.ok) throw new Error(`m1.top feed HTTP ${res.status}`);
    return (await res.json()) as M1RawOffer[];
  }
  throw new Error("m1.top feed: too many redirects");
}

export async function syncM1TopOffers(): Promise<{
  fetched: number;
  ua: number;
  upserted: number;
  deactivated: number;
}> {
  const all = await fetchM1FeedJson();

  const ua = (all || []).filter((o) =>
    (o.target || []).some((t) => t.code === MARKET_GEO),
  );

  const rows: M1Row[] = ua.map((o) => {
    const inT = o.target.find((t) => t.code === MARKET_GEO)!;
    const price = Number(inT.price);
    const pay = Number(inT.pay);
    const { slug } = categoryFromName(o.name);
    return {
      offer_id: Number(o.id),
      name: String(o.name || `Offer ${o.id}`),
      picture_url: (o.img ?? "").replace("/offer_img100x100/", "/offer_img300x300/") || null,
      category: slug,
      price_uah: Number.isFinite(price) ? price : null,
      pay_uah: Number.isFinite(pay) ? pay : null,
      raw: o,
      is_active: true,
      synced_at: new Date().toISOString(),
    };
  });

  if (rows.length > 0) {
    const { error } = await supabaseAdmin
      .from("m1_offers")
      .upsert(rows as never, { onConflict: "offer_id" });
    if (error) throw new Error(`upsert m1_offers: ${error.message}`);
  }

  const ids = rows.map((r) => r.offer_id);
  const { deactivated } = await deactivateMissingActiveOffers("m1_offers", ids);

  return {
    fetched: all.length,
    ua: ua.length,
    upserted: rows.length,
    deactivated,
  };
}

type M1OfferDbRow = {
  offer_id: number;
  name: string;
  picture_url: string | null;
  category: string | null;
  price_uah: number | null;
  raw: unknown;
  synced_at: string;
  first_seen_at?: string | null;
};

export async function loadM1TopOffersAsOffers(): Promise<Offer[]> {
  const baseSelect =
    "offer_id, name, picture_url, category, price_uah, raw, synced_at";
  let { data, error } = await supabaseAdmin
    .from("m1_offers")
    .select(`${baseSelect}, first_seen_at`)
    .eq("is_active", true);
  if (error && isMissingFirstSeenColumnError(error.message)) {
    console.warn("loadM1TopOffersAsOffers: first_seen_at missing, using synced_at fallback");
    ({ data, error } = await supabaseAdmin
      .from("m1_offers")
      .select(baseSelect)
      .eq("is_active", true));
  }
  if (error) {
    console.error("loadM1TopOffersAsOffers:", error.message);
    return [];
  }
  return (data as M1OfferDbRow[]).map((row) => {
    const brand = brandFromName(row.name);
    const blob = buildPartnerClassifyBlob("m1_top", row.raw, row.name, row.category);
    const titleFirst = classifyTitleFirst(row.name, blob, "other");
    const slug =
      titleFirst !== "other"
        ? titleFirst
        : row.category && row.category !== "other"
          ? row.category
          : classifyByText(row.name, "other");
    const key = row.category || slug;
    const content = getCategoryContent(slug);
    return {
      id: row.offer_id,
      source: "m1_top" as const,
      slug: resolveOfferSlug({
        title: row.name,
        brand,
        offerId: row.offer_id,
        source: "m1_top",
      }),
      title: brand,
      brand,
      subtitle: content.subtitleHi(brand),
      categoryKey: key,
      categoryName: content.nameHi,
      categorySlug: slug,
      image: row.picture_url || "",
      priceEUR: row.price_uah != null ? Math.round(row.price_uah) : null,
      landingUrl: null,
      publishedAt: row.synced_at,
      firstSeenAt: resolveFirstSeenAt(row),
    };
  });
}

export async function getM1TopRawOffer(
  offerId: number,
): Promise<M1RawOffer | null> {
  const { data, error } = await supabaseAdmin
    .from("m1_offers")
    .select("raw")
    .eq("offer_id", offerId)
    .maybeSingle();
  if (error || !data) return null;
  return (data.raw as M1RawOffer) ?? null;
}

export type M1LeadInput = {
  offerId: number;
  name: string;
  phone: string;
  ip: string;
  userAgent: string;
  referer: string;
  lang?: "it";
};

export async function submitM1TopLead(
  input: M1LeadInput,
): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  const t = LEAD_ERRORS_CS;
  const apiKey = process.env.M1_TOP_API_KEY;
  const webmasterId = process.env.M1_TOP_WEBMASTER_ID;
  if (!apiKey || !webmasterId) return { ok: false, error: t.notConfigured };

  // m1.top expects the product_id from the offer card, not the offer id.
  const raw = await getM1TopRawOffer(input.offerId);
  const productId = raw?.product_id ?? input.offerId;

  const body = new URLSearchParams({
    ref: webmasterId,
    api_key: apiKey,
    product_id: String(productId),
    name: input.name,
    phone: input.phone,
    ip: input.ip,
    langCode: MARKET_GEO,
    referer: input.referer,
  });

  try {
    const res = await fetch("https://m1.top/send_order/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": input.userAgent || "Mozilla/5.0",
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    let obj: { result?: string; id?: number | string; message?: string } = {};
    try {
      obj = JSON.parse(text);
    } catch {
      return { ok: false, error: t.badResponse };
    }
    if (obj.result === "ok" && obj.id) return { ok: true, leadId: String(obj.id) };
    if (obj.result === "visit_ok") return { ok: false, error: t.paramsIncomplete };
    return { ok: false, error: obj.message || `m1.top error: ${obj.result || "?"}` };
  } catch (err) {
    console.error("m1.top lead submit failed:", err);
    return { ok: false, error: t.networkError };
  }
}

