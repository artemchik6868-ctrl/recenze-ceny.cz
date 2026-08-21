import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resolveFirstSeenAt, isMissingFirstSeenColumnError } from "./offer-first-seen.server";
import { getCategoryContent } from "./content.cs";
import { LEAD_ERRORS_CS } from "./lead-errors.cs";
import { MARKET_GEO } from "./market";
import { classifyTitleFirst } from "./classify";
import { buildPartnerClassifyBlob } from "./partner-feed-text";
import { resolveOfferSlug } from "./slugify";
import { normalizeProductTitle, cleanBrandName } from "./brand-clean";
import type { Offer } from "./types";
import {
  emptyPageBeforeEndError,
  isFeedPageExhausted,
  nextCpagettiPageLimit,
  parseCpagettiFeedJson,
  recordCpagettiSkippedOffset,
  recoverCpagettiSkippedOffsets,
  shouldCountCpagettiPoisonSkip,
  shouldDeactivateAfterSkips,
} from "./feed-sync-guards";
import { fetchFeed } from "./feed-sync-http";
import { deactivateMissingActiveOffers } from "./feed-sync-deactivate.server";


const FEED_URL = "https://api.cpagetti.com/wm/offers";
const LEAD_URL = "https://api.cpagetti.com/order/register";

// Off-brand verticals/categories we never want in the catalog.
const VERTICAL_BLACKLIST_RE = /^(gambling|betting|dating|adult|ss)$/i;
const CATEGORY_BLACKLIST_RE = /(беттинг|казино|gambling|adult|dating)/i;
// Safety regex against the full text (title + category + vertical).
const TEXT_BLACKLEET =
  /(casino|bet\b|betting|slot|poker|crypto|forex|trading|binary|dating|adult|порн|казино|ставк|крипт|форекс|gambl)/i;

function categorySlugFromText(name: string, feedCategory = "", raw?: unknown): string {
  const blob = buildPartnerClassifyBlob("cpagetti", raw ?? {}, name, feedCategory);
  return classifyTitleFirst(name, blob, "other");
}

function cleanTitle(raw: string): string {
  // Shared normalizer (Free/UA/HOLD/payout/parens) — single source of truth.
  return normalizeProductTitle(raw);
}

function brandFromTitle(title: string): string {
  return cleanBrandName(title);
}

// Real CPAgetti offer shape (subset).
type CpagettiGeo = {
  country_code?: string;
  country_name?: string;
  price?: string | number;
  priceCurrencyCode?: string;
  cost?: string | number;
  currency?: string;
};

export type CpagettiRawOffer = {
  id: number | string;
  name?: string;
  logo?: string;
  description?: string;
  category?: string;
  vertical?: string;
  goal?: string;
  geo?: Record<string, CpagettiGeo>;
  // Added by our sync step — the IN geo block picked from `geo`.
  in_geo?: CpagettiGeo;
  [k: string]: unknown;
};

function pickInGeo(o: CpagettiRawOffer): CpagettiGeo | null {
  const geo = o.geo;
  if (!geo || typeof geo !== "object") return null;
  for (const g of Object.values(geo)) {
    if (g && typeof g === "object" && String(g.country_code).toUpperCase() === MARKET_GEO) return g;
  }
  return null;
}

function isAllowed(o: CpagettiRawOffer): boolean {
  if (o.vertical && VERTICAL_BLACKLIST_RE.test(o.vertical)) return false;
  if (o.category && CATEGORY_BLACKLIST_RE.test(o.category)) return false;
  const text = `${o.name ?? ""} ${o.category ?? ""} ${o.vertical ?? ""}`;
  if (TEXT_BLACKLEET.test(text)) return false;
  return true;
}

function collectAllowedFromPage(page: CpagettiRawOffer[]): CpagettiRawOffer[] {
  const out: CpagettiRawOffer[] = [];
  for (const o of page) {
    const inGeo = pickInGeo(o);
    if (!inGeo) continue;
    if (!isAllowed(o)) continue;
    out.push({ ...o, in_geo: inGeo });
  }
  return out;
}

async function fetchCpagettiPage(
  token: string,
  offset: number,
  limit: number,
  geoFilter: boolean,
  opts: { maxAttempts?: number } = {},
): Promise<{ offers: CpagettiRawOffer[]; total: number | null; status: number }> {
  const url = new URL(FEED_URL);
  url.searchParams.set("token", token);
  url.searchParams.set("lang", "ru");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  if (geoFilter) url.searchParams.set("geo", MARKET_GEO);
  const res = await fetchFeed(url.toString(), {}, { maxAttempts: opts.maxAttempts });
  if (!res.ok) {
    return { offers: [], total: null, status: res.status };
  }
  const text = await res.text();
  const parsed = parseCpagettiFeedJson(text);
  return {
    offers: parsed.offers as CpagettiRawOffer[],
    total: parsed.total,
    status: res.status,
  };
}

