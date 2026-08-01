/** Buying-guide hub pages: /pruvodce/{category-slug} */

import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { getCategoryPageData } from "@/lib/category-page.functions";
import { getCategoryContentByLang } from "@/lib/content";
import { buildCategoryGuideEditorial } from "@/lib/category-content";
import { getCategorySeoIntent } from "@/lib/seo-intent.cs";
import { useI18n, getI18n } from "@/lib/i18n";
import { useLang, LANG_LOCALE } from "@/lib/lang";
import { useHref } from "@/lib/lang-link";
import { pathLang } from "@/lib/route-lang";
import { pageHead, notFoundHead } from "@/lib/page-head";
import { ProductCard } from "@/components/ProductCard";
import { clampDesc } from "@/lib/seo-meta";
import { SITE, GUIDE_PATH } from "@/lib/site";
import { isCategoryIndexable, isProductIndexable, robotsNoindexMeta } from "@/lib/index-policy";
import { categorySlugRedirectTarget } from "@/lib/category-slug-redirects";
import { categoryPath } from "@/lib/category-path";

export const Route = createFileRoute("/pruvodce/$slug")({
  loader: async ({ params }) => {
    const redirectSlug = categorySlugRedirectTarget(params.slug);
    if (redirectSlug) {
      throw redirect({ to: `/pruvodce/${redirectSlug}`, replace: true, statusCode: 301 });
    }
    const data = await getCategoryPageData({ data: { slug: params.slug } });
    const visible = data.offers.filter(isProductIndexable);
    const editorial = buildCategoryGuideEditorial(params.slug, visible, "cs");
    return { ...data, editorial };
  },
  head: ({ params, loaderData, match }) => {
    const path = `${GUIDE_PATH}/${params.slug}`;
    if (!loaderData?.category) return notFoundHead(path);

    const { lang } = pathLang(match.pathname);
    const T = getI18n(lang);
    const content = getCategoryContentByLang(params.slug, lang);
    const intent = getCategorySeoIntent(params.slug);
    const url = `${SITE.url}${path}`;
    const name = content.nameHi;
    const count = (loaderData.offers ?? []).filter(isProductIndexable).length;
    const robots = robotsNoindexMeta(isCategoryIndexable(count));
    const title = clampDesc(T.guide.pageTitle(name, SITE.name), 30, 60);
    const desc = clampDesc(T.guide.pageDesc(intent.primaryKeyword), 120, 158);
    return pageHead({
      path,
      title,
      description: desc,
      lang,
      robots: robots?.content ?? null,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: title,
            description: desc,
            url,
            inLanguage: LANG_LOCALE[lang],
            isPartOf: { "@type": "WebSite", name: T.siteName, url: SITE.url },
            about: { "@type": "Thing", name: name },
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
                name: T.product.crumbHome,
                item: `${SITE.url}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: T.category.allCategoriesCrumb,
                item: `${SITE.url}/category`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name,
                item: `${SITE.url}${categoryPath(params.slug)}`,
              },
              { "@type": "ListItem", position: 4, name: T.guide.breadcrumb, item: url },
            ],
          }),
        },
      ],
    });
  },
  component: GuidePage,
});

function GuidePage() {
  const { slug } = Route.useParams();
  const { offers: allOffers, editorial } = Route.useLoaderData();
  const offers = allOffers.filter(isProductIndexable);
  const lang = useLang();
  const T = useI18n();
  const href = useHref();
  const content = getCategoryContentByLang(slug, lang);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <nav className="text-sm text-muted-foreground">
        <Link to={href("/")}>{T.nav.home}</Link>
        {" / "}
        <Link to={href("/category")}>{T.category.allCategoriesCrumb}</Link>
        {" / "}
        <Link to={href(categoryPath(slug))}>{content.nameHi}</Link>
        {` / ${T.guide.breadcrumb}`}
      </nav>
      <h1 className="mt-4 font-display text-3xl tracking-tight md:text-4xl">
        {T.guide.h1(content.nameHi)}
      </h1>
      <p className="mt-3 text-prose">
        {T.guide.lead(content.nameHi)}
      </p>
      <article
        className="editorial-prose mt-8 max-w-none"
        dangerouslySetInnerHTML={{ __html: editorial.introHtml }}
      />
      {editorial.comparisonHtml ? (
        <section
          className="editorial-prose mt-10 max-w-none"
          dangerouslySetInnerHTML={{ __html: editorial.comparisonHtml }}
        />
      ) : null}
      {offers.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl">{T.guide.recommendedProducts}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {offers.slice(0, 6).map((o) => (
              <ProductCard key={o.id} offer={o} />
            ))}
          </div>
        </section>
      )}
      <p className="mt-10">
        <Link to={href(categoryPath(slug))} className="text-[color:var(--brass)] underline">
          {T.guide.viewAllInCategory(content.nameHi)}
        </Link>
      </p>
    </main>
  );
}
