import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getOffers, getCategories } from "@/lib/offers.functions";
import { getProductsIndexData } from "@/lib/products-index.functions";
import { ProductCard } from "@/components/ProductCard";
import { useI18n, getI18n } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { useHref } from "@/lib/lang-link";
import { pathLang } from "@/lib/route-lang";
import { pageHead } from "@/lib/page-head";
import { SITE } from "@/lib/site";
import { localizeCategory } from "@/lib/category-display-name";
import { categoryPath } from "@/lib/category-path";
import { isProductIndexable, indexableOffersByCategory } from "@/lib/index-policy";

const offersQO = queryOptions({
  queryKey: ["offers-all"],
  queryFn: () => getOffers(),
  staleTime: 5 * 60 * 1000,
  gcTime: 5 * 60 * 1000,
});
const catsQO = queryOptions({
  queryKey: ["categories-all"],
  queryFn: () => getCategories(),
  staleTime: 5 * 60 * 1000,
});

export const Route = createFileRoute("/product/")({
  loader: async ({ context }) => {
    const data = await getProductsIndexData();
    context.queryClient.setQueryData(offersQO.queryKey, { offers: data.offers });
    context.queryClient.setQueryData(catsQO.queryKey, { categories: data.categories });
  },
  head: ({ match }) => {
    const { lang } = pathLang(match.pathname);
    const T = getI18n(lang);
    const title = T.category.productsTitle(T.siteName);
    const desc = T.category.productsDesc(T.siteName);
    return pageHead({
      path: "/product",
      title,
      description: desc,
      lang,
    });
  },
  component: ProductsIndex,
});

function ProductsIndex() {
  const T = useI18n();
  const lang = useLang();
  const href = useHref();
  const { data: offerData } = useSuspenseQuery(offersQO);
  const { data: catData } = useSuspenseQuery(catsQO);
  const offers = (offerData?.offers ?? []).filter(isProductIndexable);
  const indexableByCategory = indexableOffersByCategory(offerData?.offers ?? []);
  const categories = (catData?.categories ?? [])
    .filter((c) => (indexableByCategory.get(c.slug) ?? 0) > 0)
    .map((c) => localizeCategory(c, lang))
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-6 md:py-16">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to={href("/")} className="hover:text-foreground">{T.product.crumbHome}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{T.category.productsHeading}</span>
      </nav>
      <header className="mb-10 max-w-3xl">
        <h1 className="font-display text-4xl text-foreground md:text-5xl text-balance">
          {T.category.productsHeading}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {T.category.productsLead(SITE.name, offers.length)}
        </p>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {T.category.productsIntro}
        </p>
        <Link
          to={href("/category")}
          className="mt-6 inline-flex text-sm font-medium text-primary hover:underline"
        >
          {T.category.productsBrowseCategories} →
        </Link>
      </header>
      {categories.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display text-2xl text-foreground">{T.category.allHeading}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.slug}
                to={href(categoryPath(c.slug))}
                className="rounded-full border border-border/60 bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}
      {offers.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-muted-foreground">
          {T.category.empty}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {offers.map((o) => (
            <ProductCard key={o.id} offer={o} />
          ))}
        </div>
      )}
    </div>
  );
}
