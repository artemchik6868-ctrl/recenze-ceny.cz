import { Link } from "@tanstack/react-router";
import type { Offer } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";
import { OfferImage } from "@/components/OfferImage";
import { categoryDisplayName } from "@/lib/category-display-name";
import { productCardAlt } from "@/lib/seo-alt";
import { offerDisplayTitle } from "@/lib/offer-display";
import { formatDisplayPrice } from "@/lib/market";
import { useLang } from "@/lib/lang";

/**
 * Product card layout (top → bottom):
 * 1. Photo
 * 2. Category (meta)
 * 3. Title
 * 4. Price + CTA on one row
 */
export function ProductCard({ offer }: { offer: Offer }) {
  const T = useI18n();
  const href = useHref();
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
      to={href("/$category/$brand", { category: offer.categorySlug, brand: offer.slug })}
      className="group flex h-full flex-col rounded-[10px] border border-border bg-card p-3 transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-lift"
    >
      <div className="aspect-[5/4] w-full overflow-hidden rounded-[8px] bg-stone">
        <OfferImage
          offer={offer}
          alt={productCardAlt(offer, lang, categoryName)}
          width={480}
          height={384}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      <p className="mt-3 truncate text-[11px] font-medium text-muted-foreground">
        {categoryName}
        <span className="mx-1.5 text-border">·</span>
        <span className="text-success">{T.product.inStock}</span>
      </p>

      <h3 className="mt-1 line-clamp-2 font-display text-base font-semibold leading-snug tracking-tight text-foreground md:text-[1.05rem]">
        {displayTitle}
      </h3>

      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div className="min-w-0">
          <span className="font-display text-2xl font-semibold leading-none tracking-tight text-primary">
            {priceLabel}
          </span>
          {priceState === "free" && (
            <span className="mt-1 block text-[11px] text-muted-foreground">
              {T.product.coursePrice}
            </span>
          )}
        </div>
        <span className="inline-flex shrink-0 items-center rounded-[10px] bg-cta px-3.5 py-2 text-sm font-semibold text-cta-foreground transition-transform group-hover:-translate-y-0.5">
          {T.product.placeOrder}
        </span>
      </div>
    </Link>
  );
}
