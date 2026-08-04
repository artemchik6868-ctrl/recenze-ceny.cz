/** Blog index: /clanky/ — first 30 in SSR HTML, then client “load more”. */

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  getBlogIndexData,
  getBlogIndexMore,
  type BlogIndexData,
  type BlogIndexPost,
} from "@/lib/blog.functions";
import { blogPath } from "@/lib/blog";
import { useI18n, getI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";
import { pathLang } from "@/lib/route-lang";
import { pageHead } from "@/lib/page-head";
import { BLOG_PATH, SITE } from "@/lib/site";
import { categoryDisplayName } from "@/lib/category-display-name";
import { categoryPath } from "@/lib/category-path";
import { LANG_LOCALE } from "@/lib/lang";

export const Route = createFileRoute("/clanky/")({
  loader: async (): Promise<BlogIndexData> => getBlogIndexData(),
  head: ({ match }) => {
    const { lang } = pathLang(match.pathname);
    const T = getI18n(lang);
    const title = T.blog.indexTitle(SITE.name);
    const description = T.blog.indexDesc;
    const url = `${SITE.url}${BLOG_PATH}`;
    return pageHead({
      path: BLOG_PATH,
      title,
      description,
      lang,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description,
            url,
            inLanguage: LANG_LOCALE[lang],
            isPartOf: { "@type": "WebSite", name: T.siteName, url: SITE.url },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: T.nav.home,
                item: `${SITE.url}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: T.blog.breadcrumb,
                item: url,
              },
            ],
          }),
        },
      ],
    }) as any;
  },
  component: BlogIndexPage,
});

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

function BlogPostTeaser({
  post,
  href,
  T,
}: {
  post: BlogIndexPost;
  href: (path: string) => string;
  T: ReturnType<typeof useI18n>;
}) {
  const date = formatDate(post.publishedAt);
  const catName = categoryDisplayName(post.categorySlug);
  return (
    <li className="border-t border-border/70 pt-8 first:border-t-0 first:pt-0">
      {post.coverUrl ? (
        <Link to={href(blogPath(post.slug))} className="block overflow-hidden">
          <img
            src={post.coverUrl}
            alt=""
            className="aspect-[16/9] w-full object-cover"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </Link>
      ) : null}
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        <Link
          to={href(categoryPath(post.categorySlug))}
          className="transition-colors hover:text-foreground"
        >
          {catName}
        </Link>
        {date ? ` · ${date}` : null}
      </p>
      <h2 className="mt-2 font-display text-2xl tracking-tight">
        <Link
          to={href(blogPath(post.slug))}
          className="transition-colors hover:text-primary"
        >
          {post.title}
        </Link>
      </h2>
      {post.excerpt ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
      ) : null}
      <Link
        to={href(blogPath(post.slug))}
        className="mt-4 inline-block text-sm font-medium text-primary transition-opacity hover:opacity-80"
      >
        {T.blog.readMore} →
      </Link>
    </li>
  );
}

function BlogIndexPage() {
  const initial = Route.useLoaderData() as BlogIndexData;
  const T = useI18n();
  const href = useHref();
  const [posts, setPosts] = useState(initial.posts);
  const [total, setTotal] = useState(initial.total);
  const [loading, setLoading] = useState(false);
  const hasMore = posts.length < total;

  async function onLoadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const next = await getBlogIndexMore({ data: { offset: posts.length } });
      setTotal(next.total);
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...next.posts.filter((p) => !seen.has(p.id))];
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <nav className="text-sm text-muted-foreground">
        <Link to={href("/")}>{T.nav.home}</Link>
        {` / ${T.blog.breadcrumb}`}
      </nav>
      <h1 className="mt-4 font-display text-3xl tracking-tight md:text-4xl">{T.blog.indexH1}</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        {T.blog.indexLead}
      </p>

      {!posts.length ? (
        <p className="mt-10 text-muted-foreground">{T.blog.empty}</p>
      ) : (
        <>
          <ul className="mt-10 space-y-10">
            {posts.map((post) => (
              <BlogPostTeaser key={post.id} post={post} href={href} T={T} />
            ))}
          </ul>
          {hasMore ? (
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-[10px] border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? T.blog.loadMoreLoading : T.blog.loadMore}
              </button>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
