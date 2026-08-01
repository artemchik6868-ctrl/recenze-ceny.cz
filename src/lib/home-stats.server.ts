// Aggregated stats for the home page. Computed from the existing offers
// cache (60 s in offers.server.ts), so this is cheap and updates as the
// catalogue changes — no separate cron required.
import { loadOffers, loadCategories } from "./offers.server";

export type HomeStats = {
  productsCount: number;
  categoriesCount: number;
  priceFromEUR: number | null;
  priceToEUR: number | null;
  topCategorySlugs: string[]; // up to 6
  lastUpdatedISO: string | null;
};

const ROUND_DOWN_50 = (n: number) => (n < 50 ? n : Math.floor(n / 50) * 50);

export async function loadHomeStats(): Promise<HomeStats> {
  const [offers, categories] = await Promise.all([loadOffers(), loadCategories()]);
  const prices = offers.map((o) => o.priceEUR).filter((p): p is number => typeof p === "number" && p > 0);
  const priceFrom = prices.length ? Math.min(...prices) : null;
  const priceTo = prices.length ? Math.max(...prices) : null;
  const generated = offers
    .map((o) => o.contentGeneratedAt)
    .filter((s): s is string => !!s)
    .sort();
  return {
    productsCount: ROUND_DOWN_50(offers.length),
    categoriesCount: categories.length,
    priceFromEUR: priceFrom,
    priceToEUR: priceTo,
    topCategorySlugs: categories.slice(0, 6).map((c) => c.slug),
    lastUpdatedISO: generated.length ? generated[generated.length - 1] : null,
  };
}
