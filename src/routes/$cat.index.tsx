import { createFileRoute, Link, redirect, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCategoryPageData } from "@/lib/category-page.functions";
import { ProductCard } from "@/components/ProductCard";
import { getCategoryContentByLang } from "@/lib/content";
import { localizeCategory } from "@/lib/category-display-name";
import { buildCategoryHubEditorial } from "@/lib/category-content";
import { useI18n, getI18n } from "@/lib/i18n";
import { useLang, LANG_LOCALE } from "@/lib/lang";
import { useHref } from "@/lib/lang-link";
import { pathLang } from "@/lib/route-lang";
import { pageHead, notFoundHead } from "@/lib/page-head";
import { SITE, GUIDE_PATH } from "@/lib/site";
import { MARKET_CURRENCY } from "@/lib/market";

import { isCategoryIndexable, isProductIndexable, robotsNoindexMeta } from "@/lib/index-policy";
import { categorySlugRedirectTarget } from "@/lib/category-slug-redirects";
import { categoryPath } from "@/lib/category-path";
import { buildCategoryHeadMeta, categoryGridHeadline } from "@/lib/category-page-meta";
import { productImage } from "@/lib/image-proxy";
import { offerDisplayTitle } from "@/lib/offer-display";
import { WeightToolsPromo } from "@/components/services/WeightToolsPromo";
import { isWeightToolsCategory } from "@/lib/services/weight-tools";
import { DoctorReviewedBadge } from "@/components/DoctorReviewedBadge";
import { isYmylCategory } from "@/lib/niche-types";

const CATEGORY_STALE_MS = 5 * 60 * 1000;

const categoryPageQO = (slug: string) =>
  queryOptions({
    queryKey: ["category-page", slug],
    queryFn: () => getCategoryPageData({ data: { slug } }),
    staleTime: CATEGORY_STALE_MS,
  });

