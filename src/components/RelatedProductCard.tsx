import { Link } from "@tanstack/react-router";
import type { Offer } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { OfferImage } from "@/components/OfferImage";
import { categoryDisplayName } from "@/lib/category-display-name";
import { productCardAlt } from "@/lib/seo-alt";
import { offerDisplayTitle } from "@/lib/offer-display";
import { formatDisplayPrice } from "@/lib/market";
import { useLang } from "@/lib/lang";

const RELATED_IMG_WIDTH = 320;

export function RelatedProductCard({ offer }: { offer: Offer }) {
  const T = useI18n();
  const lang = useLang();
  const categoryName = categoryDisplayName(offer.categorySlug);
  const displayTitle = offerDisplayTitle(offer);
  const priceState: "price" | "free" | "request" =
    offer.priceEUR == null ? "request" : offer.priceEUR === 0 ? "free" : "price";
  const priceLabel =
    priceState === "price"
      ? formatDisplayPrice(offer.priceEUR ?? 0)
      : priceState === "free"
        ? formatDisplayPrice(0)
        : T.product.onRequest;

  return (
    <Link
      to="/$category/$brand"
      params={{ category: offer.categorySlug, brand: offer.slug }}
      preload={false}
      className="group flex h-full flex-col rounded-[10px] border border-border bg-card p-3 transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-lift"
    >
      <div className="aspect-[5/4] w-full overflow-hidden rounded-[8px] bg-stone">
        <OfferImage
          offer={offer}
          alt={productCardAlt(offer, lang, categoryName)}
          width={RELATED_IMG_WIDTH}
          height={256}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain p-2.5 transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <p className="mt-2.5 truncate text-[11px] text-muted-foreground">{categoryName}</p>
      <h3 className="mt-1 line-clamp-2 font-display text-[0.95rem] font-semibold leading-snug text-foreground">
        {displayTitle}
      </h3>
      <div className="mt-auto pt-3 font-display text-xl font-semibold leading-none text-primary">
        {priceLabel}
      </div>
    </Link>
  );
}
