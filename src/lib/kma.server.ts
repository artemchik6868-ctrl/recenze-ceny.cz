import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resolveFirstSeenAt, isMissingFirstSeenColumnError } from "./offer-first-seen.server";
import { getCategoryContent } from "./content.cs";
import { MARKET_GEO } from "./market";
import { classifyByText, classifyTitleFirst } from "./classify";
import { resolveOfferSlug } from "./slugify";
import { cleanBrandName } from "./brand-clean";
import type { Offer } from "./types";


const KMA_BASE = "https://api.kma.biz";

// Map KMA Russian category names → our internal slug keys.
const KMA_CATEGORY_SLUG_MAP: Record<string, string> = {
  Диабет: "cukrovka",
  Гипертония: "krevni-tlak",
  Суставы: "klouby",
  Потенция: "potence",
  "Потенция+увеличение": "potence",
  "Увеличение члена": "zvetseni-penisu",
  "Увеличение груди": "zvetseni-prsou",
  Похудение: "hubnuti",
  Простатит: "prostata",
  Зрение: "zrak",
  Геморрой: "hemoroidy",
  Омоложение: "anti-aging",
  ЖКТ: "traveni",
  "Паразиты, папилломы": "paraziti",
  Паразиты: "paraziti",
  Папилломы: "papilomy",
  Цистит: "cystitida",
  Грибок: "plisen-nehtu",
  Варикоз: "krecove-zily",
  Псориаз: "lupenka",
  Алкоголь: "alkoholismus",
  Курение: "odvykani-koureni",
  Слух: "sluch",
  Вальгус: "vboceny-palec",
  "Уход за волосами": "vypadavani-vlasu",
  Агро: "zahrada",
  Дача: "zahrada",
};

function brandFromTitle(title: string): string {
  return cleanBrandName(title);
}


function parsePriceEUR(itemprice: unknown): number | null {
  if (!itemprice || typeof itemprice !== "object") return null;
  const raw = (itemprice as Record<string, string>)[MARKET_GEO];
  if (!raw) return null;
  const m = String(raw).match(/(\d+(?:\.\d+)?)/);
  return m ? Math.round(Number(m[1])) : null;
}

function primaryCategoryName(category: unknown): string {
  if (category && typeof category === "object" && !Array.isArray(category)) {
    const values = Object.values(category as Record<string, string>);
    if (values.length > 0) return String(values[0]);
  }
  return "Другое";
}

export type KmaRawOffer = {
  id: number;
  name: string;
  logo?: string;
  codes?: string[];
  itemprice?: Record<string, string>;
  comission?: Record<string, string>;
  category?: Record<string, string>;
  [k: string]: unknown;
};

type GetOffersResponse = {
  code: number;
  msg?: string;
  offers?: KmaRawOffer[];
};

/** Fetch all Ukraine-targeted offers from KMA and upsert into kma_offers. */
export async function syncKmaOffers(): Promise<{
  fetched: number;
  ua: number;
  upserted: number;
  deactivated: number;
}> {
  const token = process.env.KMA_API_KEY;
  if (!token) throw new Error("KMA_API_KEY not configured");

  const url = `${KMA_BASE}/?method=getoffers&token=${encodeURIComponent(token)}&return_type=json`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`KMA getoffers HTTP ${res.status}`);
  const json = (await res.json()) as GetOffersResponse;
  if (json.code !== 0) throw new Error(`KMA error: ${json.msg || json.code}`);

  const all = json.offers || [];
  const ua = all.filter((o) => Array.isArray(o.codes) && o.codes.includes(MARKET_GEO));

  const rows = ua.map((o) => ({
    offer_id: Number(o.id),
    name: String(o.name || `Offer ${o.id}`),
    logo: o.logo ?? null,
    category: primaryCategoryName(o.category),
    itemprice_rub: null,
    commission_uah: (() => {
      const c = o.comission?.[MARKET_GEO];
      if (!c) return null;
      const m = String(c).match(/(\d+(?:\.\d+)?)/);
      return m ? Number(m[1]) : null;
    })(),
    raw: o as unknown as Record<string, unknown>,
    is_active: true,
    synced_at: new Date().toISOString(),
  }));

  // Upsert in one call (small dataset, < 50 rows)
  if (rows.length > 0) {
    const { error } = await supabaseAdmin
      .from("kma_offers")
      .upsert(rows as never, { onConflict: "offer_id" });
    if (error) throw new Error(`upsert kma_offers: ${error.message}`);
  }

  const ids = rows.map((r) => r.offer_id);
  let deactivated = 0;
  if (ids.length > 0) {
    const { count, error } = await supabaseAdmin
      .from("kma_offers")
      .update({ is_active: false }, { count: "exact" })
      .not("offer_id", "in", `(${ids.join(",")})`)
      .eq("is_active", true);
    if (error) throw new Error(`deactivate kma_offers: ${error.message}`);
    deactivated = count ?? 0;
  }

  return {
    fetched: all.length,
    ua: ua.length,
    upserted: rows.length,
    deactivated,
  };
}

