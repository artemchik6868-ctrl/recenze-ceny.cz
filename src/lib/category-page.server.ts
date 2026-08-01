import { notFound } from "@tanstack/react-router";
import { loadCategories, offersByCategory } from "./offers.server";
import { offersForClient } from "./offers-utils";
import type { Category, Offer } from "./types";

export type CategoryPageData = {
  category: Category;
  offers: Offer[];
  allCategories: Category[];
};

export async function loadCategoryPageData(slug: string): Promise<CategoryPageData> {
  const [categories, offers] = await Promise.all([
    loadCategories(),
    offersByCategory(slug),
  ]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) throw notFound();
  return { category, offers: offersForClient(offers), allCategories: categories };
}
