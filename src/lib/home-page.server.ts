import type { Category, Offer } from "./types";
import { loadCategories, loadOffers } from "./offers.server";
import { loadHomeStats, type HomeStats } from "./home-stats.server";
import { offersForClient, pickFeaturedOffers } from "./offers-utils";

export type HomePageData = {
  featured: Offer[];
  categories: Category[];
  stats: HomeStats;
};

/** Slim homepage payload — featured offers + categories + stats (no full catalogue). */
export async function loadHomePageData(): Promise<HomePageData> {
  const [offers, categories, stats] = await Promise.all([
    loadOffers(),
    loadCategories(),
    loadHomeStats(),
  ]);
  return {
    featured: offersForClient(pickFeaturedOffers(offers)),
    categories,
    stats,
  };
}
