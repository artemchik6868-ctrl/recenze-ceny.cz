import { SITE } from "@/lib/site";
import { MARKET_CURRENCY } from "@/lib/market";
import { LANG_LOCALE, type Lang } from "@/lib/lang";
import { getI18n } from "@/lib/i18n";
import { buildProductTitle, resolveProductMetaDescription } from "@/lib/seo-meta";
import { offerDisplayTitle, offerMetaBenefit } from "./offer-display";
import { categoryDisplayName } from "@/lib/category-display-name";
import { categoryPath } from "@/lib/category-path";
import { isYmylCategory } from "@/lib/niche-types";
import { hasCyrillicLocaleLeak } from "./locale-leak-cz";
import type { Offer } from "@/lib/types";
import type { Review } from "@/lib/reviews";

function reviewDatePublished(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function aggregateFromReviews(reviews: Review[]) {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  const avg = Math.round((sum / reviews.length) * 10) / 10;
  return {
    "@type": "AggregateRating" as const,
    ratingValue: String(avg),
    reviewCount: String(reviews.length),
    bestRating: "5",
    worstRating: "1",
  };
}

function reviewNodes(reviews: Review[], productUrl: string) {
  return reviews
    .filter((r) => r.text?.trim() && !hasCyrillicLocaleLeak(r.text))
    .map((r) => ({
      "@type": "Review" as const,
      author: { "@type": "Person" as const, name: r.name },
      datePublished: reviewDatePublished(r.daysAgo),
      reviewRating: {
        "@type": "Rating" as const,
        ratingValue: String(r.rating),
        bestRating: "5",
        worstRating: "1",
      },
      reviewBody: r.text,
      itemReviewed: { "@id": productUrl },
    }));
}

function medicalSpecialtyFor(categorySlug: string): string {
  const map: Record<string, string> = {
    "klouby": "https://schema.org/Rheumatologic",
    "krevni-tlak": "https://schema.org/Cardiovascular",
    diabetes: "https://schema.org/Endocrine",
    sluch: "https://schema.org/Otolaryngologic",
    "zrak": "https://schema.org/Ophthalmologic",
    "men-health": "https://schema.org/Urologic",
    prostatitis: "https://schema.org/Urologic",
    potency: "https://schema.org/Urologic",
    "women-health": "https://schema.org/Gynecologic",
    "weight-loss": "https://schema.org/DietNutrition",
    varicose: "https://schema.org/Cardiovascular",
    hemoroidy: "https://schema.org/Surgical",
    paraziti: "https://schema.org/Infectious",
    skin: "https://schema.org/Dermatologic",
    hair: "https://schema.org/Dermatologic",
  };
  return map[categorySlug] ?? "https://schema.org/PrimaryCare";
}

export function buildProductStructuredData({
  offer,
  lang,
  faq,
  reviews = [],
  metaDescription,
}: {
  offer: Offer;
  lang: Lang;
  faq: Array<{ q: string; a: string }>;
  reviews?: Review[];
  metaDescription?: string | null;
}) {
  const hiPath = `/${offer.categorySlug}/${offer.slug}`;
  const url = `${SITE.url}${hiPath}`;
  const T = getI18n(lang);
  const contentName = categoryDisplayName(offer.categorySlug);
  const productName = offerDisplayTitle(offer);
  const schemaBrand =
    offer.brand?.trim() ||
    productName.split(/\s+[–—-]\s+/)[0]?.trim() ||
    productName;
  const title = buildProductTitle(
    {
      brand: productName,
      feedBrand: offer.brand,
      categorySlug: offer.categorySlug,
      priceEUR: offer.priceEUR,
      variantSeed: offer.id,
    },
    lang,
  );
  const aiBenefit = offerMetaBenefit(offer);
  const desc =
    metaDescription?.trim() ||
    resolveProductMetaDescription(
      {
        brand: productName,
        feedBrand: offer.brand,
        categorySlug: offer.categorySlug,
        priceEUR: offer.priceEUR,
        aiBenefit,
        aiMetaDesc: aiBenefit,
        variantSeed: offer.id,
      },
      lang,
    );
  const safeFaq = faq.filter(
    (f) =>
      f.q?.trim() &&
      f.a?.trim() &&
      !hasCyrillicLocaleLeak(f.q) &&
      !hasCyrillicLocaleLeak(f.a),
  );
  const safeReviews = reviews.filter(
    (r) => r.text?.trim() && !hasCyrillicLocaleLeak(r.text),
  );
  const aggregateRating = aggregateFromReviews(safeReviews);
  const nowMs = Date.now();
  const priceValidUntil = new Date(nowMs + 60 * 86400000).toISOString().slice(0, 10);
  const dateModified = (offer.contentGeneratedAt ?? new Date(nowMs).toISOString()).slice(0, 10);
  const productImages = offer.image ? [offer.image] : undefined;
  const hasRealPrice = typeof offer.priceEUR === "number" && offer.priceEUR > 0;
  const M = T.medicalExpert;
  const marketCountry = SITE.address.country;
  const isYmyl = isYmylCategory(offer.categorySlug);

  const reviewer = {
    "@type": "Person" as const,
    name: M.name,
    jobTitle: M.title,
    url: `${SITE.url}/medical-expert`,
  };

  const productNode: Record<string, unknown> = {
        "@type": "Product",
        "@id": url,
        name: productName,
        image: productImages,
        description: desc,
        category: contentName,
        brand: { "@type": "Brand", name: schemaBrand },
        itemCondition: "https://schema.org/NewCondition",
        inLanguage: LANG_LOCALE[lang],
        dateModified,
        ...(isYmyl ? { reviewedBy: reviewer } : {}),
        offers: hasRealPrice
          ? {
              "@type": "Offer",
              priceCurrency: MARKET_CURRENCY,
              price: offer.priceEUR,
              priceValidUntil,
              availability: "https://schema.org/InStock",
              itemCondition: "https://schema.org/NewCondition",
              areaServed: marketCountry,
              url,
              seller: { "@type": "Organization", name: SITE.name },
              hasMerchantReturnPolicy: {
                "@type": "MerchantReturnPolicy",
                applicableCountry: marketCountry,
                returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
                merchantReturnDays: 14,
                returnMethod: "https://schema.org/ReturnByMail",
                returnFees: "https://schema.org/FreeReturn",
              },
              shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingRate: {
                  "@type": "MonetaryAmount",
                  value: 0,
                  currency: MARKET_CURRENCY,
                },
                shippingDestination: {
                  "@type": "DefinedRegion",
                  addressCountry: marketCountry,
                },
                deliveryTime: {
                  "@type": "ShippingDeliveryTime",
                  handlingTime: {
                    "@type": "QuantitativeValue",
                    minValue: 0,
                    maxValue: 1,
                    unitCode: "DAY",
                  },
                  transitTime: {
                    "@type": "QuantitativeValue",
                    minValue: 2,
                    maxValue: 7,
                    unitCode: "DAY",
                  },
                },
              },
            }
          : undefined,
  };
  if (aggregateRating) {
    productNode.aggregateRating = aggregateRating;
  }

  const graph: Record<string, unknown>[] = [
    {
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
          name: contentName,
          item: `${SITE.url}${categoryPath(offer.categorySlug)}`,
        },
        { "@type": "ListItem", position: 3, name: productName, item: url },
      ],
    },
    productNode,
    ...reviewNodes(safeReviews, url),
    ...(safeFaq.length > 0
      ? [
          {
            "@type": "FAQPage",
            inLanguage: LANG_LOCALE[lang],
            mainEntity: safeFaq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]
      : []),
    {
      "@type": isYmyl ? "MedicalWebPage" : "WebPage",
      "@id": `${url}#webpage`,
      url,
      inLanguage: LANG_LOCALE[lang],
      name: title,
      description: desc,
      dateModified,
      isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
      about: { "@id": url },
      ...(isYmyl
        ? {
            reviewedBy: { ...reviewer, jobTitle: M.jobTitle },
            lastReviewed: dateModified,
            specialty: medicalSpecialtyFor(offer.categorySlug),
            mainContentOfPage: { "@id": url },
          }
        : {}),
    },
  ];

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
