import type { ImgHTMLAttributes } from "react";
import { productImage, imgFallback, type ImageOffer } from "@/lib/image-proxy";
import { cn } from "@/lib/utils";

type OfferImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> & {
  offer: ImageOffer;
};

export function OfferImage({ offer, className, referrerPolicy, ...props }: OfferImageProps) {
  const isPlaceholder = !offer.image;
  const resolvedClassName = isPlaceholder
    ? cn(className?.replace(/\bobject-cover\b/g, ""), "object-contain p-4")
    : className;

  return (
    <img
      src={productImage(offer)}
      onError={imgFallback(offer)}
      referrerPolicy={referrerPolicy ?? (offer.image ? "no-referrer" : undefined)}
      className={resolvedClassName}
      {...props}
    />
  );
}
