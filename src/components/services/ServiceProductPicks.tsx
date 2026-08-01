import { ProductCard } from "@/components/ProductCard";
import type { Offer } from "@/lib/types";

/** Always-rendered product grid for service pages (SSR-visible for crawlers). */
export function ServiceProductPicks({
  marketing,
  title,
  offers,
}: {
  marketing: string;
  title: string;
  offers: Offer[];
}) {
  if (!offers.length) return null;
  return (
    <aside className="mt-10">
      <p className="text-sm leading-relaxed text-foreground">{marketing}</p>
      <h2 className="mt-5 font-display text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => (
          <ProductCard key={offer.slug} offer={offer} />
        ))}
      </div>
    </aside>
  );
}
