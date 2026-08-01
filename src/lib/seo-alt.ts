// ALT text builders for the Czech storefront.

import type { Offer } from "./types";
import { offerDisplayTitle } from "./offer-display";
import { formatDisplayPrice } from "./market";
import { SITE } from "./site";

const clip = (s: string, max = 125) =>
  s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";

export function productCardAlt(offer: Offer, _lang: string, categoryName: string): string {
  const t = offerDisplayTitle(offer);
  return clip(`${t} — ${categoryName}, online nákup v České republice`);
}

export function productHeroAlt(offer: Offer, _lang: string): string {
  const t = offerDisplayTitle(offer);
  const price = offer.priceEUR ? ` od ${formatDisplayPrice(offer.priceEUR)}` : "";
  return clip(`${t} — balení produktu${price}, dostupné v České republice`);
}

export function productFeaturedAlt(
  offer: Offer,
  _lang: string,
  categoryName: string,
): string {
  const t = offerDisplayTitle(offer);
  return clip(`Dnešní tip — ${t}, bestseller v kategorii ${categoryName} v České republice`);
}

export function promoModalAlt(offer: Offer, _lang: string): string {
  const t = offerDisplayTitle(offer);
  return clip(`${t} — speciální zvýhodněná nabídka`);
}

export function expertPhotoAlt(
  _lang: string,
  name: string,
  title: string,
): string {
  return clip(`Portrét ${name}, ${title}, lékařský poradce na ${SITE.name}`);
}

export function reviewAvatarAlt(
  _lang: string,
  name: string,
  city: string,
): string {
  return clip(`Ověřený zákazník — ${name}, ${city}`);
}
