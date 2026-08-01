import { createFileRoute } from "@tanstack/react-router";
import { getI18n, useI18n } from "@/lib/i18n";
import { pathLang } from "@/lib/route-lang";
import { SERVICES_PATH } from "@/lib/site";
import { serviceToolHead } from "@/lib/services/service-head";
import { ServiceLayout } from "@/components/services/ServiceLayout";
import { CalorieCalculator } from "@/components/services/CalorieCalculator";
import { CaloriesFaq, CaloriesSeoContent } from "@/components/services/CaloriesPageContent";
import { ServiceProductPicks } from "@/components/services/ServiceProductPicks";
import { getCategoryPageData } from "@/lib/category-page.functions";
import { isProductIndexable } from "@/lib/index-policy";
import { pickRandomUniqueBrandOffers } from "@/lib/services/pick-random-offers";

const PATH = `${SERVICES_PATH}/kaloricka-kalkulacka`;

export const Route = createFileRoute("/sluzby/kaloricka-kalkulacka")({
  loader: async () => {
    const data = await getCategoryPageData({ data: { slug: "hubnuti" } });
    const offers = (data.offers ?? []).filter(isProductIndexable);
    return { featuredOffers: pickRandomUniqueBrandOffers(offers, 6) };
  },
  head: ({ match }) => {
    const { lang } = pathLang(match.pathname);
    const T = getI18n(lang);
    const C = T.services.calories;
    const base = serviceToolHead({
      lang,
      path: PATH,
      title: C.metaTitle(T.siteName),
      description: C.metaDesc,
      pageName: C.title,
    });
    return {
      ...base,
      scripts: [
        ...(base.scripts ?? []),
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: C.faq.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        },
      ],
    };
  },
  component: CaloriePage,
});

function CaloriePage() {
  const T = useI18n();
  const C = T.services.calories;
  const { featuredOffers } = Route.useLoaderData();
  return (
    <ServiceLayout title={C.title} lead={C.lead} crumbs={[{ label: C.shortTitle }]}>
      <CalorieCalculator />
      <CaloriesSeoContent />
      <CaloriesFaq />
      <ServiceProductPicks
        marketing={C.marketing}
        title={C.productsTitle}
        offers={featuredOffers}
      />
    </ServiceLayout>
  );
}
