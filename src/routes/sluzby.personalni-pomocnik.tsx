import { createFileRoute } from "@tanstack/react-router";
import { getI18n, useI18n } from "@/lib/i18n";
import { pathLang } from "@/lib/route-lang";
import { SERVICES_PATH } from "@/lib/site";
import { serviceToolHead } from "@/lib/services/service-head";
import { ServiceLayout } from "@/components/services/ServiceLayout";
import { SupplementQuiz } from "@/components/services/SupplementQuiz";
import { QuizIntroCallout, QuizSeoContent } from "@/components/services/QuizPageContent";
import { ServiceProductPicks } from "@/components/services/ServiceProductPicks";
import { getCategoryPageData } from "@/lib/category-page.functions";
import { isProductIndexable } from "@/lib/index-policy";
import { pickRandomUniqueBrandOffers } from "@/lib/services/pick-random-offers";
import type { Offer } from "@/lib/types";

const PATH = `${SERVICES_PATH}/personalni-pomocnik`;

export const Route = createFileRoute("/sluzby/personalni-pomocnik")({
  loader: async () => {
    const [wm, detox] = await Promise.all([
      getCategoryPageData({ data: { slug: "hubnuti" } }),
      getCategoryPageData({ data: { slug: "detox" } }),
    ]);
    const bySlug = new Map<string, Offer>();
    for (const o of [...(wm.offers ?? []), ...(detox.offers ?? [])]) {
      if (!isProductIndexable(o)) continue;
      if (!bySlug.has(o.slug)) bySlug.set(o.slug, o);
    }
    const offers = [...bySlug.values()];
    const wmOnly = (wm.offers ?? []).filter(isProductIndexable);
    return {
      offers,
      featuredOffers: pickRandomUniqueBrandOffers(wmOnly.length ? wmOnly : offers, 6),
    };
  },
  head: ({ match }) => {
    const { lang } = pathLang(match.pathname);
    const T = getI18n(lang);
    return serviceToolHead({
      lang,
      path: PATH,
      title: T.services.quiz.metaTitle(T.siteName),
      description: T.services.quiz.metaDesc,
      pageName: T.services.quiz.title,
    });
  },
  component: QuizPage,
});

function QuizPage() {
  const T = useI18n();
  const Q = T.services.quiz;
  const { offers, featuredOffers } = Route.useLoaderData();
  return (
    <ServiceLayout title={Q.title} lead={Q.lead} crumbs={[{ label: Q.shortTitle }]}>
      <QuizIntroCallout />
      <SupplementQuiz offers={offers} />
      <QuizSeoContent />
      <ServiceProductPicks
        marketing={Q.catalogLead}
        title={Q.catalogTitle}
        offers={featuredOffers}
      />
    </ServiceLayout>
  );
}
