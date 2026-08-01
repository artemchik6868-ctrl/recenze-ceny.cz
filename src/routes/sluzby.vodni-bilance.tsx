import { createFileRoute } from "@tanstack/react-router";
import { getI18n, useI18n } from "@/lib/i18n";
import { pathLang } from "@/lib/route-lang";
import { SERVICES_PATH } from "@/lib/site";
import { serviceToolHead } from "@/lib/services/service-head";
import { ServiceLayout } from "@/components/services/ServiceLayout";
import { WaterBalanceCalculator } from "@/components/services/WaterBalanceCalculator";
import { WaterFaq, WaterSeoContent } from "@/components/services/WaterPageContent";
import { ServiceProductPicks } from "@/components/services/ServiceProductPicks";
import { getCategoryPageData } from "@/lib/category-page.functions";
import { isProductIndexable } from "@/lib/index-policy";
import { pickRandomUniqueBrandOffers } from "@/lib/services/pick-random-offers";

const PATH = `${SERVICES_PATH}/vodni-bilance`;

export const Route = createFileRoute("/sluzby/vodni-bilance")({
  loader: async () => {
    const data = await getCategoryPageData({ data: { slug: "hubnuti" } });
    const offers = (data.offers ?? []).filter(isProductIndexable);
    return { featuredOffers: pickRandomUniqueBrandOffers(offers, 6) };
  },
  head: ({ match }) => {
    const { lang } = pathLang(match.pathname);
    const T = getI18n(lang);
    const W = T.services.water;
    const base = serviceToolHead({
      lang,
      path: PATH,
      title: W.metaTitle(T.siteName),
      description: W.metaDesc,
      pageName: W.title,
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
            mainEntity: W.faq.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        },
      ],
    };
  },
  component: WaterPage,
});

function WaterPage() {
  const T = useI18n();
  const W = T.services.water;
  const { featuredOffers } = Route.useLoaderData();
  return (
    <ServiceLayout title={W.title} lead={W.lead} crumbs={[{ label: W.shortTitle }]}>
      <WaterBalanceCalculator />
      <WaterSeoContent />
      <WaterFaq />
      <ServiceProductPicks
        marketing={W.marketing}
        title={W.productsTitle}
        offers={featuredOffers}
      />
    </ServiceLayout>
  );
}
