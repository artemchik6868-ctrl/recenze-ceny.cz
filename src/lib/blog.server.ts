/** Blog post loaders — thin Supabase reads for SSR. */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  type BlogFaqItem,
  type BlogPost,
  type BlogPostListItem,
  type BlogPostStatus,
  parseProductKey,
} from "@/lib/blog";
import { BLOG_PATH } from "@/lib/site";
import { loadOffers } from "@/lib/offers.server";
import { isProductIndexable } from "@/lib/index-policy";
import type { Offer } from "@/lib/types";

type BlogRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_html: string;
  meta_title: string | null;
  meta_description: string | null;
  category_slug: string;
  cover_image_path: string | null;
  cover_credit: string | null;
  source_url: string;
  source_name: string | null;
  product_ids: string[] | null;
  faq: unknown;
  status: string;
  published_at: string | null;
  content_hash: string | null;
  created_at: string;
};

function parseFaq(raw: unknown): BlogFaqItem[] {
  if (!Array.isArray(raw)) return [];
  const out: BlogFaqItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const q = String((item as { q?: unknown }).q ?? "").trim();
    const a = String((item as { a?: unknown }).a ?? "").trim();
    if (q && a) out.push({ q, a });
  }
  return out;
}

function mapRow(row: BlogRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    bodyHtml: row.body_html,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    categorySlug: row.category_slug,
    coverImagePath: row.cover_image_path,
    coverCredit: row.cover_credit,
    sourceUrl: row.source_url,
    sourceName: row.source_name,
    productIds: Array.isArray(row.product_ids) ? row.product_ids : [],
    faq: parseFaq(row.faq),
    status: row.status as BlogPostStatus,
    publishedAt: row.published_at,
    contentHash: row.content_hash,
    createdAt: row.created_at,
  };
}

function mapListItem(row: BlogRow): BlogPostListItem {
  const full = mapRow(row);
  return {
    id: full.id,
    slug: full.slug,
    title: full.title,
    excerpt: full.excerpt,
    categorySlug: full.categorySlug,
    coverImagePath: full.coverImagePath,
    coverCredit: full.coverCredit,
    publishedAt: full.publishedAt,
  };
}

/** Cover URL — hotlinked remote image (absolute http(s) URL stored in cover_image_path). */
export function blogCoverPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return null;
}

export async function listPublishedBlogPosts(limit = 30): Promise<BlogPostListItem[]> {
  const { posts } = await listPublishedBlogPostsPage({ limit, offset: 0 });
  return posts;
}

/** Initial hub page size (SSR) and each “load more” chunk. */
export const BLOG_INDEX_PAGE_SIZE = 30;

export async function listPublishedBlogPostsPage(opts: {
  limit?: number;
  offset?: number;
}): Promise<{ posts: BlogPostListItem[]; total: number }> {
  const limit = Math.max(1, Math.min(opts.limit ?? BLOG_INDEX_PAGE_SIZE, 50));
  const offset = Math.max(0, opts.offset ?? 0);

  const { data, error, count } = await supabaseAdmin
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, body_html, meta_title, meta_description, category_slug, cover_image_path, cover_credit, source_url, source_name, product_ids, faq, status, published_at, content_hash, created_at",
      { count: "exact" },
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    if (error) console.error("[blog] listPublishedBlogPostsPage:", error.message);
    return { posts: [], total: 0 };
  }
  return {
    posts: (data as BlogRow[]).map(mapListItem),
    total: typeof count === "number" ? count : data.length + offset,
  };
}

export async function loadPublishedBlogPost(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, body_html, meta_title, meta_description, category_slug, cover_image_path, cover_credit, source_url, source_name, product_ids, faq, status, published_at, content_hash, created_at",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[blog] loadPublishedBlogPost:", error.message);
    return null;
  }
  if (!data) return null;
  return mapRow(data as BlogRow);
}

/** Resolve snapshot product_ids → live indexable offers (order preserved). */
export async function loadOffersByProductKeys(keys: string[]): Promise<Offer[]> {
  if (!keys.length) return [];
  const wanted = new Map<string, { source: string; id: number }>();
  for (const key of keys) {
    const parsed = parseProductKey(key);
    if (parsed) wanted.set(key, parsed);
  }
  if (!wanted.size) return [];

  const offers = await loadOffers();
  const byKey = new Map<string, Offer>();
  for (const o of offers) {
    if (!isProductIndexable(o)) continue;
    byKey.set(`${o.source}:${o.id}`, o);
  }

  const out: Offer[] = [];
  for (const key of keys) {
    const offer = byKey.get(key);
    if (offer) out.push(offer);
  }
  return out;
}

export async function listPublishedBlogSitemapEntries(): Promise<
  Array<{ path: string; lastmod?: string }>
> {
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("slug, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(500);

  if (error || !data) {
    if (error) console.error("[blog] sitemap:", error.message);
    return [];
  }

  return (data as Array<{ slug: string; published_at: string | null }>).map((row) => ({
    path: `${BLOG_PATH}/${row.slug}`,
    lastmod: row.published_at ?? undefined,
  }));
}
