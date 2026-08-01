import { notFound } from "@tanstack/react-router";
import { findOfferBySlug, offersByCategory } from "./offers.server";
import { getCachedProductContent } from "./ai-content.server";
import type { AIProductContent } from "./ai-content.server";
import { isProductIndexable } from "./index-policy";
import { PDP_CONTENT_SLOT } from "./market";
import { offerForClient, offersForClient } from "./offers-utils";
import { getInjectableImageFacts } from "./image-facts.server";
import { isImageFactsSource } from "./image-facts";
import type { CompactImageFacts } from "./image-facts";
import type { Offer } from "./types";

export type ProductPageData = {
  offer: Offer;
  aiContent: AIProductContent | null;
  related: Offer[];
  imageFacts: CompactImageFacts | null;
};

export async function loadProductPageData(slug: string): Promise<ProductPageData> {
  const offer = await findOfferBySlug(slug);
  if (!offer) throw notFound();
  const [aiContent, categoryOffers, imageInject] = await Promise.all([
    getCachedProductContent(offer.source, offer.id, PDP_CONTENT_SLOT),
    offersByCategory(offer.categorySlug),
    isImageFactsSource(offer.source)
      ? getInjectableImageFacts(offer.source, offer.id)
      : Promise.resolve({ imageHash: null, promptBlock: null, facts: null }),
  ]);
  const related = categoryOffers
    .filter((o) => o.id !== offer.id && isProductIndexable(o))
    .slice(0, 4);
  const offerWithFreshStamp: Offer = {
    ...offerForClient(offer),
    contentGeneratedAt: aiContent?.generated_at ?? offer.contentGeneratedAt ?? null,
  };
  return {
    offer: offerWithFreshStamp,
    aiContent,
    related: offersForClient(related),
    imageFacts: imageInject.facts,
  };
}