type CpagettiRow = {
  offer_id: number;
  title: string;
  picture_url: string | null;
  category: string | null;
  vertical_id: number | null;
  raw: CpagettiRawOffer;
  is_active: boolean;
  synced_at: string;
};

export type FeedPageCursor = {
  kind: "page";
  /** Absolute feed offset (multiples of page size, except after a split/skip). */
  offset: number;
  /** Allowed offer_ids seen so far (for deactivate on done). */
  offerIds: number[];
  fetched: number;
  allowed: number;
  /** false after geo=CZ probe returned an empty catalog (API ignored/broke filter). */
  geoFilter?: boolean;
  /** Sticky page size after a 500 split so we do not re-probe limit=100 every offset. */
  pageLimit?: number;
  /** Poison offsets skipped (limit=1 still 500). Deactivate is skipped when > 0. */
  skippedOffsets?: number;
  /** Absolute offsets that stayed 5xx at limit=1 (for EOF retry + Telegram). */
  skippedOffsetList?: number[];
};

export type SyncChunkResult = {
  done: boolean;
  nextCursor?: FeedPageCursor;
  stats: {
    fetched: number;
    allowed: number;
    upserted: number;
    deactivated: number;
    skippedOffsets: number;
    skippedOffsetList: number[];
    chunkPages: number;
    done: boolean;
    debug?: unknown;
  };
};

const PAGE_SIZE = 100;
/** Pages per Worker invocation — keeps external subrequests well under CF free-tier caps. */
export const CPAGETTI_MAX_PAGES_PER_UNIT = 8;

