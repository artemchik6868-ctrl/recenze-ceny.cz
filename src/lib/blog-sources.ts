/**
 * Whitelist of medical / health RSS sources for blog ingest.
 * Prefer research headlines (ScienceDaily) — WHO/CDC are mostly institutional PR.
 */

export type BlogRssSource = {
  id: string;
  name: string;
  feedUrl: string;
  /** Optional default shelf when LLM cannot map. */
  defaultCategorySlug?: string;
  /** Max items to consider per feed per run. */
  maxItems?: number;
};

export const BLOG_RSS_SOURCES: BlogRssSource[] = [
  {
    id: "sciencedaily-health",
    name: "ScienceDaily — Health & Medicine",
    feedUrl: "https://www.sciencedaily.com/rss/health_medicine.xml",
    defaultCategorySlug: "traveni",
    maxItems: 24,
  },
  {
    id: "cdc-newsroom",
    name: "CDC Newsroom",
    feedUrl: "https://tools.cdc.gov/api/v2/resources/media/132608.rss",
    defaultCategorySlug: "stres",
    maxItems: 12,
  },
  {
    id: "who-news",
    name: "WHO News",
    feedUrl: "https://www.who.int/rss-feeds/news-english.xml",
    defaultCategorySlug: "stres",
    maxItems: 8,
  },
];
