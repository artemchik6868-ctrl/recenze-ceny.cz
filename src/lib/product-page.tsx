import { useRef, useState, useEffect } from "react";
import { Link, useParams, getRouteApi } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getOfferBySlug } from "@/lib/offers.functions";
import { getProductAIContent } from "@/lib/ai-content.functions";
import type { Offer } from "@/lib/types";
import { LazyLeadForm } from "@/components/LazyLeadForm";
import { LazyMobileChrome } from "@/components/LazyMobileChrome";
import { categoryDisplayName } from "@/lib/category-display-name";
import { categoryPath } from "@/lib/category-path";
import { useI18n, getI18n } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { useHref } from "@/lib/lang-link";
import { pathLang } from "@/lib/route-lang";
import { pageHead, notFoundHead } from "@/lib/page-head";
import { ReviewsSection } from "@/components/ReviewsSection";
import { RelatedProductsGrid } from "@/components/RelatedProductsGrid";
import { DeferredPromoModal } from "@/components/DeferredPromoModal";
import { pickReviewsFromStored, averageRating } from "@/lib/reviews";
import { OfferImage } from "@/components/OfferImage";
import {
  productImageLcp,
  ogImage,
  HERO_LAYOUT_SIZE,
  productPageNeedsNoReferrer,
} from "@/lib/image-proxy";
import { buildProductStructuredData } from "@/lib/product-structured-data";
import { csPlaceholderHtml } from "@/lib/ai-content.cs-fallbacks";
import { buildProductTitle, resolveProductMetaDescription } from "@/lib/seo-meta";
import {
  offerDisplayTitle,
  offerMetaBenefit,
  offerMetaTitle,
  productPageMetaDescription,
} from "@/lib/offer-display";
import { productHeroAlt } from "@/lib/seo-alt";
import { deliveryEta } from "@/lib/delivery-eta";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { ProductSpecs } from "@/components/ProductSpecs";
import { PRODUCT_CRITICAL_CSS } from "@/lib/product-critical-css";
import { varyDeliveryBlock } from "@/lib/pdp-html-variants";
import { isYmylCategory } from "@/lib/niche-types";
import { EXPERT_OPINION_SECTION_HEADING } from "@/lib/ai-content-pipeline.cs";
import { ProductExpertOpinion } from "@/components/ProductExpertOpinion";
import { WeightToolsPromo } from "@/components/services/WeightToolsPromo";
import { isWeightToolsCategory } from "@/lib/services/weight-tools";
import { isProductIndexable, robotsNoindexMeta } from "@/lib/index-policy";
import { ENABLE_AI_CONTENT, formatDisplayPrice, PDP_CONTENT_SLOT } from "@/lib/market";
import type { AIProductContent } from "@/lib/ai-content.server";
import { CITIES } from "@/lib/cities.cs";

export const offerQO = (slug: string) =>
  queryOptions({
    queryKey: ["offer-slug", slug],
    queryFn: () => getOfferBySlug({ data: { slug } }),
    staleTime: 5 * 60 * 1000,
  });

export const productAiQO = (offer: Pick<Offer, "id" | "source" | "categorySlug">) =>
  queryOptions({
    queryKey: ["product-ai", offer.source, offer.id, PDP_CONTENT_SLOT],
    queryFn: async () => {
      const { content } = await getProductAIContent({
        data: {
          offerId: offer.id,
          source: offer.source,
          categorySlug: offer.categorySlug,
          lang: PDP_CONTENT_SLOT,
          cacheOnly: true,
        },
      });
      return content;
    },
    staleTime: 5 * 60 * 1000,
  });