type KmaOfferRow = {
  offer_id: number;
  name: string;
  logo: string | null;
  category: string | null;
  commission_uah: number | null;
  raw: unknown;
  synced_at: string;
  first_seen_at?: string | null;
};

/** Load active KMA offers from DB and map to unified Offer shape. */
export async function loadKmaOffersAsOffers(): Promise<Offer[]> {
  const baseSelect = "offer_id, name, logo, category, commission_uah, raw, synced_at";
  let { data, error } = await supabaseAdmin
    .from("kma_offers")
    .select(`${baseSelect}, first_seen_at`)
    .eq("is_active", true);
  if (error && isMissingFirstSeenColumnError(error.message)) {
    console.warn("loadKmaOffersAsOffers: first_seen_at missing, using synced_at fallback");
    ({ data, error } = await supabaseAdmin
      .from("kma_offers")
      .select(baseSelect)
      .eq("is_active", true));
  }
  if (error) {
    console.error("loadKmaOffersAsOffers:", error.message);
    return [];
  }
  return (data as KmaOfferRow[]).map((row) => {
    const raw = (row.raw as KmaRawOffer) ?? {};
    const brand = brandFromTitle(row.name);
    const categoryKey = row.category || "Другое";
    // Title-first: KMA ships mixed buckets like "Паразиты, папилломы" and
    // "Здоровье (другое)", so the product name is the most reliable signal.
    // Only fall back to the static bucket map when the title is ambiguous.
    const titleFirst = classifyTitleFirst(row.name, categoryKey, "other");
    const mapped = KMA_CATEGORY_SLUG_MAP[categoryKey];
    const categorySlug =
      titleFirst !== "other"
        ? titleFirst
        : mapped ?? classifyByText(`${row.name} ${categoryKey}`, "other");
    const content = getCategoryContent(categorySlug);
    const priceEUR = parsePriceEUR(raw.itemprice);
    return {
      id: row.offer_id,
      source: "kma" as const,
      slug: resolveOfferSlug({
        title: row.name,
        brand,
        offerId: row.offer_id,
        source: "kma",
      }),
      title: brand,
      brand,
      subtitle: content.subtitleHi(brand),
      categoryKey,
      categoryName: content.nameHi,
      categorySlug,
      image: row.logo || "",
      priceEUR,
      landingUrl: null,
      publishedAt: row.synced_at,
      firstSeenAt: resolveFirstSeenAt(row),
    };
  });
}

/** Get the raw KMA payload for a single offer (used by AI content). */
export async function getKmaRawOffer(offerId: number): Promise<KmaRawOffer | null> {
  const { data, error } = await supabaseAdmin
    .from("kma_offers")
    .select("raw")
    .eq("offer_id", offerId)
    .maybeSingle();
  if (error || !data) return null;
  return (data.raw as KmaRawOffer) ?? null;
}

