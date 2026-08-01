import type { Offer } from "@/lib/types";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCityPageData } from "@/lib/city-page.functions";
import {
  getCityBySlug,
  siblingCities,
  cityPath,
  type CityPage,
} from "@/lib/cities.cs";
import { ProductCard } from "@/components/ProductCard";
import { localizeCategory } from "@/lib/category-display-name";
import { categoryPath } from "@/lib/category-path";
import { useI18n, getI18n } from "@/lib/i18n";
import { useLang, LANG_LOCALE, type Lang } from "@/lib/lang";
import { useHref } from "@/lib/lang-link";
import { pathLang } from "@/lib/route-lang";
import { pageHead, notFoundHead } from "@/lib/page-head";
import { offerDisplayTitle } from "@/lib/offer-display";
import { SITE } from "@/lib/site";

const CITY_STALE_MS = 60 * 60 * 1000;

const cityPageQO = queryOptions({
  queryKey: ["city-page"],
  queryFn: () => getCityPageData(),
  staleTime: CITY_STALE_MS,
  gcTime: 30 * 60 * 1000,
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

function cityJsonLd(city: CityPage, products: Offer[], lang: Lang) {
  const T = getI18n(lang);
  const path = cityPath(city.slug);
  const url = `${SITE.url}${path}`;
  const locale = LANG_LOCALE[lang];

  const breadcrumb = {
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
        name: T.doruceni.crumb,
        item: `${SITE.url}/delivery`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: city.name,
        item: url,
      },
    ],
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: city.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: stripHtml(f.a) },
    })),
  };

  const itemList =
    products.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: city.productsH,
          inLanguage: locale,
          itemListElement: products.map((o, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE.url}/${o.categorySlug}/${o.slug}`,
            name: offerDisplayTitle(o),
          })),
        }
      : null;

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: city.h1,
    description: city.metaDescription,
    url,
    inLanguage: locale,
    isPartOf: { "@type": "WebSite", name: T.siteName, url: SITE.url },
    about: {
      "@type": "Service",
      name: `Doručení na dobírku — ${city.name}`,
      serviceType: "Courier delivery with cash on delivery",
      provider: { "@type": "Organization", name: T.siteName, url: SITE.url },
      areaServed: {
        "@type": "City",
        name: city.name,
        containedInPlace: { "@type": "Country", name: "Czech Republic" },
      },
    },
  };

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE.url}/#localbusiness`,
    name: SITE.name,
    url: SITE.url,
    email: SITE.email,
    telephone: SITE.phoneDisplay,
    image: `${SITE.url}/og-image.jpg`,
    priceRange: "Kč",
    openingHours: "Mo-Sa 09:00-20:00",
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.line2,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.state,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.country,
    },
    areaServed: [
      { "@type": "Country", name: "Czech Republic" },
      {
        "@type": "City",
        name: city.name,
        containedInPlace: { "@type": "Country", name: "Czech Republic" },
      },
    ],
  };

  return [breadcrumb, faq, webPage, localBusiness, ...(itemList ? [itemList] : [])];
}

export const Route = createFileRoute("/delivery/$slug")({
  loader: async ({ params, context }) => {
    const city = getCityBySlug(params.slug);
    if (!city) throw notFound();
    const data = await getCityPageData();
    context.queryClient.setQueryData(cityPageQO.queryKey, data);
    return { city, ...data };
  },
  head: ({ params, loaderData, match }) => {
    const path = `/delivery/${params.slug}`;
    const city = loaderData?.city ?? getCityBySlug(params.slug);
    if (!city) return notFoundHead(path);

    const { lang } = pathLang(match.pathname);
    const products = loaderData?.products ?? [];
    return pageHead({
      path,
      title: city.metaTitle,
      description: city.metaDescription,
      lang,
      scripts: cityJsonLd(city, products, lang).map((block) => ({
        type: "application/ld+json",
        children: JSON.stringify(block),
      })),
    });
  },
  component: CityDeliveryPage,
});

function CityDeliveryPage() {
  const T = useI18n();
  const lang = useLang();
  const href = useHref();
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(cityPageQO);
  const city = getCityBySlug(slug);
  if (!city) return null;

  const categories = (data.categories ?? []).map((c) => localizeCategory(c, lang));
  const products = data.products ?? [];
  const siblings = siblingCities(city.slug);

  return (
    <div>
      <div className="mx-auto max-w-7xl px-5 pt-8 md:px-8">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to={href("/")} className="hover:text-foreground">
            {T.product.crumbHome}
          </Link>
          <span className="mx-2">/</span>
          <Link to={href("/delivery")} className="hover:text-foreground">
            {T.doruceni.crumb}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{city.name}</span>
        </nav>
      </div>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <h1 className="max-w-3xl font-display text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
            {city.h1}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/75">
            {city.lead}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href="#kategorie"
              className="inline-flex rounded-xl bg-cta px-5 py-3 text-sm font-semibold text-cta-foreground transition-opacity hover:opacity-90"
            >
              {T.doruceni.ctaCategories}
            </a>
            <a
              href="/delivery#pravidla"
              className="text-sm font-semibold text-primary-foreground/85 underline-offset-4 hover:underline"
            >
              {T.doruceni.ctaHow}
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-border/70 bg-stone">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-16">
          <p className="section-kicker">{T.doruceni.etaKicker}</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {city.etaNote}
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {city.etaPoints.map((p) => (
              <div key={p.t} className="surface-panel px-6 py-6">
                <h2 className="font-display text-xl font-semibold tracking-[-0.03em] text-primary">
                  {p.t}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="kategorie" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <p className="section-kicker">{T.doruceni.categoriesKicker}</p>
        <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-primary md:text-5xl">
          {T.doruceni.categoriesH}
        </h2>
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                to={href(categoryPath(c.slug))}
                className="group soft-ring flex h-full flex-col justify-between rounded-[20px] border border-border/70 bg-card px-4 py-4 transition-colors hover:border-primary/30 hover:bg-white"
              >
                <span className="font-display text-base font-semibold leading-snug tracking-[-0.03em] text-primary transition-colors group-hover:text-cta md:text-lg">
                  {c.name}
                </span>
                <span
                  aria-hidden
                  className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-cta opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ↗
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {products.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <p className="section-kicker">{T.doruceni.productsKicker}</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-primary md:text-5xl">
            {city.productsH}
          </h2>
          <div className="catalog-grid mt-12 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((o) => (
              <ProductCard key={o.id} offer={o} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <p className="section-kicker">{T.doruceni.faqKicker}</p>
        <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-primary md:text-5xl">
          {T.doruceni.faqH}
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {city.faq.map((f) => (
            <details key={f.q} className="group surface-panel px-6 py-5">
              <summary className="cursor-pointer list-none font-display text-lg font-semibold text-primary marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-4">
                  {f.q}
                  <span className="mt-1 text-cta transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 pr-8 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t border-border/70 bg-stone">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-16">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-primary">
            {T.doruceni.siblingsH}
          </h2>
          <p className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-sm text-muted-foreground">
            {siblings.map((c, i) => (
              <span key={c.slug} className="inline-flex items-center gap-3">
                {i > 0 && <span aria-hidden className="text-border">·</span>}
                <Link
                  to={href("/delivery/$slug", { slug: c.slug })}
                  className="font-medium text-foreground hover:text-cta"
                >
                  {c.name}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </section>
    </div>
  );
}
