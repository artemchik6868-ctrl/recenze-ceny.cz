import { RelatedProductCard } from "@/components/RelatedProductCard";
import type { Offer } from "@/lib/types";

export function RelatedProductsGrid({
  related,
  heading,
}: {
  related: Offer[];
  heading: string;
}) {
  if (related.length === 0) return null;

  return (
    <section className="cv-auto mt-16">
      <h2 className="mb-8 font-display text-3xl text-foreground md:text-4xl">{heading}</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((o) => (
          <RelatedProductCard key={`${o.source}-${o.id}`} offer={o} />
        ))}
      </div>
    </section>
  );
}
