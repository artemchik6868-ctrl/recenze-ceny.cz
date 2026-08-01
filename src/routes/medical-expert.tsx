import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n, getI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";
import { GUIDE_PATH, SITE } from "@/lib/site";
import expertPhoto from "@/assets/medical-expert.jpg";
import { expertPhotoAlt } from "@/lib/seo-alt";
import { useLang } from "@/lib/lang";
import { pageHead } from "@/lib/page-head";
import { getOffers } from "@/lib/offers.functions";
import { isProductIndexable } from "@/lib/index-policy";
import { pickRandomUniqueBrandOffers } from "@/lib/services/pick-random-offers";
import type { Offer } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { categoryPath } from "@/lib/category-path";

const EXPERIENCE_YEARS = 18;
const REVIEWED_PRODUCT_LIMIT = 6;

/** Live pool from preferred categories; fill from other indexable offers if needed. */
function pickReviewedOffers(offers: Offer[], preferredSlugs: readonly string[], limit = REVIEWED_PRODUCT_LIMIT): {
  reviewedOffers: Offer[];
  liveCategorySlugs: string[];
} {
  const preferred = new Set(preferredSlugs);
  const indexable = offers.filter(isProductIndexable);
  const fromPreferred = indexable.filter((o) => preferred.has(o.categorySlug));
  const liveCategorySlugs = [...new Set(fromPreferred.map((o) => o.categorySlug))];

  let reviewedOffers = pickRandomUniqueBrandOffers(fromPreferred, limit);
  if (reviewedOffers.length < limit) {
    const used = new Set(reviewedOffers.map((o) => o.id));
    const filler = pickRandomUniqueBrandOffers(
      indexable.filter((o) => !used.has(o.id)),
      limit - reviewedOffers.length,
    );
    reviewedOffers = [...reviewedOffers, ...filler];
  }

  return { reviewedOffers, liveCategorySlugs };
}

function buildHead(T: ReturnType<typeof getI18n>) {
  const M = T.medicalExpert;
  const titleTag = M.metaTitle(SITE.name);
  const desc = M.metaDesc(SITE.name, EXPERIENCE_YEARS);
  const canonical = "/medical-expert";
  return pageHead({
    path: canonical,
    title: titleTag,
    description: desc,
    type: "profile",
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: M.name,
          jobTitle: M.jobTitle,
          description: desc,
          worksFor: { "@type": "Organization", name: SITE.name, url: SITE.url },
          alumniOf: {
            "@type": "EducationalOrganization",
            name: M.credentialOrg,
          },
          address: {
            "@type": "PostalAddress",
            addressLocality: "Praha",
            addressCountry: SITE.address.country,
          },
          knowsAbout: M.knowsAbout,
          hasCredential: [
            {
              "@type": "EducationalOccupationalCredential",
              credentialCategory: M.credentialFamily,
              recognizedBy: { "@type": "Organization", name: M.credentialOrg },
            },
            {
              "@type": "EducationalOccupationalCredential",
              credentialCategory: M.credentialNutrition,
              recognizedBy: { "@type": "Organization", name: M.credentialOrg },
            },
          ],
          identifier: M.regNo,
          url: `${SITE.url}${canonical}`,
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: T.product.crumbHome, item: SITE.url },
            { "@type": "ListItem", position: 2, name: M.breadcrumb, item: `${SITE.url}${canonical}` },
          ],
        }),
      },
    ],
  });
}

export const Route = createFileRoute("/medical-expert")({
  loader: async () => {
    const { offers } = await getOffers();
    const preferredSlugs = getI18n("cs").medicalExpert.reviewedCategories.map((c) => c.slug);
    return pickReviewedOffers(offers, preferredSlugs);
  },
  head: () => buildHead(getI18n("cs")),
  component: MedicalExpertPage,
});

