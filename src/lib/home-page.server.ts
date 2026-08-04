import type { Category, Offer } from "./types";
import { loadCategories, loadOffers } from "./offers.server";
import { loadHomeStats, type HomeStats } from "./home-stats.server";
import { offersForClient, pickFeaturedOffers } from "./offers-utils";
import {
  blogCoverPublicUrl,
  listPublishedBlogPosts,
} from "./blog.server";
import type { BlogPostListItem } from "./blog";

export type HomeBlogPost = BlogPostListItem & { coverUrl: string | null };

export type HomePageData = {
  featured: Offer[];
  categories: Category[];
  stats: HomeStats;
  latestBlogPosts: HomeBlogPost[];
};

/** Slim homepage payload — featured offers + categories + stats (no full catalogue). */
export async function loadHomePageData(): Promise<HomePageData> {
  const [offers, categories, stats, blogPosts] = await Promise.all([
    loadOffers(),
    loadCategories(),
    loadHomeStats(),
    listPublishedBlogPosts(4),
  ]);
  return {
    featured: offersForClient(pickFeaturedOffers(offers)),
    categories,
    stats,
    latestBlogPosts: blogPosts.map((p) => ({
      ...p,
      coverUrl: blogCoverPublicUrl(p.coverImagePath),
    })),
  };
}
