import { loadCategories, loadOffers } from "./offers.server";
import { offersForClient } from "./offers-utils";
import type { Category, Offer } from "./types";

export type ProductsIndexData = {
  offers: Offer[];
  categories: Category[];
};

export async function loadProductsIndexData(): Promise<ProductsIndexData> {
  const [offers, categories] = await Promise.all([loadOffers(), loadCategories()]);
  return { offers: offersForClient(offers), categories };
}