export const Route = createFileRoute("/$cat/")({
  loader: async ({ context, params }) => {
    const redirectSlug = categorySlugRedirectTarget(params.cat);
    if (redirectSlug) {
      throw redirect({
        to: "/$cat/",
        params: { cat: redirectSlug },
        replace: true,
        statusCode: 301,
      });
    }
    const data = await getCategoryPageData({ data: { slug: params.cat } });
    context.queryClient.setQueryData(categoryPageQO(params.cat).queryKey, data);
    context.queryClient.setQueryData(["categories-all"], { categories: data.allCategories });
    return { category: data.category, offers: data.offers };
  },
  head: ({ params, loaderData, match }) => {
    const hiPath = categoryPath(params.cat);
    if (!loaderData?.category) return notFoundHead(hiPath);

    const { lang } = pathLang(match.pathname);
    const T = getI18n(lang);
    const offers = loaderData.offers ?? [];
    const visible = offers.filter(isProductIndexable);
    const content = getCategoryContentByLang(params.cat, lang);
    const {
      title,
      description: desc,
      name,
      h1,
    } = buildCategoryHeadMeta({
      slug: params.cat,
      offers,
      lang,
    });
    const count = visible.length;
    const prices = visible.map((o) => o.priceEUR).filter((p): p is number => !!p && p > 0);
    const minP = prices.length ? Math.min(...prices) : null;
    const maxP = prices.length ? Math.max(...prices) : null;
    const firstOffer = visible.find((o) => !!o.image) ?? null;
    const url = `${SITE.url}${hiPath}`;

    // og:image — feed URL from first offer in category.
    let absImg: string | null = null;
    if (firstOffer) {
      const proxied = productImage(firstOffer);
      if (proxied) absImg = proxied.startsWith("http") ? proxied : `${SITE.url}${proxied}`;
    }

    const robots = robotsNoindexMeta(isCategoryIndexable(count));

    const itemList: Record<string, unknown> = {
      "@type": "ItemList",
      numberOfItems: count,
      itemListElement: visible.slice(0, 20).map((o, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE.url}/${o.categorySlug}/${o.slug}`,
        name: offerDisplayTitle(o),
      })),
    };
    if (minP && maxP) {
      itemList.offers = {
        "@type": "AggregateOffer",
        priceCurrency: MARKET_CURRENCY,
        lowPrice: minP,
        highPrice: maxP,
        offerCount: count,
        availability: "https://schema.org/InStock",
      };
    }

    return pageHead({
      path: hiPath,
      title,
      description: desc,
      lang,
      image: absImg,
      robots: robots?.content ?? null,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: h1 || name,
            headline: h1 || name,
            description: desc,
            url,
            inLanguage: LANG_LOCALE[lang],
            isPartOf: { "@type": "WebSite", name: T.siteName, url: SITE.url },
            mainEntity: itemList,
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
              { "@type": "ListItem", position: 3, name, item: url },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            inLanguage: LANG_LOCALE[lang],
            mainEntity: content.categoryFaqHi.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        },
      ],
    });
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { cat: slug } = useParams({ strict: false }) as { cat: string };
  const lang = useLang();
  const T = useI18n();
  const href = useHref();
  const { data } = useSuspenseQuery(categoryPageQO(slug));
  const { category: rawCategory, offers: allOffers, allCategories } = data;
  const offers = allOffers.filter(isProductIndexable);
  const category = localizeCategory(rawCategory, lang);
  const content = getCategoryContentByLang(slug, lang);
  const otherCategories = (allCategories ?? [])
    .filter((c) => c.slug !== slug)
    .slice(0, 8)
    .map((c) => localizeCategory(c, lang));

  const editorial = useMemo(
    () => buildCategoryHubEditorial(slug, offers, lang),
    [slug, offers, lang],
  );
  const headMeta = useMemo(
    () => buildCategoryHeadMeta({ slug, offers: allOffers, lang }),
    [slug, allOffers, lang],
  );
  const gridH2 = useMemo(() => categoryGridHeadline(slug, lang), [slug, lang]);

  const codBadge = T.category.codBadge;
  const otherCatsTitle = T.category.otherCategories;
  const otherCatsLead = T.category.otherCategoriesLead;

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-6 md:py-16">
      <nav aria-label="breadcrumb" className="mb-8 text-sm text-muted-foreground">
        <Link to={href("/")} className="hover:text-foreground">
          {T.product.crumbHome}
        </Link>
        <span className="mx-2">/</span>
        <Link to={href("/category")} className="hover:text-foreground">
          {T.category.allCategoriesCrumb}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      <header className="mb-14 max-w-3xl border-b border-border pb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cta">
          {T.category.crumb}
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-foreground md:text-6xl text-balance">
          {headMeta.h1}
        </h1>
        {isYmylCategory(slug) && (
          <div className="mt-4">
            <DoctorReviewedBadge />
          </div>
        )}
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{content.taglineHi}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          {T.category.productsAvailable(offers.length)}
          <span className="mx-2 text-border">·</span>
          {codBadge}
        </p>
        <p className="mt-3 text-sm">
          <Link to={href(`${GUIDE_PATH}/${slug}`)} className="cta-underline font-semibold text-cta">
            {T.category.buyingGuideLink(category.name)}
          </Link>
        </p>
        {isWeightToolsCategory(slug) && <WeightToolsPromo variant="category" />}
      </header>

      {offers.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-muted-foreground">
          {T.category.empty}
        </div>
      ) : (
        <>
          <h2 className="mb-6 font-display text-2xl text-foreground md:text-3xl">{gridH2}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {offers.map((o) => (
              <ProductCard key={o.id} offer={o} />
            ))}
          </div>
        </>
      )}

      <section className="mx-auto mt-20 max-w-4xl">
        {content.serpLedHub ? null : (
          <h2 className="font-display text-3xl text-foreground md:text-4xl">
            {T.category.aboutCat}
          </h2>
        )}
        <div
          className={`editorial-prose max-w-none ${content.serpLedHub ? "mt-0" : "mt-4"}`}
          dangerouslySetInnerHTML={{ __html: editorial.introHtml }}
        />
        {editorial.comparisonHtml ? (
          <div
            className="editorial-prose mt-10 max-w-none"
            dangerouslySetInnerHTML={{ __html: editorial.comparisonHtml }}
          />
        ) : null}
      </section>

      <section className="mx-auto mt-16 max-w-4xl">
        <h2 className="font-display text-3xl text-foreground md:text-4xl">{T.category.faqH}</h2>
        <div className="mt-6 space-y-3">
          {content.categoryFaqHi.map((f) => (
            <details key={f.q} className="group rounded-xl border border-border/60 bg-card p-5">
              <summary className="cursor-pointer list-none font-medium text-foreground">
                {f.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {otherCategories.length > 0 && (
        <section className="mx-auto mt-20 max-w-5xl">
          <h2 className="font-display text-2xl text-foreground md:text-3xl">{otherCatsTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{otherCatsLead}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {otherCategories.map((c) => (
              <Link
                key={c.slug}
                to={href(categoryPath(c.slug))}
                className="group rounded-xl border border-border/60 bg-card p-4 transition hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
              >
                <div className="font-display text-base text-foreground group-hover:text-primary">
                  {c.name}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {T.category.productsAvailable(c.count)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
