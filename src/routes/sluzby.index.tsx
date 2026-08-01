import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n, getI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";
import { pathLang } from "@/lib/route-lang";
import { pageHead } from "@/lib/page-head";
import { SITE, SERVICES_PATH } from "@/lib/site";
import { LANG_LOCALE } from "@/lib/lang";
import { getCategoryPageData } from "@/lib/category-page.functions";
import { isProductIndexable } from "@/lib/index-policy";
import { pickRandomUniqueBrandOffers } from "@/lib/services/pick-random-offers";
import { ProductCard } from "@/components/ProductCard";
import { categoryPath } from "@/lib/category-path";

export const Route = createFileRoute("/sluzby/")({
  loader: async () => {
    const data = await getCategoryPageData({ data: { slug: "hubnuti" } });
    const offers = (data.offers ?? []).filter(isProductIndexable);
    return { featuredOffers: pickRandomUniqueBrandOffers(offers, 8) };
  },
  head: ({ match }) => {
    const { lang } = pathLang(match.pathname);
    const T = getI18n(lang);
    const title = T.services.hubMetaTitle(T.siteName);
    const description = T.services.hubMetaDesc;
    return pageHead({
      path: SERVICES_PATH,
      title,
      description,
      lang,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: T.services.hubTitle,
            description,
            url: `${SITE.url}${SERVICES_PATH}`,
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
              { "@type": "ListItem", position: 1, name: T.product.crumbHome, item: `${SITE.url}/` },
              {
                "@type": "ListItem",
                position: 2,
                name: T.services.breadcrumb,
                item: `${SITE.url}${SERVICES_PATH}`,
              },
            ],
          }),
        },
      ],
    });
  },
  component: ServicesHubPage,
});

function ServicesHubPage() {
  const T = useI18n();
  const S = T.services;
  const href = useHref();
  const Seo = S.hubSeo;
  const { featuredOffers } = Route.useLoaderData();

  const tools = [
    {
      path: `${SERVICES_PATH}/kaloricka-kalkulacka`,
      name: S.tools.calories.name,
      desc: S.tools.calories.desc,
      cta: S.tools.calories.cta,
    },
    {
      path: `${SERVICES_PATH}/personalni-pomocnik`,
      name: S.tools.quiz.name,
      desc: S.tools.quiz.desc,
      cta: S.tools.quiz.cta,
    },
    {
      path: `${SERVICES_PATH}/vodni-bilance`,
      name: S.tools.water.name,
      desc: S.tools.water.desc,
      cta: S.tools.water.cta,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 md:px-6 md:py-16">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link to={href("/")} className="hover:text-foreground">
          {T.product.crumbHome}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{S.breadcrumb}</span>
      </nav>

      <header className="mb-12 max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cta">
          {S.hubEyebrow}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground md:text-5xl text-balance">
          {S.hubTitle}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
          {S.hubLead}
        </p>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
          {S.hubLead2}
        </p>
      </header>

      <section>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {S.toolsSectionH}
        </h2>

        <div className="mt-6 hidden overflow-x-auto rounded-[10px] border border-border sm:block">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-stone text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nástroj</th>
                <th className="px-4 py-3">Popis</th>
                <th className="px-4 py-3">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {tools.map((tool) => (
                <tr key={tool.path}>
                  <td className="px-4 py-4 align-top font-display text-base font-semibold text-foreground">
                    {tool.name}
                  </td>
                  <td className="px-4 py-4 align-top leading-relaxed text-muted-foreground">
                    {tool.desc}
                  </td>
                  <td className="px-4 py-4 align-top whitespace-nowrap">
                    <Link
                      to={href(tool.path)}
                      className="inline-flex rounded-[10px] bg-cta px-3.5 py-2 text-sm font-semibold text-cta-foreground transition-transform hover:-translate-y-0.5"
                    >
                      {tool.cta}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-5 grid gap-4 sm:hidden">
          {tools.map((tool) => (
            <li key={tool.path}>
              <Link
                to={href(tool.path)}
                className="group flex h-full flex-col rounded-[10px] border border-border bg-card p-5 transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-lift"
              >
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground group-hover:text-cta">
                  {tool.name}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {tool.desc}
                </p>
                <span className="cta-underline mt-4 text-sm font-semibold text-cta">
                  {tool.cta}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 max-w-3xl border-t border-border pt-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {Seo.h}
        </h2>
        <p className="mt-5 text-base leading-relaxed text-prose">{Seo.p1}</p>
        <p className="mt-4 text-base leading-relaxed text-prose">{Seo.p2}</p>

        <aside className="mt-6 rounded-[10px] border border-border bg-stone px-5 py-4 text-sm leading-relaxed text-foreground md:px-6 md:py-5">
          <p>
            <strong className="text-foreground">{Seo.tipLabel}</strong> {Seo.tipBefore}
            <Link
              to={href(categoryPath("hubnuti"))}
              className="cta-underline font-semibold text-cta"
            >
              {Seo.tipLink}
            </Link>
            {Seo.tipAfter}
          </p>
        </aside>

        <p className="mt-5 text-base leading-relaxed text-prose">{Seo.p3}</p>
      </section>

      {featuredOffers.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {S.hubProductsTitle}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredOffers.map((offer) => (
              <ProductCard key={offer.slug} offer={offer} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 rounded-[10px] border border-border bg-stone px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        {S.disclaimer}
      </p>
    </div>
  );
}
