import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { BlogPost, BlogPostListItem } from "@/lib/blog";
import {
  BLOG_INDEX_PAGE_SIZE,
  blogCoverPublicUrl,
  listPublishedBlogPostsPage,
  listRelatedBlogPosts,
  loadOffersByProductKeys,
  loadPublishedBlogPost,
} from "@/lib/blog.server";
import type { Offer } from "@/lib/types";

export type BlogIndexPost = BlogPostListItem & { coverUrl: string | null };

export type BlogIndexData = {
  posts: BlogIndexPost[];
  total: number;
  pageSize: number;
};

export type BlogPostData = {
  post: BlogPost | null;
  offers: Offer[];
  coverUrl: string | null;
  relatedPosts: BlogIndexPost[];
};

function withCover(posts: BlogPostListItem[]): BlogIndexPost[] {
  return posts.map((p) => ({
    ...p,
    coverUrl: blogCoverPublicUrl(p.coverImagePath),
  }));
}

export const getBlogIndexData = createServerFn({ method: "GET" }).handler(
  async (): Promise<BlogIndexData> => {
    const { posts, total } = await listPublishedBlogPostsPage({
      limit: BLOG_INDEX_PAGE_SIZE,
      offset: 0,
    });
    return {
      posts: withCover(posts),
      total,
      pageSize: BLOG_INDEX_PAGE_SIZE,
    };
  },
);

/** Client “load more” — next chunk after SSR first page. */
export const getBlogIndexMore = createServerFn({ method: "GET" })
  .inputValidator((data: { offset: number }) =>
    z
      .object({
        offset: z.number().int().min(0).max(5000),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<BlogIndexData> => {
    const { posts, total } = await listPublishedBlogPostsPage({
      limit: BLOG_INDEX_PAGE_SIZE,
      offset: data.offset,
    });
    return {
      posts: withCover(posts),
      total,
      pageSize: BLOG_INDEX_PAGE_SIZE,
    };
  });

export const getBlogPostData = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) =>
    z.object({ slug: z.string().min(1).max(120) }).parse(data),
  )
  .handler(async ({ data }): Promise<BlogPostData> => {
    const post = await loadPublishedBlogPost(data.slug);
    if (!post) return { post: null, offers: [], coverUrl: null, relatedPosts: [] };
    const [offers, related] = await Promise.all([
      loadOffersByProductKeys(post.productIds),
      listRelatedBlogPosts({
        excludeSlug: post.slug,
        categorySlug: post.categorySlug,
        limit: 4,
      }),
    ]);
    return {
      post,
      offers,
      coverUrl: blogCoverPublicUrl(post.coverImagePath),
      relatedPosts: withCover(related),
    };
  });
