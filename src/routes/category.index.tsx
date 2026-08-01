import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCategories, getOffers } from "@/lib/offers.functions";
import { localizeCategory } from "@/lib/category-display-name";
import { useI18n, getI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";
import { pathLang } from "@/lib/route-lang";
import { pageHead } from "@/lib/page-head";
import { SITE } from "@/lib/site";
import { useLang, LANG_LOCALE } from "@/lib/lang";
import { indexableOffersByCategory } from "@/lib/index-policy";
import { categoryPath } from "@/lib/category-path";

const catsQO = queryOptions({
  queryKey: ["categories-all"],
  queryFn: () => getCategories(),
  staleTime: 5 * 60 * 1000,
});
const offersQO = queryOptions({
  queryKey: ["offers-all"],
  queryFn: () => getOffers(),
  staleTime: 5 * 60 * 1000,
  gcTime: 5 * 60 * 1000,
});

export const Route = createFileRoute("/category/")({
  loader: async ({ context }) => {
    const [{ categories }, { offers }] = await Promise.all([getCategories(), getOffers()]);
    context.queryClient.setQueryData(catsQO.queryKey, { categories });
    context.queryClient.setQueryData(offersQO.queryKey, { offers });
    const indexableByCategory = indexableOffersByCategory(offers);
    const visibleCategories = categories
      .filter((c) => (indexableByCategory.get(c.slug) ?? 0) > 0)
      .map((c) => ({ slug: c.slug, name: c.name }));
    return { categories: visibleCategories };
  },
  head: ({ match, loaderData }) => {
    const { lang } = pathLang(match.pathname);
    const T = getI18n(lang);
    const title = T.category.allTitle(T.siteName);
    const desc = T.category.allDesc(T.siteName);
    const url = `${SITE.url}/category`;
    const categories = loaderData?.categories ?? [];
    return pageHead({
      path: "/category",
      title,
      description: desc,
      lang,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: T.category.allHeading,
            description: desc,
            url,
            inLanguage: LANG_LOCALE[lang],
            isPartOf: { "@type": "WebSite", name: T.siteName, url: SITE.url },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: categories.length,
              itemListElement: categories.slice(0, 30).map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${SITE.url}${categoryPath(c.slug)}`,
                name: c.name,
              })),
            },
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
                name: T.category.allHeading,
                item: url,
              },
            ],
          }),
        },
      ],
    });
  },
  component: CategoriesIndex,
});

function CategoriesIndex() {
  const T = useI18n();
  const href = useHref();
  const lang = useLang();
  const { data: catData } = useSuspenseQuery(catsQO);
  const { data: offerData } = useSuspenseQuery(offersQO);
  const indexableByCategory = indexableOffersByCategory(offerData?.offers ?? []);
  const categories = (catData?.categories ?? [])
    .filter((c) => (indexableByCategory.get(c.slug) ?? 0) > 0)
    .map((c) => localizeCategory(c, lang));

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-6 md:py-16">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to={href("/")} className="hover:text-foreground">{T.product.crumbHome}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{T.category.allHeading}</span>
      </nav>
      <header className="mb-10 max-w-3xl">
        <h1 className="font-display text-4xl text-foreground md:text-5xl text-balance">
          {T.category.allHeading}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {T.category.allLead(SITE.name)}
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Link
            key={c.slug}
            to={href(categoryPath(c.slug))}
            className="group rounded-2xl border border-border/60 bg-card p-5 transition hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
          >
            <div className="font-display text-xl text-foreground group-hover:text-primary">
              {c.name}
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {c.description}
            </p>
          </Link>
        ))}
      </div>

      <section className="mt-16 border-t border-border pt-12 md:mt-20 md:pt-16">
        <article className="editorial-prose mx-auto max-w-3xl">
          <p dangerouslySetInnerHTML={{ __html: T.category.seoContent.intro }} />
          {T.category.seoContent.sections.map((section) => (
            <section key={section.h}>
              <h2>{section.h}</h2>
              {section.paragraphs.map((html, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: html }} />
              ))}
            </section>
          ))}
          <p>
            <em>{T.category.seoContent.disclaimer}</em>
          </p>
        </article>
      </section>
    </div>
  );
}