export function productHead({
  loaderData,
  pathname,
}: {
  loaderData: { offer: Offer; aiContent?: AIProductContent | null } | undefined;
  pathname: string;
}) {
  const { lang } = pathLang(pathname);
  const o = loaderData?.offer;
  if (!o) return notFoundHead(pathname);
  const hiPath = `/${o.categorySlug}/${o.slug}`;
  const cleanBrand = offerDisplayTitle(o);
  const aiTitle = offerMetaTitle(o);
  const title =
    aiTitle ??
    buildProductTitle(
      {
        brand: cleanBrand,
        feedBrand: o.brand,
        categorySlug: o.categorySlug,
        priceEUR: o.priceEUR,
        variantSeed: o.id,
      },
      lang,
    );
  const aiBenefit = offerMetaBenefit(o);
  const desc =
    productPageMetaDescription(loaderData?.aiContent?.meta_desc) ??
    resolveProductMetaDescription(
      {
        brand: cleanBrand,
        feedBrand: o.brand,
        categorySlug: o.categorySlug,
        priceEUR: o.priceEUR,
        aiBenefit,
        aiMetaDesc: aiBenefit,
        variantSeed: o.id,
      },
      lang,
    );
  const contentReady = Boolean(o.contentGeneratedAt);
  const heroSrc = productImageLcp(o);
  const noReferrer = productPageNeedsNoReferrer(o);
  const ogSourceUrl = o.image ?? null;
  const ogImg = ogSourceUrl ? ogImage(ogSourceUrl) : null;
  const faqForSchema = contentReady
    ? (loaderData?.aiContent?.faq?.filter((f) => f.q && f.a).slice(0, 8) ?? [])
    : [];
  const reviewsForSchema = contentReady
    ? pickReviewsFromStored(o.id, loaderData?.aiContent?.reviews ?? [], lang)
    : [];
  // Always emit Product JSON-LD for indexable PDPs; reviews/FAQ only when AI content is ready.
  const structuredData = buildProductStructuredData({
    offer: o,
    lang,
    faq: faqForSchema,
    reviews: reviewsForSchema,
    metaDescription: desc,
  });

  const robots = robotsNoindexMeta(isProductIndexable(o))?.content ?? null;

  return pageHead({
    path: hiPath,
    title,
    description: desc,
    lang,
    image: ogImg,
    type: "product",
    robots,
    extraMeta: noReferrer ? [{ name: "referrer", content: "no-referrer" }] : [],
    styles: [{ children: PRODUCT_CRITICAL_CSS }],
    links: [
      {
        rel: "preload" as const,
        as: "font" as const,
        href: "/fonts/Newsreader-latin.woff2",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload" as const,
        as: "font" as const,
        href: "/fonts/Manrope-latin.woff2",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      ...(o.image
        ? [
            {
              rel: "preload" as const,
              as: "image" as const,
              href: heroSrc,
              fetchpriority: "high" as const,
              ...(noReferrer ? { referrerPolicy: "no-referrer" as const } : {}),
            },
          ]
        : []),
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(structuredData) }],
  });
}

const productRouteApi = getRouteApi("/$category/$brand");

