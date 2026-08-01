import type { Category, Offer } from "./types";
import { loadCategories, loadOffers } from "./offers.server";
import { offersForClient, pickFeaturedOffers } from "./offers-utils";
import { indexableOffersByCategory } from "./index-policy";

export const CITY_PRODUCT_LIMIT = 12;

export type CityPageData = {
  products: Offer[];
  categories: Category[];
};

/** Categories with indexable products + up to 12 featured offers for city landings. */
export async function loadCityPageData(): Promise<CityPageData> {
  const [offers, categories] = await Promise.all([loadOffers(), loadCategories()]);
  const indexableByCategory = indexableOffersByCategory(offers);
  const visibleCategories = categories.filter(
    (c) => (indexableByCategory.get(c.slug) ?? 0) > 0,
  );
  return {
    products: offersForClient(pickFeaturedOffers(offers, CITY_PRODUCT_LIMIT)),
    categories: visibleCategories,
  };
}