export async function syncCpagettiOffersChunk(
  opts: {
    cursor?: FeedPageCursor | null;
    maxPages?: number;
  } = {},
): Promise<SyncChunkResult> {
  const token = process.env.CPAGETTI_API_TOKEN;
  if (!token) throw new Error("CPAGETTI_API_TOKEN not configured");

  const maxPages = opts.maxPages ?? CPAGETTI_MAX_PAGES_PER_UNIT;
  let offset = opts.cursor?.offset ?? 0;
  let fetched = opts.cursor?.fetched ?? 0;
  let allowedCount = opts.cursor?.allowed ?? 0;
  const offerIds = [...(opts.cursor?.offerIds ?? [])];
  let geoFilter = opts.cursor?.geoFilter ?? true;
  let pageLimit = opts.cursor?.pageLimit ?? PAGE_SIZE;
  let skippedOffsetList = [...(opts.cursor?.skippedOffsetList ?? [])];
  let skippedOffsets = skippedOffsetList.length;
  const debug: {
    firstPageSample: unknown;
    pages: Array<{ offset: number; count: number; status?: number; geoFilter?: boolean }>;
  } = {
    firstPageSample: null,
    pages: [],
  };

  const chunkAllowed: CpagettiRawOffer[] = [];
  let chunkPages = 0;
  let exhausted = false;
  let consecutiveSkips = 0;

  for (let i = 0; i < maxPages; i++) {
    let usedLimit = pageLimit;
    let pageResult = await fetchCpagettiPage(token, offset, usedLimit, geoFilter, {
      maxAttempts: 2,
    });
    if (
      geoFilter &&
      offset === 0 &&
      chunkPages === 0 &&
      pageResult.status === 200 &&
      pageResult.offers.length === 0 &&
      (pageResult.total == null || pageResult.total === 0)
    ) {
      console.info("[cpagetti] geo=CZ probe empty — falling back to unfiltered feed");
      geoFilter = false;
      pageResult = await fetchCpagettiPage(token, offset, usedLimit, false, {
        maxAttempts: 2,
      });
    }

    let skippedPoison = false;
    while (pageResult.status >= 500) {
      const nextLimit = nextCpagettiPageLimit(usedLimit);
      if (nextLimit == null) {
        consecutiveSkips += 1;
        if (consecutiveSkips > 20) {
          throw new Error(`CPAgetti feed HTTP ${pageResult.status} (20 skipped offsets)`);
        }
        console.warn(
          `[cpagetti] HTTP ${pageResult.status} at offset=${offset} limit=1 — full backoff retry`,
        );
        pageResult = await fetchCpagettiPage(token, offset, 1, geoFilter, {
          maxAttempts: 5,
        });
        if (!shouldCountCpagettiPoisonSkip(pageResult.status)) {
          usedLimit = 1;
          pageLimit = 1;
          break;
        }
        console.warn(
          `[cpagetti] skip offset=${offset} after HTTP ${pageResult.status} at limit=1`,
        );
        skippedOffsetList = recordCpagettiSkippedOffset(skippedOffsetList, offset);
        skippedOffsets = skippedOffsetList.length;
        offset += 1;
        skippedPoison = true;
        break;
      }
      console.warn(
        `[cpagetti] HTTP ${pageResult.status} at offset=${offset} limit=${usedLimit} — retry limit=${nextLimit}`,
      );
      usedLimit = nextLimit;
      pageLimit = nextLimit;
      pageResult = await fetchCpagettiPage(token, offset, usedLimit, geoFilter, {
        maxAttempts: 2,
      });
    }
    if (skippedPoison) continue;
    if (pageResult.status !== 200) {
      throw new Error(`CPAgetti feed HTTP ${pageResult.status}`);
    }
    consecutiveSkips = 0;
    pageLimit = usedLimit;

    const page = pageResult.offers;
    const emptyErr = emptyPageBeforeEndError({
      offset,
      pageLength: page.length,
      total: pageResult.total,
    });
    if (emptyErr) throw new Error(`CPAgetti feed: ${emptyErr}`);

    if (chunkPages === 0 && !opts.cursor) {
      debug.firstPageSample = {
        status: pageResult.status,
        total: pageResult.total,
        count: page.length,
        geoFilter,
      };
    }
    debug.pages.push({
      offset,
      count: page.length,
      status: pageResult.status,
      geoFilter,
    });
    chunkPages += 1;
    fetched += page.length;
    chunkAllowed.push(...collectAllowedFromPage(page));
    if (
      isFeedPageExhausted({
        httpStatus: pageResult.status,
        pageLength: page.length,
        pageSize: usedLimit,
        offset,
        total: pageResult.total,
      })
    ) {
      exhausted = true;
      break;
    }
    offset += page.length;
    if (pageLimit < PAGE_SIZE && offset % PAGE_SIZE === 0) {
      pageLimit = PAGE_SIZE;
    }
  }

  if (exhausted && skippedOffsetList.length > 0) {
    const recoveredOffsets: number[] = [];
    for (const skipOff of skippedOffsetList) {
      console.warn(`[cpagetti] EOF retry skipped offset=${skipOff} limit=1`);
      const retry = await fetchCpagettiPage(token, skipOff, 1, geoFilter, {
        maxAttempts: 5,
      });
      if (shouldCountCpagettiPoisonSkip(retry.status) || retry.offers.length === 0) {
        continue;
      }
      recoveredOffsets.push(skipOff);
      fetched += retry.offers.length;
      chunkAllowed.push(...collectAllowedFromPage(retry.offers));
      debug.pages.push({
        offset: skipOff,
        count: retry.offers.length,
        status: retry.status,
        geoFilter,
      });
    }
    skippedOffsetList = recoverCpagettiSkippedOffsets(skippedOffsetList, recoveredOffsets);
    skippedOffsets = skippedOffsetList.length;
    if (recoveredOffsets.length > 0) {
      console.info(
        `[cpagetti] EOF retry recovered offsets=${recoveredOffsets.join(",")} remaining=${skippedOffsets}`,
      );
    }
  }

  const syncedAt = new Date().toISOString();
  const rows: CpagettiRow[] = chunkAllowed.map((o) => ({
    offer_id: Number(o.id),
    title: cleanTitle(String(o.name ?? `Offer ${o.id}`)),
    picture_url: o.logo ?? (typeof o.image === "string" ? o.image : null) ?? null,
    category: o.category ?? null,
    vertical_id: null,
    raw: o,
    is_active: true,
    synced_at: syncedAt,
  }));

  if (rows.length > 0) {
    const { error } = await supabaseAdmin
      .from("cpagetti_offers")
      .upsert(rows as never, { onConflict: "offer_id" });
    if (error) throw new Error(`upsert cpagetti_offers: ${error.message}`);
  }

  for (const id of rows.map((r) => r.offer_id)) {
    if (!offerIds.includes(id)) offerIds.push(id);
  }
  allowedCount += rows.length;

  const done = exhausted;
  let deactivated = 0;
  if (done && shouldDeactivateAfterSkips(skippedOffsets)) {
    const d = await deactivateMissingActiveOffers("cpagetti_offers", offerIds);
    deactivated = d.deactivated;
  } else if (done && skippedOffsets > 0) {
    console.warn(
      `[cpagetti] skip deactivate: skippedOffsets=${skippedOffsets} offsets=${skippedOffsetList.join(",")} (incomplete page list)`,
    );
  }

  const stats = {
    fetched,
    allowed: allowedCount,
    upserted: rows.length,
    deactivated,
    skippedOffsets,
    skippedOffsetList,
    chunkPages,
    done,
    debug: opts.cursor ? undefined : debug,
  };

  if (done) {
    return { done: true, stats };
  }

  return {
    done: false,
    nextCursor: {
      kind: "page",
      offset,
      offerIds,
      fetched,
      allowed: allowedCount,
      geoFilter,
      pageLimit,
      skippedOffsets,
      skippedOffsetList,
    },
    stats,
  };
}

