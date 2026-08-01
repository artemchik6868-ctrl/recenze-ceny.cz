import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resolveFirstSeenAt, isMissingFirstSeenColumnError } from "./offer-first-seen.server";
import { getCategoryContent } from "./content.cs";
import { MARKET_GEO } from "./market";
import { LEAD_ERRORS_CS } from "./lead-errors.cs";
import { classifyByText, classifyTitleFirst } from "./classify";
import { resolveOfferSlug } from "./slugify";
import { normalizeProductTitle, cleanBrandName } from "./brand-clean";
import { SITE } from "./site";
import type { Offer } from "./types";
import { isExplicitCpsOffer, terraleadsApiPost, terraleadsApiKey } from "./terraleads-api.server";
import { phoneNationalCS } from "./phone.cs";

const CATEGORY_BLACKLIST_RE =
  /(betting|gambling|casino|dating|insurance|finance|loan|sweepstake|survey|software|subscription)/i;
const TEXT_BLACKLIST_RE =
  /(casino|bet\b|betting|slot|poker|crypto|forex|trading|binary|dating|gambl)/i;

export type TerraleadsLanding = {
  name?: string;
  link?: string;
};

export type TerraleadsNestedOffer = {
  offer_id?: string | number;
  status?: string;
  country_code?: string;
  country_name?: string;
  landing_price?: string | number;
  landing_delivery_price?: string | number;
  landing_currency?: string;
  payout?: string | number;
  payout_currency?: string;
  landings?: TerraleadsLanding[];
  [key: string]: unknown;
};

export type TerraleadsProduct = {
  product_id?: string | number;
  product_name?: string;
  product_description?: string;
  product_image?: string;
  product_category?: string;
  offers?: TerraleadsNestedOffer[];
};

export type TerraleadsRawOffer = TerraleadsNestedOffer & {
  product_id?: string | number;
  product_name?: string;
  product_description?: string;
  product_image?: string;
  product_category?: string;
};

type TerraleadsRow = {
  offer_id: number;
  title: string;
  picture_url: string | null;
  category: string | null;
  raw: TerraleadsRawOffer;
  is_active: boolean;
  synced_at: string;
};

type TerraleadsDbRow = TerraleadsRow & {
  first_seen_at?: string | null;
};

function flattenProducts(products: TerraleadsProduct[]): TerraleadsRawOffer[] {
  const out: TerraleadsRawOffer[] = [];
  for (const p of products) {
    for (const o of p.offers ?? []) {
      out.push({
        ...o,
        product_id: p.product_id,
        product_name: p.product_name,
        product_description: p.product_description,
        product_image: p.product_image,
        product_category: p.product_category,
      });
    }
  }
  return out;
}

