/** Blog article: /clanky/{slug} — editorial read + conversion path to category/PDP. */

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getBlogPostData, type BlogPostData } from "@/lib/blog.functions";
import { blogPath, splitBlogBody, truncateBlogLabel } from "@/lib/blog";
import { sanitizeBlogHtml } from "@/lib/blog-html";
import { useI18n, getI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";
import { pathLang } from "@/lib/route-lang";
import { pageHead, notFoundHead } from "@/lib/page-head";
import { BLOG_PATH, SITE } from "@/lib/site";
import { categoryDisplayName } from "@/lib/category-display-name";
import { categoryPath } from "@/lib/category-path";
import { LANG_LOCALE } from "@/lib/lang";
import { BlogProductPicks } from "@/components/blog/BlogProductPicks";
import { BlogStickyCta } from "@/components/blog/BlogStickyCta";
import { clampDesc } from "@/lib/seo-meta";

export const Route = createFileRoute("/clanky/$slug")({
  loader: async ({ params }): Promise<BlogPostData> => {
    const data = await getBlogPostData({ data: { slug: params.slug } });
    if (!data.post) throw notFound();
    return data;
  },
  head: ({ params, loaderData, match }) => {
    const path = blogPath(params.slug);
    if (!loaderData?.post) return notFoundHead(path) as any;

    const { lang } = pathLang(match.pathname);
    const T = getI18n(lang);
    const post = loaderData.post;
    const title = clampDesc(
      post.metaTitle || T.blog.pageTitle(post.title, SITE.name),
      30,
      65,
    );
    const description = clampDesc(
      post.metaDescription || post.excerpt || T.blog.indexDesc,
      120,
      158,
    );
    const url = `${SITE.url}${path}`;
    const cover = loaderData.coverUrl;
    const catName = categoryDisplayName(post.categorySlug);

    const graph: Record<string, unknown>[] = [
      {
        "@type": "Article",
        headline: post.title,
        description,
        url,
        datePublished: post.publishedAt ?? post.createdAt,
        dateModified: post.publishedAt ?? post.createdAt,
        inLanguage: LANG_LOCALE[lang],
        isPartOf: { "@type": "WebSite", name: T.siteName, url: SITE.url },
        about: { "@type": "Thing", name: catName },
        author: {
          "@type": "Organization",
          name: T.siteName,
          url: SITE.url,
        },
        publisher: {
          "@type": "Organization",
          name: T.siteName,
          url: SITE.url,
        },
        ...(cover ? { image: [cover] } : {}),
        mainEntityOfPage: url,
      },
      {
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
            item: `${SITE.url}${BLOG_PATH}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: url,
          },
        ],
      },
    ];

    if (post.faq.length > 0) {
      graph.push({
        "@type": "FAQPage",
        mainEntity: post.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      });
    }

    return pageHead({
      path,
      title,
      description,
      lang,
      image: cover,
      type: "article",
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": graph,
          }),
        },
      ],
    }) as any;
  },
  component: BlogPostPage,
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

function BlogPostPage() {
  const { post, offers, coverUrl } = Route.useLoaderData() as BlogPostData;
  const T = useI18n();
  const href = useHref();
  if (!post) return null;

  const date = formatDate(post.publishedAt);
  const catName = categoryDisplayName(post.categorySlug);
  const catHref = categoryPath(post.categorySlug);
  const { before, after } = splitBlogBody(sanitizeBlogHtml(post.bodyHtml));
  const pricedOffers = offers
    .filter((o) => o.priceEUR == null || o.priceEUR > 0)
    .slice(0, 4);

  const productBlock =
    pricedOffers.length > 0 ? (
      <BlogProductPicks
        offers={pricedOffers}
        categorySlug={post.categorySlug}
        categoryName={catName}
      />
    ) : null;

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-12 pb-28 md:pb-12">
        <nav className="text-sm text-muted-foreground">
          <Link to={href("/")}>{T.nav.home}</Link>
          {" / "}
          <Link to={href(BLOG_PATH)}>{T.blog.breadcrumb}</Link>
          {` / ${truncateBlogLabel(post.title)}`}
        </nav>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <Link
            to={href(catHref)}
            className="transition-colors hover:text-foreground"
          >
            {catName}
          </Link>
          {date ? ` · ${T.blog.publishedLabel} ${date}` : null}
        </p>

        <h1 className="mt-3 font-display text-3xl tracking-tight md:text-4xl">{post.title}</h1>

        {post.excerpt ? (
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
        ) : null}

        {coverUrl ? (
          <figure className="mt-8">
            <img
              src={coverUrl}
              alt={post.title}
              className="aspect-[16/9] w-full object-cover"
              fetchPriority="high"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            {post.coverCredit || post.sourceName ? (
              <figcaption className="mt-2 text-xs text-muted-foreground">
                {post.coverCredit || post.sourceName}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div
          className="editorial-prose mt-8 max-w-none"
          dangerouslySetInnerHTML={{ __html: before }}
        />

        {productBlock}

        {after ? (
          <div
            className="editorial-prose mt-8 max-w-none"
            dangerouslySetInnerHTML={{ __html: after }}
          />
        ) : null}

        <aside className="mt-12 rounded-[12px] border border-border/80 bg-card px-5 py-8 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {T.blog.relatedCategory}
          </p>
          <h2 className="mt-3 font-display text-2xl tracking-tight">{catName}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {T.blog.relatedCategoryLead(catName)}
          </p>
          <Link
            to={href(catHref)}
            className="mt-5 inline-flex items-center justify-center rounded-[10px] bg-cta px-4 py-2.5 text-sm font-semibold text-cta-foreground shadow-cta transition-transform hover:-translate-y-0.5"
          >
            {T.blog.relatedCategoryCta(catName)} →
          </Link>
        </aside>

        {post.faq.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {T.blog.faqTitle}
            </h2>
            <div className="mt-5 divide-y divide-border border-y border-border">
              {post.faq.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="cursor-pointer list-none font-display text-lg font-semibold text-foreground">
                    {item.q}
                  </summary>
                  <p className="mt-3 text-[15px] leading-[1.7] text-prose">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <aside className="mt-12 border-t border-border/70 pt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {T.blog.expertStripLead}
          </p>
          <Link
            to={href("/medical-expert")}
            className="cta-underline mt-3 inline-block text-sm font-semibold text-cta"
          >
            {T.blog.expertLink} →
          </Link>
        </aside>

        {(post.sourceName || post.coverCredit) && (
          <p className="mt-10 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{T.blog.sourceLabel}: </span>
            {post.sourceName || post.coverCredit}
          </p>
        )}

        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{T.blog.disclaimer}</p>
      </main>

      <BlogStickyCta productCount={pricedOffers.length} categorySlug={post.categorySlug} />
    </>
  );
}