function MedicalExpertPage() {
  const T = useI18n();
  const lang = useLang();
  const M = T.medicalExpert;
  const href = useHref();
  const { reviewedOffers, liveCategorySlugs } = Route.useLoaderData();
  const liveCats = new Set(liveCategorySlugs);
  const reviewedCategories = M.reviewedCategories.filter((c) => liveCats.has(c.slug));
  const reviewedGuides = M.reviewedGuides.filter((g) => liveCats.has(g.slug));

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 md:px-6 md:py-16">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link to={href("/")} className="hover:text-foreground">
          {T.product.crumbHome}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{M.breadcrumb}</span>
      </nav>

      <header className="mb-10 flex flex-col items-start gap-6 rounded-2xl border border-border/60 border-l-[6px] border-l-primary bg-card p-6 md:flex-row md:items-center md:p-8">
        <img
          src={expertPhoto}
          alt={expertPhotoAlt(lang, M.name, M.title)}
          width={160}
          height={160}
          loading="eager"
          decoding="async"
          className="h-32 w-32 shrink-0 rounded-full object-cover ring-4 ring-primary/15 shadow-[var(--shadow-elevated)] md:h-36 md:w-36"
        />
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {M.eyebrow}
          </div>
          <h1 className="mt-2 font-display text-3xl text-foreground md:text-4xl">
            {M.name}
            <span className="text-muted-foreground"> – {M.headlineRole}</span>
          </h1>
          <p className="mt-2 text-base font-medium text-primary">{M.subtitle(EXPERIENCE_YEARS)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {M.badges.map((badge) => (
              <span
                key={badge}
                className="inline-block rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="prose-lg">
        <p className="text-base leading-relaxed text-foreground">{M.bio(SITE.name)}</p>
      </section>

      <section className="mt-10 rounded-2xl border border-border/60 bg-card p-6 md:p-8">
        <h2 className="font-display text-2xl text-foreground">{M.roleH}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{M.roleLead(SITE.name)}</p>
        <p className="mt-4 text-sm font-medium text-foreground">{M.roleIntro}</p>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-foreground">
          {M.roleItems.map((item) => (
            <li key={item.title}>
              <strong className="text-foreground">{item.title}:</strong> {item.body}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border border-border/60 bg-card p-6 md:p-8">
        <h2 className="font-display text-2xl text-foreground">{M.reviewProcessH}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {M.reviewProcessLead(SITE.name)}
        </p>
        <ul className="mt-5 space-y-3">
          {M.processSteps.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-xl border border-border/60 bg-stone px-4 py-3 pl-14"
            >
              <span className="absolute left-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <p className="text-sm font-semibold text-foreground">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border border-border/60 bg-card p-6 md:p-8">
        <h2 className="font-display text-2xl text-foreground">{M.principlesH}</h2>
        <aside className="mt-4 rounded-xl border border-[oklch(0.88_0.06_145)] bg-[oklch(0.97_0.04_145)] p-4 text-sm font-medium leading-relaxed text-[oklch(0.35_0.08_145)]">
          {M.principleHighlight}
        </aside>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-foreground">
          {M.principles.map((item) => (
            <li key={item.title}>
              <strong className="text-foreground">{item.title}:</strong> {item.body}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border border-border/60 bg-card p-6 md:p-8">
        <h2 className="font-display text-2xl text-foreground">{M.reviewedH}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{M.reviewedLead}</p>

        {reviewedCategories.length > 0 && (
          <>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {T.nav.categories}
            </h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {reviewedCategories.map((c) => (
                <li key={c.slug}>
                  <Link
                    to={href(categoryPath(c.slug))}
                    className="cta-underline text-sm font-semibold text-cta"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {reviewedGuides.length > 0 && (
          <>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {M.reviewedGuidesH}
            </h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {reviewedGuides.map((g) => (
                <li key={g.slug}>
                  <Link
                    to={href(`${GUIDE_PATH}/${g.slug}`)}
                    className="cta-underline text-sm font-semibold text-cta"
                  >
                    {g.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/60 pt-5">
          {M.reviewedMore.map((link) => (
            <li key={link.path}>
              <Link to={href(link.path)} className="cta-underline text-sm font-semibold text-cta">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {reviewedOffers.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl text-foreground">{M.reviewedProductsH}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {M.reviewedProductsLead}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviewedOffers.map((offer) => (
              <ProductCard key={offer.slug} offer={offer} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10 rounded-2xl border border-amber-200/80 border-l-[5px] border-l-amber-500 bg-amber-50/80 p-6 text-sm leading-relaxed md:p-8">
        <h2 className="font-display text-xl text-amber-900">{M.disclaimerH}</h2>
        <p className="mt-3 text-amber-950/80">{M.disclaimer}</p>
      </section>
    </div>
  );
}