export async function syncCpagettiOffers(): Promise<{
  fetched: number;
  allowed: number;
  upserted: number;
  deactivated: number;
  skippedOffsets: number;
  skippedOffsetList: number[];
  debug?: unknown;
}> {
  let cursor: FeedPageCursor | null = null;
  let last = await syncCpagettiOffersChunk({ cursor, maxPages: 25 });
  let upserted = last.stats.upserted;
  const debug = last.stats.debug;
  while (!last.done) {
    cursor = last.nextCursor ?? null;
    last = await syncCpagettiOffersChunk({ cursor, maxPages: 25 });
    upserted += last.stats.upserted;
  }
  return {
    fetched: last.stats.fetched,
    allowed: last.stats.allowed,
    upserted,
    deactivated: last.stats.deactivated,
    skippedOffsets: last.stats.skippedOffsets,
    skippedOffsetList: last.stats.skippedOffsetList,
    debug,
  };
}

type CpagettiDbRow = {
  offer_id: number;
  title: string;
  picture_url: string | null;
  category: string | null;
  raw: unknown;
  synced_at: string;
  first_seen_at?: string | null;
};

export async function loadCpagettiOffersAsOffers(): Promise<Offer[]> {
  const baseSelect = "offer_id, title, picture_url, category, raw, synced_at";
  let { data, error } = await supabaseAdmin
    .from("cpagetti_offers")
    .select(`${baseSelect}, first_seen_at`)
    .eq("is_active", true);
  if (error && isMissingFirstSeenColumnError(error.message)) {
    console.warn("loadCpagettiOffersAsOffers: first_seen_at missing, using synced_at fallback");
    ({ data, error } = await supabaseAdmin
      .from("cpagetti_offers")
      .select(baseSelect)
      .eq("is_active", true));
  }
  if (error) {
    console.error("loadCpagettiOffersAsOffers:", error.message);
    return [];
  }
  return (data as CpagettiDbRow[]).map((row) => {
    const raw = (row.raw ?? {}) as CpagettiRawOffer;
    const cleaned = cleanTitle(row.title);
    const brand = brandFromTitle(cleaned);
    const slug = categorySlugFromText(String(raw.name ?? cleaned), row.category ?? "", raw);
    const content = getCategoryContent(slug);
    const priceRaw = raw.in_geo?.price;
    const price = priceRaw != null ? Number(priceRaw) : null;
    return {
      id: row.offer_id,
      source: "cpagetti" as const,
      slug: resolveOfferSlug({
        title: cleaned,
        brand,
        offerId: row.offer_id,
        source: "cpagetti",
      }),
      title: cleaned,
      brand,
      subtitle: content.subtitleHi(brand),
      categoryKey: row.category ?? slug,
      categoryName: content.nameHi,
      categorySlug: slug,
      image: row.picture_url || "",
      priceEUR: price != null && Number.isFinite(price) ? Math.round(price) : null,
      landingUrl: null,
      publishedAt: row.synced_at,
      firstSeenAt: resolveFirstSeenAt(row),
    };
  });
}

export async function getCpagettiRawOffer(
  offerId: number,
): Promise<CpagettiRawOffer | null> {
  const { data, error } = await supabaseAdmin
    .from("cpagetti_offers")
    .select("raw")
    .eq("offer_id", offerId)
    .maybeSingle();
  if (error || !data) return null;
  return (data.raw as CpagettiRawOffer) ?? null;
}

