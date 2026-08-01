import type { Offer, Category } from "./types";
import { getCategoryContent } from "./content.cs";
import { loadKmaOffersAsOffers } from "./kma.server";
import { loadCpaTlOffersAsOffers } from "./cpa-tl-sync.server";
import { loadM1TopOffersAsOffers } from "./m1-top-sync.server";
import { loadCpagettiOffersAsOffers } from "./cpagetti-sync.server";
import { loadAdcomboOffersAsOffers } from "./adcombo-sync.server";
import { loadShakesOffersAsOffers } from "./shakes-sync.server";
import { cleanFeedTitleWithDescriptor, splitBrandAndTail } from "./brand-clean";
import { stripBrandFromText } from "./ai-content.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { loadResolvedCategoryMap } from "./catalog-shelf.server";
import { seoSlugFromRoTitle, shouldPreferRoDerivedSlug } from "./slugify";
import { pickFeaturedOffers } from "./offers-utils";

export { pickFeaturedOffers };

const CACHE_TTL_MS = 60 * 1000;
let cache: { fetchedAt: number; offers: Offer[] } | null = null;
let inflight: Promise<Offer[]> | null = null;

type ContentRow = {
  source: string;
  offer_id: number;
  title_uk: string | null;
  subtitle_uk: string | null;
  meta_desc_uk: string | null;
  meta_desc_ru: string | null;
  display_title_uk: string | null;
  display_title_ru: string | null;
  generated_at: string | null;
  form_kind: string | null;
};

async function loadContentMap(): Promise<Map<string, ContentRow>> {
  const { data, error } = await supabaseAdmin
    .from("product_content")
    .select(
      "source, offer_id, title_uk, subtitle_uk, meta_desc_uk, meta_desc_ru, display_title_uk, display_title_ru, generated_at, form_kind",
    );
  if (error || !data) return new Map();
  const map = new Map<string, ContentRow>();
  for (const r of data as ContentRow[]) map.set(`${r.source}:${r.offer_id}`, r);
  return map;
}

async function loadFresh(): Promise<Offer[]> {
  const [cpa, kma, m1, cpagetti, adcombo, shakes, resolvedMap, contentMap] =
    await Promise.all([
      loadCpaTlOffersAsOffers(),
      loadKmaOffersAsOffers(),
      loadM1TopOffersAsOffers(),
      loadCpagettiOffersAsOffers(),
      loadAdcomboOffersAsOffers(),
      loadShakesOffersAsOffers(),
      loadResolvedCategoryMap().catch(() => new Map<string, string>()),
      loadContentMap().catch(() => new Map<string, ContentRow>()),
    ]);
  const merged = [...cpa, ...kma, ...m1, ...cpagetti, ...adcombo, ...shakes]
    .map((o) => {
      const key = `${o.source}:${o.id}`;
      const resolvedSlug = resolvedMap.get(key);
      const c = contentMap.get(key);
      const next: Offer = { ...o, aiCategoryResolved: false };

      if (resolvedSlug) {
        const catContent = getCategoryContent(resolvedSlug);
        next.aiCategoryResolved = true;
        next.categorySlug = resolvedSlug;
        next.categoryName = catContent.nameHi;
      }

      if (c) {
        const dispRaw = c.display_title_uk ? c.display_title_uk.trim() : null;
        const disp = dispRaw || null;
        next.metaTitle = c.title_uk?.trim() || null;
        next.metaDesc = c.meta_desc_uk
          ? stripBrandFromText(c.meta_desc_uk, disp ?? "", o.title, o.brand)
          : c.meta_desc_uk;
        const subtitle = c.subtitle_uk
          ? stripBrandFromText(c.subtitle_uk, disp ?? "", o.title, o.brand)
          : c.subtitle_uk;
        next.displayTitle = disp;
        next.contentGeneratedAt = c.generated_at ?? null;
        next.formKind = c.form_kind ?? null;
        next.subtitle = subtitle?.trim() ?? "";
      } else {
        next.subtitle = "";
      }

      if (!next.displayTitle) {
        next.displayTitle =
          cleanFeedTitleWithDescriptor(o.title) || o.title;
      }
      const { brand: displayBrand } = splitBrandAndTail(next.displayTitle ?? "");
      if (next.displayTitle?.trim() && !displayBrand.trim()) {
        next.slug = seoSlugFromRoTitle(
          next.displayTitle,
          "",
          next.id,
          next.source,
        );
      } else if (
        next.displayTitle &&
        shouldPreferRoDerivedSlug(next.slug, next.displayTitle, next.brand)
      ) {
        next.slug = seoSlugFromRoTitle(
          next.displayTitle,
          next.brand,
          next.id,
          next.source,
        );
      }
      return next;
    })
    .sort((a, b) => (a.publishedAt > b.publishedAt ? -1 : 1));
  cache = { fetchedAt: Date.now(), offers: merged };
  return merged;
}

export async function loadOffers(): Promise<Offer[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.offers;
  if (!inflight) {
    inflight = loadFresh().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export async function loadCategories(): Promise<Category[]> {
  const offers = await loadOffers();
  const map = new Map<string, Category>();
  for (const o of offers) {
    if (!o.aiCategoryResolved || o.categorySlug === "other") continue;
    const existing = map.get(o.categorySlug);
    if (existing) {
      existing.count += 1;
    } else {
      const content = getCategoryContent(o.categorySlug);
      map.set(o.categorySlug, {
        key: o.categorySlug === o.categoryKey ? o.categoryKey : o.categorySlug,
        slug: o.categorySlug,
        name: content.nameHi,
        description: content.shortDescHi,
        count: 1,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export async function findOfferById(id: number): Promise<Offer | null> {
  const offers = await loadOffers();
  return offers.find((o) => o.id === id) ?? null;
}

export async function findOfferBySlug(slug: string): Promise<Offer | null> {
  const offers = await loadOffers();
  const exact = offers.find((o) => o.slug === slug);
  if (exact) return exact;
  const m = slug.match(/-([kmgast])?(\d+)$/);
  if (m) {
    const id = Number(m[2]);
    const sourcePrefix = m[1];
    const sourceMap: Record<string, string> = {
      k: "kma",
      m: "m1_top",
      g: "cpagetti",
      a: "adcombo",
      s: "shakes",
    };
    const source = sourcePrefix ? sourceMap[sourcePrefix] : "cpa_tl";
    return offers.find((o) => o.id === id && o.source === source) ?? null;
  }
  return null;
}

export async function offersByCategory(slug: string): Promise<Offer[]> {
  const offers = await loadOffers();
  return offers.filter((o) => o.aiCategoryResolved && o.categorySlug === slug);
}
