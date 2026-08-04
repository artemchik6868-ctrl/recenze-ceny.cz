import { Link } from "@tanstack/react-router";
import { OfferImage } from "@/components/OfferImage";
import { useI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";
import { useLang } from "@/lib/lang";
import { categoryPath } from "@/lib/category-path";
import { categoryDisplayName } from "@/lib/category-display-name";
import { offerDisplayTitle } from "@/lib/offer-display";
import { formatDisplayPrice } from "@/lib/market";
import { productCardAlt } from "@/lib/seo-alt";
import type { Offer } from "@/lib/types";

const MAX_BLOG_PRODUCTS = 4;

/**
 * Compact mid-article product rail — list rows, not catalog cards.
 * Goal: skim + click without breaking reading flow.
 */
export function BlogProductPicks({
  offers,
  categorySlug,
  categoryName,
}: {
  offers: Offer[];
  categorySlug: string;
  categoryName: string;
}) {
  const T = useI18n();
  const href = useHref();
  const lang = useLang();
  const visible = offers
    .filter((o) => o.priceEUR == null || o.priceEUR > 0)
    .slice(0, MAX_BLOG_PRODUCTS);
  if (!visible.length) return null;

  return (
    <aside id="blog-products" className="scroll-mt-24 my-6 border-y border-border py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {T.blog.productsTitle}
        </p>
        <Link
          to={href(categoryPath(categorySlug))}
          className="shrink-0 text-xs font-semibold text-cta underline-offset-2 hover:underline"
        >
          {T.blog.productsAllInCategory(categoryName)} →
        </Link>
      </div>

      <ul className="mt-2 divide-y divide-border/80">
        {visible.map((offer) => {
          const title = offerDisplayTitle(offer);
          const cat = categoryDisplayName(offer.categorySlug);
          const priceLabel =
            offer.priceEUR == null
              ? T.product.onRequest
              : formatDisplayPrice(offer.priceEUR);
          return (
            <li key={offer.slug}>
              <Link
                to={href("/$category/$brand", {
                  category: offer.categorySlug,
                  brand: offer.slug,
                })}
                className="group flex items-center gap-3 py-2.5 transition-colors hover:bg-stone/40"
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-stone">
                  <OfferImage
                    offer={offer}
                    alt={productCardAlt(offer, lang, cat)}
                    width={88}
                    height={88}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain p-1"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-snug text-foreground group-hover:text-primary">
                    {title}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-primary">
                    {priceLabel}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="shrink-0 text-sm font-semibold text-cta opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100"
                >
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
