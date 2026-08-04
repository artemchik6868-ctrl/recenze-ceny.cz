import { notFound } from "@tanstack/react-router";
import { loadCategories, offersByCategory } from "./offers.server";
import { offersForClient } from "./offers-utils";
import type { Category, Offer } from "./types";
import {
  blogCoverPublicUrl,
  listBlogPostsByCategory,
} from "./blog.server";
import type { BlogPostListItem } from "./blog";

export type CategoryBlogPost = BlogPostListItem & { coverUrl: string | null };

export type CategoryPageData = {
  category: Category;
  offers: Offer[];
  allCategories: Category[];
  blogPosts: CategoryBlogPost[];
};

export async function loadCategoryPageData(slug: string): Promise<CategoryPageData> {
  const [categories, offers, blogPosts] = await Promise.all([
    loadCategories(),
    offersByCategory(slug),
    listBlogPostsByCategory(slug, 4),
  ]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) throw notFound();
  return {
    category,
    offers: offersForClient(offers),
    allCategories: categories,
    blogPosts: blogPosts.map((p) => ({
      ...p,
      coverUrl: blogCoverPublicUrl(p.coverImagePath),
    })),
  };
}
