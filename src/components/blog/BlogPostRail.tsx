import { Link } from "@tanstack/react-router";
import { blogPath } from "@/lib/blog";
import type { BlogPostListItem } from "@/lib/blog";
import { useHref } from "@/lib/lang-link";
import { categoryDisplayName } from "@/lib/category-display-name";
import { categoryPath } from "@/lib/category-path";
import { BLOG_PATH } from "@/lib/site";
import { useI18n } from "@/lib/i18n";

export type BlogRailPost = Pick<
  BlogPostListItem,
  "id" | "slug" | "title" | "excerpt" | "categorySlug" | "publishedAt"
>;

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("cs-CZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Compact SSR blog link rail — titles + dates, no product-style cards.
 */
export function BlogPostRail({
  title,
  posts,
  showExcerpt = false,
  showCategory = true,
  className = "",
}: {
  title: string;
  posts: BlogRailPost[];
  showExcerpt?: boolean;
  showCategory?: boolean;
  className?: string;
}) {
  const T = useI18n();
  const href = useHref();
  if (!posts.length) return null;

  return (
    <section className={className}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {title}
        </h2>
        <Link
          to={href(BLOG_PATH)}
          className="text-sm font-semibold text-cta transition-opacity hover:opacity-80"
        >
          {T.blog.allPostsLink} →
        </Link>
      </div>
      <ul className="mt-6 divide-y divide-border border-y border-border">
        {posts.map((post) => {
          const date = formatDate(post.publishedAt);
          const catName = categoryDisplayName(post.categorySlug);
          return (
            <li key={post.id} className="py-4">
              {showCategory || date ? (
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {showCategory ? (
                    <Link
                      to={href(categoryPath(post.categorySlug))}
                      className="transition-colors hover:text-foreground"
                    >
                      {catName}
                    </Link>
                  ) : null}
                  {showCategory && date ? " · " : null}
                  {date}
                </p>
              ) : null}
              <Link
                to={href(blogPath(post.slug))}
                className="mt-1 block font-display text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
              >
                {post.title}
              </Link>
              {showExcerpt && post.excerpt ? (
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