/** Get or create a KMA channel for the given offer. Caches result. */
export async function getOrCreateKmaChannel(offerId: number): Promise<string | null> {
  // 1. Check cache
  const { data: existing } = await supabaseAdmin
    .from("kma_channels")
    .select("channel_code")
    .eq("offer_id", offerId)
    .maybeSingle();
  if (existing?.channel_code) return existing.channel_code;

  const token = process.env.KMA_API_KEY;
  const sourceId = process.env.KMA_SOURCE_ID;
  if (!token || !sourceId) {
    console.error("KMA_API_KEY or KMA_SOURCE_ID missing");
    return null;
  }

  const url =
    `${KMA_BASE}/channel/create?token=${encodeURIComponent(token)}` +
    `&offer_id=${offerId}&source_id=${encodeURIComponent(sourceId)}` +
    `&name=${encodeURIComponent(`recenze-ceny-${offerId}`)}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    const json = (await res.json()) as {
      code?: number;
      msg?: string;
      channel?: { code?: string; id?: number } | string;
      data?: { code?: string };
    };
    // KMA returns either {channel:{code:"abc"}} or {channel:"abc"} or {data:{code}}.
    let code: string | null = null;
    if (typeof json.channel === "string") code = json.channel;
    else if (json.channel && typeof json.channel === "object") code = json.channel.code ?? null;
    if (!code && json.data?.code) code = json.data.code;
    if (!code) {
      console.error("KMA channel/create unexpected response:", JSON.stringify(json).slice(0, 300));
      return null;
    }
    await supabaseAdmin
      .from("kma_channels")
      .upsert({ offer_id: offerId, channel_code: code }, { onConflict: "offer_id" });
    return code;
  } catch (err) {
    console.error("KMA channel/create failed:", err);
    return null;
  }
}

export type KmaLeadInput = {
  offerId: number;
  name: string;
  phone: string;
  ip: string;
  userAgent: string;
  referer: string;
  lang?: "cs" | "sk" | "uk" | "ru";
};

function kmaErrorStrings(lang: "cs" | "sk" | "uk" | "ru") {
  if (lang === "ru") {
    return {
      notConfigured: "Сервис KMA не настроен.",
      channelFailed: "Не удалось создать канал. Попробуйте позже.",
      badResponse: "Неожиданный ответ от KMA.",
      networkError: "Сетевая ошибка. Попробуйте ещё раз.",
    };
  }
  if (lang === "cs") {
    return {
      notConfigured: "Služba KMA není nakonfigurována.",
      channelFailed: "Kanál se nepodařilo vytvořit. Zkuste to prosím později.",
      badResponse: "Neočekávaná odpověď od KMA.",
      networkError: "Chyba sítě. Zkuste to prosím znovu.",
    };
  }
  if (lang === "sk") {
    return {
      notConfigured: "Služba KMA nie je nakonfigurovaná.",
      channelFailed: "Kanál sa nepodarilo vytvoriť. Skúste to prosím neskôr.",
      badResponse: "Neočakávaná odpoveď od KMA.",
      networkError: "Chyba siete. Skúste to prosím znova.",
    };
  }
  return {
    notConfigured: "Сервіс KMA не налаштовано.",
    channelFailed: "Не вдалося створити канал. Спробуйте пізніше.",
    badResponse: "Неочікувана відповідь від KMA.",
    networkError: "Мережева помилка. Спробуйте ще раз.",
  };
}

function kmaApiLanguage(lang: "cs" | "sk" | "uk" | "ru"): string {
  if (lang === "ru") return "ru";
  if (lang === "cs" || lang === "sk") return "de";
  return "uk";
}

export async function submitKmaLead(
  input: KmaLeadInput,
): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  const lang = input.lang ?? "cs";
  const t = kmaErrorStrings(lang);
  const token = process.env.KMA_API_KEY;
  if (!token) return { ok: false, error: t.notConfigured };

  const channel = await getOrCreateKmaChannel(input.offerId);
  if (!channel) return { ok: false, error: t.channelFailed };

  const body = new URLSearchParams({
    token,
    channel,
    name: input.name,
    phone: input.phone,
    ip: input.ip,
    country: MARKET_GEO,
    language: kmaApiLanguage(lang),
    is_mobile: "1",
    referer: input.referer,
    ua: input.userAgent,
  });


  if (process.env.KMA_DEBUG_PAYLOAD === "1") {
    console.info("KMA lead payload:", Object.fromEntries(body.entries()));
  }
  try {
    const res = await fetch(`${KMA_BASE}/lead/add`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    let obj: { code?: number; message?: string; order?: number | string } = {};
    try {
      obj = JSON.parse(text);
    } catch {
      return { ok: false, error: t.badResponse };
    }
    if (obj.code === 0 && obj.order) return { ok: true, leadId: String(obj.order) };
    return { ok: false, error: obj.message || `KMA error ${obj.code ?? "?"}` };
  } catch (err) {
    console.error("KMA lead submit failed:", err);
    return { ok: false, error: t.networkError };
  }
}

