import type { SyntheticEvent } from "react";

export const PRODUCT_PLACEHOLDER = "/placeholders/generic.svg";

/** Layout hint for PDP hero `<img width/height>` (not a resize URL param). */
export const HERO_LAYOUT_SIZE = 400;

export function placeholderForFormKind(_formKind?: string | null): string {
  return PRODUCT_PLACEHOLDER;
}

export type ImageOffer = {
  image: string;
  formKind?: string | null;
};

export function productImage(offer: ImageOffer): string {
  if (offer.image) return offer.image;
  return PRODUCT_PLACEHOLDER;
}

/** Hero LCP URL — same feed URL as productImage. */
export function productImageLcp(offer: ImageOffer): string {
  return productImage(offer);
}

/** True when PDP should send Referrer-Policy: no-referrer (partner CDN hotlink). */
export function productPageNeedsNoReferrer(offer: ImageOffer): boolean {
  return Boolean(offer.image);
}

export function ogImage(url: string | null | undefined): string {
  return url ?? "";
}

export function imgFallback(offer: ImageOffer) {
  return (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.dataset.fallback === "done") return;
    img.dataset.fallback = "done";
    img.removeAttribute("srcset");
    img.removeAttribute("referrerpolicy");
    img.classList.remove("object-cover");
    img.classList.add("object-contain", "p-4");
    img.src = PRODUCT_PLACEHOLDER;
  };
}