export function ProductPage() {
  // The brand slug is the second dynamic segment in the new URL.
  const params = useParams({ strict: false }) as { brand?: string; slug?: string };
  const slug = params.brand ?? params.slug ?? "";
  const lang = useLang();
  const T = useI18n();
  const href = useHref();
  const { data } = useSuspenseQuery(offerQO(slug));
  const { offer } = data;
  const { related, imageFacts } = productRouteApi.useLoaderData();
  const { data: ai } = useSuspenseQuery(productAiQO(offer));
  const categoryName = categoryDisplayName(offer.categorySlug);
  const displayTitle = offerDisplayTitle(offer);
  const h1Title = displayTitle;

  const contentTier =
    ai?.content_tier ??
    (ai?.description_html && ai.description_html.length >= 400 ? "ai" : "failed");
  const hasAiBody =
    ENABLE_AI_CONTENT &&
    contentTier === "ai" &&
    Boolean(ai?.description_html && ai.description_html.length >= 400);
  const rawDescriptionHtml = hasAiBody
    ? ai!.description_html!
    : csPlaceholderHtml(displayTitle, {
        categorySlug: offer.categorySlug,
        formKind: "generic_item",
      });
  const descriptionHtml = sanitizeHtml(
    varyDeliveryBlock(rawDescriptionHtml, offer.categorySlug, offer.id),
  );
  const faq =
    Array.isArray(ai?.faq) && ai.faq.length >= 3
      ? ai.faq.map((f: { q: string; a: string }) => ({ q: f.q, a: f.a }))
      : [];
  const expertOpinion =
    isYmylCategory(offer.categorySlug) && hasAiBody
      ? ai?.sections?.find((s) => s.heading === EXPERT_OPINION_SECTION_HEADING)?.body?.trim()
      : undefined;
  const productReviews = pickReviewsFromStored(offer.id, ai?.reviews ?? [], lang);
  const avgHero = averageRating(productReviews);
  const avgHeroCs = avgHero != null ? avgHero.toFixed(1).replace(".", ",") : null;
  const formRef = useRef<HTMLDivElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const eta = deliveryEta(lang);

  const openLead = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSheetOpen(true);
    } else {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#lead") return;
    const id = setTimeout(openLead, 50);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reviewsLabel = T.product.reviewsLabel;

  const heroImage = (
    <div className="relative overflow-hidden border border-border bg-stone">
      <span className="absolute left-0 top-0 z-10 bg-background px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
        {T.product.inStock}
      </span>
      <OfferImage
        offer={offer}
        alt={productHeroAlt(offer, lang)}
        width={HERO_LAYOUT_SIZE}
        height={HERO_LAYOUT_SIZE}
        fetchPriority="high"
        loading="eager"
        decoding="sync"
        className="aspect-square w-full object-contain p-4"
      />
    </div>
  );

  return (
    <div className="pdp-page mx-auto max-w-7xl px-5 pb-28 pt-6 md:px-6 md:pb-16 md:pt-10">
      <div className="flex flex-col">
        <nav aria-label="breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <Link to={href("/")} className="hover:text-foreground">
            {T.product.crumbHome}
          </Link>
          <span className="mx-2">/</span>
          <Link
            to={href(categoryPath(offer.categorySlug))}
            className="hover:text-foreground"
          >
            {categoryName}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{displayTitle}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-[1.05fr_1fr] md:gap-14 md:items-start">
          {heroImage}

          {/* RIGHT COLUMN — sticky on desktop */}
          <aside className="flex flex-col md:sticky md:top-24 md:self-start">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cta">
              {categoryName}
            </p>

            <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-foreground text-balance md:text-5xl">
              {h1Title}
            </h1>

            {productReviews.length > 0 && (
              <a
                href="#reviews"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById("reviews")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                aria-label={T.product.gotoReviews}
                className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {avgHeroCs && (
                  <span className="font-semibold tabular-nums text-foreground">{avgHeroCs} / 5</span>
                )}
                <span>· {reviewsLabel(productReviews.length)}</span>
              </a>
            )}

            <div className="mt-6">
              <div className="font-display text-4xl font-semibold tracking-tight text-primary md:text-5xl">
                {offer.priceEUR == null
                  ? T.product.onRequest
                  : offer.priceEUR === 0
                    ? formatDisplayPrice(0)
                    : formatDisplayPrice(offer.priceEUR)}
              </div>
              {offer.priceEUR == null && (
                <p className="mt-1.5 text-sm text-muted-foreground">{T.product.onRequest}</p>
              )}
              {offer.priceEUR === 0 && (
                <p className="mt-1.5 text-sm text-muted-foreground">{T.product.coursePrice}</p>
              )}
            </div>

            <p className="mt-4 text-sm text-foreground">
              <span className="font-medium">{eta.prefix}</span>{" "}
              <span className="whitespace-nowrap font-semibold text-primary">{eta.date}</span>
            </p>

            {/* Compact trust chips — one line each, no stretched label+sub blocks */}
            <ul className="mt-5 flex flex-wrap gap-2">
              {[
                ...(isYmylCategory(offer.categorySlug)
                  ? [{ href: href("/medical-expert"), label: T.product.verifiedByDoctor }]
                  : []),
                { label: `${T.product.original} · ${T.product.originalSub}` },
                {
                  href: href("/returns"),
                  label: `${T.product.returnsDays} · ${T.product.returnsSub}`,
                },
                { label: `${T.product.paymentLabel} ${T.product.paymentSub}` },
                ...(!isYmylCategory(offer.categorySlug)
                  ? [{ href: href("/delivery"), label: T.badges.delivery }]
                  : []),
              ].map((item, i) => {
                const chipClass =
                  "inline-flex items-center rounded-[10px] border border-border bg-stone px-3 py-1.5 text-[12px] font-medium text-foreground";
                return (
                  <li key={i}>
                    {item.href ? (
                      <Link
                        to={item.href}
                        className={`${chipClass} transition-colors hover:border-cta hover:text-cta`}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className={chipClass}>{item.label}</span>
                    )}
                  </li>
                );
              })}
            </ul>

            <div ref={formRef} className="mt-6 border border-border bg-card p-6">
              <LazyLeadForm offerId={offer.id} source={offer.source} priceEUR={offer.priceEUR} />
            </div>
          </aside>
        </div>
      </div>

      <ProductSpecs
        offer={offer}
        lang={lang}
        categoryName={categoryName}
        displayTitle={displayTitle}
        imageFacts={imageFacts ?? null}
      />

      <section
        className="pdp-description cv-auto mx-auto mt-16 max-w-3xl font-sans text-[17px] leading-[1.75] tracking-[0.005em] text-prose md:text-[18px]
          [&_h2]:font-display [&_h2]:text-2xl [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-4 md:[&_h2]:text-3xl
          [&_h3]:font-display [&_h3]:text-xl [&_h3]:tracking-tight [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2
          [&_p]:mt-5 [&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-2 [&_li]:leading-[1.7]
          [&_table]:mt-4 [&_table]:w-full [&_th]:text-left [&_th]:p-2 [&_td]:p-2 [&_th]:border [&_td]:border [&_th]:border-border [&_td]:border-border
          [&_strong]:text-foreground [&_strong]:font-semibold
          [&_a]:text-cta [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary"
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
      />

      {expertOpinion && <ProductExpertOpinion opinion={expertOpinion} />}

      {isWeightToolsCategory(offer.categorySlug) && <WeightToolsPromo variant="pdp" />}

      {faq.length > 0 && (
        <section className="cv-auto mx-auto mt-16 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cta">FAQ</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {T.product.faqH}
          </h2>
          <div className="mt-6 divide-y divide-border border-y border-border">
            {faq.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="cursor-pointer list-none font-display text-lg font-semibold text-foreground">
                  {f.q}
                </summary>
                <p className="mt-3 text-[15px] leading-[1.7] text-prose">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <MiniCta onClick={openLead} />

      <ReviewsSection reviews={productReviews} />

      <section className="mx-auto mt-16 max-w-7xl">
        <p className="section-kicker">{T.product.deliveryCitiesEyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground md:text-4xl">
          {T.product.deliveryCitiesH}
        </h2>
        <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-muted-foreground">
          {CITIES.map((c, i) => (
            <span key={c.slug} className="inline-flex items-center gap-2">
              {i > 0 && <span aria-hidden className="text-border">·</span>}
              <Link
                to={href("/delivery/$slug", { slug: c.slug })}
                className="font-medium text-foreground hover:text-cta"
              >
                {c.name}
              </Link>
            </span>
          ))}
          <span aria-hidden className="text-border">·</span>
          <Link
            to={href("/delivery")}
            className="font-semibold text-cta hover:underline"
          >
            {T.product.allCities}
          </Link>
        </p>
      </section>

      <RelatedProductsGrid related={related} heading={T.product.youMayLike} />

      <LazyMobileChrome
        offer={offer}
        displayTitle={displayTitle}
        sheetOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        onLead={openLead}
      />
      <DeferredPromoModal offer={offer} />
    </div>
  );
}

function MiniCta({ onClick }: { onClick: () => void }) {
  const T = useI18n();
  return (
    <div className="mx-auto mt-12 max-w-3xl">
      <div className="flex flex-col items-start justify-between gap-5 border border-border bg-stone px-6 py-8 sm:flex-row sm:items-center sm:gap-6">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cta">
            {T.product.questionsH}
          </div>
          <div className="mt-2 font-display text-xl font-semibold tracking-tight text-primary">
            {T.product.questionsBody}
          </div>
        </div>
        <button
          type="button"
          onClick={onClick}
          className="inline-flex shrink-0 items-center gap-2 rounded-[10px] bg-cta px-6 py-3 text-sm font-semibold text-cta-foreground shadow-cta transition-transform hover:-translate-y-0.5"
        >
          {T.product.orderCall}
        </button>
      </div>
    </div>
  );
}
