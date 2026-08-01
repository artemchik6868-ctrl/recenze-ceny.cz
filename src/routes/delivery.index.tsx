import { createFileRoute, Link } from "@tanstack/react-router";
import { CITIES, cityPath } from "@/lib/cities.cs";
import { getLegalByLang } from "@/lib/legal";
import { useI18n, getI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";
import { pathLang } from "@/lib/route-lang";
import { pageHead } from "@/lib/page-head";
import { useLang, LANG_LOCALE, DEFAULT_LANG } from "@/lib/lang";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/delivery/")({
  head: ({ match }) => {
    const { lang } = pathLang(match.pathname);
    const T = getI18n(lang);
    const url = `${SITE.url}/delivery`;
    return pageHead({
      path: "/delivery",
      title: T.doruceni.hubMetaTitle,
      description: T.doruceni.hubMetaDesc,
      lang,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: T.doruceni.hubTitle,
            description: T.doruceni.hubMetaDesc,
            url,
            inLanguage: LANG_LOCALE[lang],
            isPartOf: { "@type": "WebSite", name: T.siteName, url: SITE.url },
            about: {
              "@type": "Service",
              name: "Doručení kurýrem na dobírku",
              areaServed: { "@type": "Country", name: "Czech Republic" },
              provider: { "@type": "Organization", name: T.siteName, url: SITE.url },
            },
            mainEntity: {
              "@type": "ItemList",
              name: T.doruceni.citiesH,
              numberOfItems: CITIES.length,
              itemListElement: CITIES.map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${SITE.url}${cityPath(c.slug)}`,
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
                name: T.doruceni.crumb,
                item: url,
              },
            ],
          }),
        },
      ],
    });
  },
  component: DeliveryIndex,
});

function DeliveryIndex() {
  const T = useI18n();
  const href = useHref();
  const lang = useLang();
  const page = getLegalByLang("delivery", lang ?? DEFAULT_LANG);
  const ruleSections = page?.sections ?? [];

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-6 md:py-16">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to={href("/")} className="hover:text-foreground">
          {T.product.crumbHome}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{T.doruceni.crumb}</span>
      </nav>

      <header className="mb-12 max-w-3xl">
        <h1 className="font-display text-4xl text-foreground md:text-5xl text-balance">
          {T.doruceni.hubTitle}
        </h1>
        {page?.introParagraphs?.length ? (
          page.introParagraphs.map((html, i) => (
            <p
              key={i}
              className="mt-4 text-lg leading-relaxed text-muted-foreground [&_strong]:text-foreground"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ))
        ) : (
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {T.doruceni.hubLead}
          </p>
        )}
        <a
          href="#mesta"
          className="cta-underline mt-4 inline-block text-sm font-semibold text-cta"
        >
          {T.doruceni.jumpCities}
        </a>
      </header>

      <section id="pravidla" className="scroll-mt-24">
        <p className="section-kicker">{T.doruceni.rulesKicker}</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-primary md:text-4xl">
          {T.doruceni.rulesH}
        </h2>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {ruleSections.map((s) => {
            const paras =
              s.paragraphs && s.paragraphs.length > 0
                ? s.paragraphs
                : s.body
                  ? [s.body]
                  : [];
            return (
              <article key={s.heading} className="surface-panel px-6 py-6">
                <h3 className="font-display text-xl font-semibold tracking-[-0.03em] text-foreground">
                  {s.heading}
                </h3>
                {paras.map((html, i) => (
                  <p
                    key={i}
                    className="mt-3 text-sm leading-relaxed text-muted-foreground [&_a]:text-cta [&_a]:underline [&_strong]:text-foreground"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ))}
                {s.bullets && s.bullets.length > 0 && (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground [&_a]:text-cta [&_a]:underline [&_strong]:text-foreground">
                    {s.bullets.map((item, i) => (
                      <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section id="mesta" className="mt-20 scroll-mt-24">
        <p className="section-kicker">{T.doruceni.citiesKicker}</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-primary md:text-4xl">
          {T.doruceni.citiesH}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          {T.doruceni.citiesLead}
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CITIES.map((c) => (
            <li key={c.slug}>
              <Link
                to={href("/delivery/$slug", { slug: c.slug })}
                className="group soft-ring flex h-full flex-col justify-between rounded-[20px] border border-border/70 bg-card px-5 py-5 transition-colors hover:border-primary/30 hover:bg-white"
              >
                <span className="font-display text-xl font-semibold tracking-[-0.03em] text-primary transition-colors group-hover:text-cta">
                  {c.name}
                </span>
                <span className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {c.etaSummary}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