export function pickLandingUrl(o: TerraleadsRawOffer): string | null {
  const landings = o.landings ?? [];
  const link = landings[0]?.link;
  if (!link || !String(link).trim()) return null;
  const url = String(link).trim();
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/+/, "")}`;
}

function priceEurFromOffer(o: TerraleadsRawOffer): number | null {
  const raw = Number(o.landing_price);
  if (Number.isFinite(raw) && raw > 0) return Math.round(raw);
  const cur = String(o.landing_currency ?? "EUR").toUpperCase();
  if (cur === "EUR" || cur === "IT") return null;
  return null;
}

export function terraleadsBlockReason(o: TerraleadsRawOffer): string | null {
  if (String(o.country_code ?? "").toUpperCase() !== MARKET_GEO) return "geo:no_cz";
  if (String(o.status ?? "").toLowerCase() !== "active") return "status:disabled";
  if (isExplicitCpsOffer(o as Record<string, unknown>)) return "type:cps";
  const title = String(o.product_name ?? "");
  const category = String(o.product_category ?? "");
  const text = `${title} ${category}`;
  const catMatch = text.match(CATEGORY_BLACKLIST_RE);
  if (catMatch) return `category:${catMatch[1]!.toLowerCase()}`;
  const textMatch = text.match(TEXT_BLACKLIST_RE);
  if (textMatch) return `text:${textMatch[1]!.toLowerCase()}`;
  return null;
}

function isAllowed(o: TerraleadsRawOffer): boolean {
  return terraleadsBlockReason(o) === null;
}

function brandFromTitle(title: string): string {
  return cleanBrandName(title);
}

function categorySlugFromOffer(o: TerraleadsRawOffer, cleanedTitle: string): string {
  const feedCategory = String(o.product_category ?? "");
  const titleFirst = classifyTitleFirst(cleanedTitle, feedCategory, "other");
  return titleFirst !== "other"
    ? titleFirst
    : classifyByText(`${cleanedTitle} ${feedCategory}`, "other");
}

async function fetchAllOffers(): Promise<TerraleadsRawOffer[]> {
  const res = await terraleadsApiPost<[]>("offer", "list", []);
  const products = (res.data ?? []) as TerraleadsProduct[];
  return flattenProducts(Array.isArray(products) ? products : []);
}

export async function syncTerraleadsOffers(): Promise<{
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
    const reason = terraleadsBlockReason(o);
    if (reason) blockedByReason[reason] = (blockedByReason[reason] ?? 0) + 1;
  }
  const blocked = Object.values(blockedByReason).reduce((a, b) => a + b, 0);
  if (blocked > 0) {
    console.info("TerraLeads sync blocked offers:", blockedByReason);
  }

  const allowed = all.filter(isAllowed);
  const syncedAt = new Date().toISOString();
  const rows: TerraleadsRow[] = allowed.map((o) => {
    const offerId = Number(o.offer_id);
    const title = normalizeProductTitle(String(o.product_name ?? `Offer ${offerId}`));
    return {
      offer_id: offerId,
      title,
      picture_url: o.product_image ? String(o.product_image) : null,
      category: o.product_category ? String(o.product_category) : null,
      raw: o,
      is_active: true,
      synced_at: syncedAt,
    };
  });

  if (rows.length > 0) {
    const { error } = await supabaseAdmin
      .from("terraleads_offers")
      .upsert(rows as never, { onConflict: "offer_id" });
    if (error) throw new Error(`upsert terraleads_offers: ${error.message}`);
  }

  const ids = rows.map((r) => r.offer_id);
  let deactivated = 0;
  if (ids.length > 0) {
    const { count, error } = await supabaseAdmin
      .from("terraleads_offers")
      .update({ is_active: false }, { count: "exact" })
      .not("offer_id", "in", `(${ids.join(",")})`)
      .eq("is_active", true);
    if (error) throw new Error(`deactivate terraleads_offers: ${error.message}`);
    deactivated = count ?? 0;
  }

  return {
    fetched: all.length,
    allowed: allowed.length,
    upserted: rows.length,
    deactivated,
    blocked,
    blockedByReason,
  };
}

export async function loadTerraleadsOffersAsOffers(): Promise<Offer[]> {
  const baseSelect = "offer_id, title, picture_url, category, raw, synced_at";
  let { data, error } = await supabaseAdmin
    .from("terraleads_offers")
    .select(`${baseSelect}, first_seen_at`)
    .eq("is_active", true);
  if (error && isMissingFirstSeenColumnError(error.message)) {
    console.warn("loadTerraleadsOffersAsOffers: first_seen_at missing, using synced_at fallback");
    ({ data, error } = await supabaseAdmin
      .from("terraleads_offers")
      .select(baseSelect)
      .eq("is_active", true));
  }
  if (error) {
    console.error("loadTerraleadsOffersAsOffers:", error.message);
    return [];
  }

  return (data as TerraleadsDbRow[]).map((row) => {
    const raw = (row.raw ?? {}) as TerraleadsRawOffer;
    const cleaned = normalizeProductTitle(row.title);
    const brand = brandFromTitle(cleaned);
    const categorySlug = categorySlugFromOffer(raw, cleaned);
    const content = getCategoryContent(categorySlug);
    return {
      id: row.offer_id,
      source: "terraleads" as const,
      slug: resolveOfferSlug({
        title: cleaned,
        brand,
        offerId: row.offer_id,
        source: "terraleads",
      }),
      title: cleaned,
      brand,
      subtitle: content.subtitleHi(brand),
      categoryKey: row.category ?? categorySlug,
      categoryName: content.nameHi,
      categorySlug,
      image: row.picture_url || "",
      priceEUR: priceEurFromOffer(raw),
      landingUrl: pickLandingUrl(raw),
      publishedAt: row.synced_at,
      firstSeenAt: resolveFirstSeenAt(row),
    };
  });
}

export async function getTerraleadsRawOffer(
  offerId: number,
): Promise<TerraleadsRawOffer | null> {
  const { data, error } = await supabaseAdmin
    .from("terraleads_offers")
    .select("raw")
    .eq("offer_id", offerId)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { raw: TerraleadsRawOffer }).raw ?? null;
}

export type TerraleadsLeadInput = {
  offerId: number;
  name: string;
  phone: string;
  ip: string;
  userAgent: string;
  referer?: string;
};

export async function submitTerraleadsLead(
  input: TerraleadsLeadInput,
): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  const t = LEAD_ERRORS_CS;

  try {
    terraleadsApiKey();
  } catch {
    return { ok: false, error: t.notConfigured };
  }

  const raw = await getTerraleadsRawOffer(input.offerId);
  if (!raw) return { ok: false, error: t.noOffer };

  const phoneDigits = phoneNationalCS(input.phone);
  const streamId = process.env.TERRALEADS_STREAM_ID;

  try {
    const payload: Record<string, unknown> = {
      name: input.name,
      country: MARKET_GEO,
      phone: phoneDigits,
      offer_id: input.offerId,
      user_agent: input.userAgent || "Mozilla/5.0",
      referer: input.referer ?? `${SITE.url}/`,
      sub1: `recenze-ceny-${input.offerId}`,
    };
    if (streamId) payload.stream_id = Number(streamId);

    const res = await terraleadsApiPost<Record<string, unknown>>("lead", "create", payload);
    const data = res.data as { id?: string; status?: string } | null;
    if (!data?.id) return { ok: false, error: t.badResponse };
    return { ok: true, leadId: String(data.id) };
  } catch (err) {
    console.error("TerraLeads lead submit failed:", err);
    const msg = err instanceof Error ? err.message : t.networkError;
    return { ok: false, error: msg.includes("TerraLeads") ? t.rejected : t.networkError };
  }
}
