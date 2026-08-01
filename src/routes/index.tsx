import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getHomePageData } from "@/lib/home-page.functions";
import { ProductCard } from "@/components/ProductCard";
import { useI18n, getI18n } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { useHref } from "@/lib/lang-link";
import { SITE } from "@/lib/site";
import { localizeCategory } from "@/lib/category-display-name";
import { categoryPath } from "@/lib/category-path";
import { pathLang } from "@/lib/route-lang";
import { pageHead } from "@/lib/page-head";
import { LANG_LOCALE } from "@/lib/lang";
import { offerDisplayTitle } from "@/lib/offer-display";
import { CITIES } from "@/lib/cities.cs";

const HOME_STALE_MS = 60 * 60 * 1000;

const homePageQO = queryOptions({
  queryKey: ["home-page"],
  queryFn: () => getHomePageData(),
  staleTime: HOME_STALE_MS,
  gcTime: 30 * 60 * 1000,
});

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const data = await getHomePageData();
    context.queryClient.setQueryData(homePageQO.queryKey, data);
    return data;
  },
  pendingComponent: HomePageSkeleton,
  head: ({ loaderData, match }) => {
    const { lang } = pathLang(match.pathname);
    const T = getI18n(lang);
    const stats = loaderData?.stats;
    const n = stats?.productsCount ?? 100;
    const cats = stats?.categoriesCount ?? 12;
    const fromEUR = stats?.priceFromEUR ?? null;

    const title = `${T.home.metaTitleFn(n)} | ${T.siteName}`;
    const desc = T.home.metaDescFn(n, cats, fromEUR);

    const bestsellers = loaderData?.featured ?? [];

    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: LANG_LOCALE[lang],
      mainEntity: T.home.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };

    const itemListJsonLd = bestsellers.length
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: T.home.bestsellersH,
          inLanguage: LANG_LOCALE[lang],
          itemListElement: bestsellers.map((o, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE.url}/${o.categorySlug}/${o.slug}`,
            name: offerDisplayTitle(o),
          })),
        }
      : null;

    return pageHead({
      path: "/",
      title,
      description: desc,
      lang,
      scripts: [
        ...(itemListJsonLd
          ? [{ type: "application/ld+json", children: JSON.stringify(itemListJsonLd) }]
          : []),
        { type: "application/ld+json", children: JSON.stringify(faqJsonLd) },
      ],
    });
  },
  component: HomePage,
});

function HomePageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="min-h-[70vh] bg-[color:var(--primary)]" />
      <div className="mx-auto max-w-7xl space-y-4 px-5 py-16">
        <div className="h-8 w-64 rounded bg-muted" />
        <div className="h-24 w-full max-w-2xl rounded bg-muted" />
      </div>
    </div>
  );
}

function HomePage() {
  const T = useI18n();
  const lang = useLang();
  const href = useHref();
  const { data } = useSuspenseQuery(homePageQO);
  const { featured, categories: rawCategories, stats } = data;
  const categories = rawCategories.map((c) => localizeCategory(c, lang));

  return (
    <>
      {/* HERO — full-bleed brand plane */}
      <section className="relative isolate min-h-[min(88vh,52rem)] overflow-hidden bg-hero-aurora text-primary-foreground">
        <div
          className="pointer-events-none absolute inset-0 opacity-40 animate-ken-slow"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 80%, rgba(243,242,239,0.14) 0%, transparent 50%), radial-gradient(ellipse at 90% 10%, rgba(184,92,56,0.18) 0%, transparent 40%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto flex min-h-[min(88vh,52rem)] max-w-7xl flex-col justify-end px-5 pb-16 pt-24 md:px-8 md:pb-24 md:pt-32">
          <p className="animate-fade-up text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/65">
            {T.home.heroEyebrowFn(stats.categoriesCount)}
          </p>
          <h1
            lang="cs"
            className="mt-6 max-w-3xl text-balance font-display text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl lg:text-7xl"
          >
            {T.home.heroTitleFn(stats.productsCount)}
          </h1>
          <p
            className="animate-fade-up mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/80 md:text-lg"
            style={{ animationDelay: "140ms" }}
          >
            {T.home.heroLeadFn(stats.productsCount, stats.categoriesCount, stats.priceFromEUR)}
          </p>
          <div
            className="animate-fade-up mt-10 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "200ms" }}
          >
            <a
              href="#categories"
              className="inline-flex items-center rounded-[10px] bg-cta px-7 py-3.5 text-sm font-semibold text-cta-foreground shadow-cta transition-transform hover:-translate-y-0.5"
            >
              {T.home.browseCategories}
            </a>
            <a
              href="#featured"
              className="cta-underline text-sm font-semibold text-primary-foreground/90"
            >
              {T.home.bestsellers}
            </a>
          </div>
        </div>
      </section>

      {/* E-E-A-T early */}
      <section id="about" className="border-b border-border bg-stone">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-[1fr_1.1fr] md:px-8 md:py-24">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cta">
              {T.home.why}
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-primary md:text-5xl">
              {T.home.aboutTitle}
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              {T.home.aboutBody}
            </p>
          </div>
          <ul className="space-y-0 divide-y divide-border border-y border-border">
            {T.home.eat.items.map((item) => (
              <li key={item.t} className="py-6">
                <h3 className="font-display text-xl font-semibold text-primary">{item.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.b}</p>
                {item.link && (
                  <Link
                    to={href(item.link.href as "/medical-expert")}
                    className="cta-underline mt-3 inline-block text-sm font-semibold text-cta"
                  >
                    {item.link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CATEGORIES — typographic list */}
      <section id="categories" className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
        <div className="mb-10 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cta">
            {T.home.shopByNeed}
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-primary md:text-5xl">
            {T.home.categoriesH}
          </h2>
        </div>
        <ul className="divide-y divide-border border-y border-border">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                to={href(categoryPath(c.slug))}
                className="group flex flex-col gap-2 py-6 transition-colors sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
              >
                <div className="min-w-0">
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-primary transition-colors group-hover:text-cta md:text-3xl">
                    {c.name}
                  </h3>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">{c.description}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-muted-foreground group-hover:text-cta">
                  {c.count} · {T.home.explore}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* HOW IT WORKS — horizontal timeline */}
      <section className="border-y border-border bg-stone">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cta">
            {T.home.howSub}
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-primary md:text-5xl">
            {T.home.howH}
          </h2>
          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-0">
            {T.home.howSteps.map((s, i) => (
              <li
                key={s.n}
                className={`relative md:px-8 ${i > 0 ? "md:border-l md:border-border" : ""}`}
              >
                <span className="font-display text-sm font-semibold text-cta">{s.n}</span>
                <h3 className="mt-3 font-display text-xl font-semibold text-primary">{s.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FEATURED */}
      <section id="featured" className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
        <div className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cta">
            {T.home.curatedForItaly}
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-primary md:text-5xl">
            {T.home.bestsellersH}
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((o) => (
            <ProductCard key={o.id} offer={o} />
          ))}
        </div>
      </section>

      {/* COD / delivery cultural anchor */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/55">
            {T.home.deliveryEyebrow}
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-5xl">
            {T.home.codH}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/75">
            {T.home.codLead}
          </p>
          <div className="mt-12 grid gap-8 border-t border-primary-foreground/15 pt-10 md:grid-cols-3">
            {T.home.codPoints.map((p) => (
              <div key={p.t}>
                <h3 className="font-display text-lg font-semibold">{p.t}</h3>
                <p className="mt-2 text-sm text-primary-foreground/70">{p.b}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 text-sm text-primary-foreground/55">{T.home.citiesLead}</p>
          <p className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-sm font-medium text-primary-foreground/80">
            {CITIES.map((c, i) => (
              <span key={c.slug} className="inline-flex items-center gap-2">
                {i > 0 && <span aria-hidden>·</span>}
                <Link
                  to={href("/delivery/$slug", { slug: c.slug })}
                  className="underline-offset-4 hover:underline"
                >
                  {c.name}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* FAQ — stacked */}
      <section className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cta">FAQ</p>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-primary md:text-5xl">
          {T.home.faqH}
        </h2>
        <Link
          to={href("/faq")}
          className="cta-underline mt-4 inline-block text-sm font-semibold text-cta"
        >
          {T.home.faqViewAll}
        </Link>
        <div className="mt-10 divide-y divide-border border-y border-border">
          {T.home.faq.map((f) => (
            <details key={f.q} className="group py-5">
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

      {/* Testimonials — typographic, no gold stars */}
      <section className="border-t border-border bg-stone">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cta">
            {T.home.testimonialsRating}
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-primary md:text-5xl">
            {T.home.testimonialsH}
          </h2>
          <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-12">
            {T.home.testimonials.map((t) => (
              <figure key={t.name}>
                <blockquote className="font-display text-xl leading-snug text-primary md:text-2xl">
                  „{t.text}“
                </blockquote>
                <figcaption className="mt-6 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{t.name}</span>
                  <span className="mx-2 text-border">·</span>
                  {t.city}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* SEO copy — under catalog, before footer */}
      <section className="border-t border-border">
        <article className="editorial-prose mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-24">
          {T.home.seoContent.sections.map((section) => (
            <section key={section.h} className="first:[&>h2]:mt-0">
              <h2>{section.h}</h2>
              {section.paragraphs.map((html, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: html }} />
              ))}
            </section>
          ))}
        </article>
      </section>
    </>
  );
}
