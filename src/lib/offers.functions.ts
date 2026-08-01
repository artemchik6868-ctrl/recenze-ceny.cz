import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import {
  findOfferById,
  findOfferBySlug,
  loadCategories,
  loadOffers,
  offersByCategory,
} from "./offers.server";
import { offerForClient, offersForClient } from "./offers-utils";

export const getOffers = createServerFn({ method: "GET" }).handler(async () => {
  return { offers: offersForClient(await loadOffers()) };
});

export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    return { categories: await loadCategories() };
  },
);

export const getCategoryWithOffers = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) =>
    z.object({ slug: z.string().min(1).max(80) }).parse(data),
  )
  .handler(async ({ data }) => {
    const [categories, offers] = await Promise.all([
      loadCategories(),
      offersByCategory(data.slug),
    ]);
    const category = categories.find((c) => c.slug === data.slug);
    if (!category) throw notFound();
    return { category, offers: offersForClient(offers) };
  });

export const getOffer = createServerFn({ method: "GET" })
  .inputValidator((data: { id: number }) =>
    z.object({ id: z.coerce.number().int().positive() }).parse(data),
  )
  .handler(async ({ data }) => {
    const offer = await findOfferById(data.id);
    if (!offer) throw notFound();
    const related = (await offersByCategory(offer.categorySlug))
      .filter((o) => o.id !== offer.id)
      .slice(0, 4);
    return { offer: offerForClient(offer), related: offersForClient(related) };
  });

export const getOfferBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) =>
    z.object({ slug: z.string().min(1).max(120) }).parse(data),
  )
  .handler(async ({ data }) => {
    const offer = await findOfferBySlug(data.slug);
    if (!offer) throw notFound();
    return { offer: offerForClient(offer) };
  });