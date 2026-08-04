import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { BlogPost, BlogPostListItem } from "@/lib/blog";
import {
  blogCoverPublicUrl,
  listPublishedBlogPosts,
  loadOffersByProductKeys,
  loadPublishedBlogPost,
} from "@/lib/blog.server";
import type { Offer } from "@/lib/types";

export type BlogIndexData = {
  posts: Array<BlogPostListItem & { coverUrl: string | null }>;
};

export type BlogPostData = {
  post: BlogPost | null;
  offers: Offer[];
  coverUrl: string | null;
};

export const getBlogIndexData = createServerFn({ method: "GET" }).handler(
  async (): Promise<BlogIndexData> => {
    const posts = await listPublishedBlogPosts(24);
    return {
      posts: posts.map((p) => ({
        ...p,
        coverUrl: blogCoverPublicUrl(p.coverImagePath),
      })),
    };
  },
);

export const getBlogPostData = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) =>
    z.object({ slug: z.string().min(1).max(120) }).parse(data),
  )
  .handler(async ({ data }): Promise<BlogPostData> => {
    const post = await loadPublishedBlogPost(data.slug);
    if (!post) return { post: null, offers: [], coverUrl: null };
    const offers = await loadOffersByProductKeys(post.productIds);
    return {
      post,
      offers,
      coverUrl: blogCoverPublicUrl(post.coverImagePath),
    };
  });