// Map CPAgetti error codes to user-friendly messages.
function errorMessage(code: number, lang: "uk" | "ru" | "de"): string {
  const de: Record<number, string> = {
    [-1]: "Der Bestellservice hat die Anfrage abgelehnt.",
    [-2]: "Der Bestellservice ist nicht konfiguriert. Bitte versuchen Sie es später erneut.",
    [-3]: "Kein Produktlink verfügbar. Bitte versuchen Sie es später erneut.",
    [-4]: "Der Bestellservice hat unsere Zugangsdaten abgelehnt.",
    [-5]: "Dieses Produkt ist nicht mehr verfügbar.",
    [-8]: "Bitte geben Sie Ihren vollständigen Namen an.",
    [-9]: "Bitte geben Sie eine gültige Telefonnummer ein.",
  };
  const ru: Record<number, string> = {
    [-1]: "Сервис заказов отклонил запрос.",
    [-2]: "Сервис заказов не настроен. Попробуйте позже.",
    [-3]: "Нет ссылки на товар. Попробуйте позже.",
    [-4]: "Сервис заказов отклонил наши учётные данные.",
    [-5]: "Этот товар больше недоступен.",
    [-8]: "Пожалуйста, укажите полное имя.",
    [-9]: "Пожалуйста, введите действительный номер телефона.",
  };
  const uk: Record<number, string> = {
    [-1]: "Сервіс замовлень відхилив запит.",
    [-2]: "Сервіс замовлень не налаштовано. Спробуйте пізніше.",
    [-3]: "Немає посилання на товар. Спробуйте пізніше.",
    [-4]: "Сервіс замовлень відхилив наші облікові дані.",
    [-5]: "Цей товар більше недоступний.",
    [-8]: "Будь ласка, вкажіть повне ім'я.",
    [-9]: "Будь ласка, введіть дійсний номер телефону.",
  };
  const dict = lang === "ru" ? ru : lang === "cs" ? de : uk;
  return (
    dict[code] ||
    (lang === "ru"
      ? `Ошибка сервиса заказов (${code}). Попробуйте позже.`
      : lang === "cs"
        ? `Fehler des Bestellservices (${code}). Bitte versuchen Sie es später erneut.`
        : `Помилка сервісу замовлень (${code}). Спробуйте пізніше.`)
  );
}

export type CpagettiLeadInput = {
  offerId: number;
  name: string;
  phone: string;
  ip: string;
  userAgent: string;
  lang?: "cs" | "sk" | "uk" | "ru" | "de";
  sub1?: string;
  sub2?: string;
};

export async function submitCpagettiLead(
  input: CpagettiLeadInput,
): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  const token = process.env.CPAGETTI_API_TOKEN;
  const t = LEAD_ERRORS_CS;
  if (!token) return { ok: false, error: t.notConfigured };

  const cpagettiLang =
    input.lang === "ru" ? "RU" : input.lang === "cs" ? "DE" : "UK";
  const errorLang: "uk" | "ru" | "de" =
    input.lang === "ru" ? "ru" : input.lang === "cs" ? "de" : "uk";

  const body = new URLSearchParams({
    api_key: token,
    offer_id: String(input.offerId),
    name: input.name,
    phone: input.phone,
    country: MARKET_GEO,
    lang: cpagettiLang,
    ip: input.ip,
    sub1: input.sub1 ?? "recenze-ceny",
    sub2: input.sub2 ?? "",
  });

  try {
    const res = await fetch(LEAD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": input.userAgent || "Mozilla/5.0",
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    const trimmed = text.trim();
    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber) && asNumber < 0) {
      return { ok: false, error: errorMessage(asNumber, errorLang) };
    }
    let obj: { id?: string | number; status?: string; error?: string | number; message?: string } = {};
    try {
      obj = JSON.parse(trimmed);
    } catch {
      if (res.ok) return { ok: true, leadId: trimmed.slice(0, 64) || "ok" };
      return { ok: false, error: t.badResponse };
    }
    if (typeof obj.error === "number" && obj.error < 0) {
      return { ok: false, error: errorMessage(obj.error, errorLang) };
    }
    if (obj.id) return { ok: true, leadId: String(obj.id) };
    if (obj.status && /ok|success/i.test(obj.status)) {
      return { ok: true, leadId: String(obj.id ?? "ok") };
    }
    return { ok: false, error: obj.message || t.rejected };
  } catch (err) {
    console.error("CPAgetti lead submit failed:", err);
    return { ok: false, error: t.networkError };
  }
}

