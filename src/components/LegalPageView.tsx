import { Link } from "@tanstack/react-router";
import type { LegalPage } from "@/lib/legal.cs";
import type { Lang } from "@/lib/lang";
import { useI18n, getI18n } from "@/lib/i18n";
import { pageHead } from "@/lib/page-head";
import { useHref } from "@/lib/lang-link";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

export function LegalPageView({ page }: { page: LegalPage }) {
  const T = useI18n();
  const href = useHref();
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to={href("/")} className="hover:text-foreground">
          {T.product.crumbHome}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{page.breadcrumb ?? page.title}</span>
      </nav>
      <header className="mb-10">
        <h1 className="font-display text-4xl text-foreground md:text-5xl text-balance">
          {page.title}
        </h1>
        {page.introParagraphs && page.introParagraphs.length > 0 ? (
          page.introParagraphs.map((html, i) => (
            <p
              key={i}
              className="mt-4 text-lg leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ))
        ) : page.introHtml ? (
          <p
            className="mt-4 text-lg leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: page.intro }}
          />
        ) : (
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {page.intro}
          </p>
        )}
      </header>

      <article className="space-y-8">
        {page.sections.map((s) => {
          const paras =
            s.paragraphs && s.paragraphs.length > 0
              ? s.paragraphs
              : s.body
                ? [s.body]
                : [];
          const rich = Boolean(s.paragraphs?.length || s.bullets?.length || s.after);
          return (
            <section key={s.heading}>
              <h2 className="font-display text-2xl text-foreground">{s.heading}</h2>
              {paras.map((html, i) =>
                rich ? (
                  <p
                    key={i}
                    className="mt-2 text-base leading-relaxed text-muted-foreground [&_a]:text-cta [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ) : (
                  <p
                    key={i}
                    className="mt-2 whitespace-pre-line text-base leading-relaxed text-muted-foreground"
                  >
                    {html}
                  </p>
                ),
              )}
              {s.bullets && s.bullets.length > 0 && (
                s.ordered ? (
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-base leading-relaxed text-muted-foreground [&_a]:text-cta [&_a]:underline">
                    {s.bullets.map((item, i) => (
                      <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                    ))}
                  </ol>
                ) : (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground [&_a]:text-cta [&_a]:underline">
                    {s.bullets.map((item, i) => (
                      <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                    ))}
                  </ul>
                )
              )}
              {s.after && (
                <p
                  className="mt-3 text-base leading-relaxed text-muted-foreground [&_a]:text-cta [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: s.after }}
                />
              )}
            </section>
          );
        })}
      </article>

      {page.faqGroups && page.faqGroups.length > 0
        ? page.faqGroups.map((group) => (
            <section key={group.heading} className="mt-12 space-y-3">
              <h2 className="font-display text-2xl text-foreground">{group.heading}</h2>
              {group.items.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-xl border border-border/60 bg-card p-5"
                >
                  <summary className="cursor-pointer list-none font-medium text-foreground">
                    {f.q}
                  </summary>
                  <p
                    className="mt-3 text-sm leading-relaxed text-muted-foreground [&_a]:text-cta [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: f.a }}
                  />
                </details>
              ))}
            </section>
          ))
        : null}

      {page.faq && page.faq.length > 0 && (
        <section className="mt-12 space-y-3">
          {page.faqHeading ? (
            <h2 className="font-display text-2xl text-foreground">{page.faqHeading}</h2>
          ) : null}
          {page.faq.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-border/60 bg-card p-5"
            >
              <summary className="cursor-pointer list-none font-medium text-foreground">
                {f.q}
              </summary>
              <p
                className="mt-3 text-sm leading-relaxed text-muted-foreground [&_a]:text-cta [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: f.a }}
              />
            </details>
          ))}
        </section>
      )}
    </div>
  );
}

function faqEntities(page: LegalPage) {
  const items =
    page.faqGroups && page.faqGroups.length > 0
      ? page.faqGroups.flatMap((g) => g.items)
      : (page.faq ?? []);
  return items;
}

export function legalHead(page: LegalPage, hiPath: string, lang: Lang) {
  const T = getI18n(lang);
  const title = page.metaTitle ?? `${page.title} — ${T.siteName}`;
  const desc = (page.metaDescription ?? stripHtml(page.intro)).slice(0, 200);
  const faqs = faqEntities(page);
  return pageHead({
    path: hiPath,
    title,
    description: desc,
    lang,
    ...(faqs.length > 0
      ? {
          scripts: [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faqs.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: stripHtml(f.a) },
                })),
              }),
            },
          ],
        }
      : {}),
  });
}
