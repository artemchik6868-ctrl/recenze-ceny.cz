import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  productHead,
  ProductPage,
  offerQO,
  productAiQO,
} from "@/lib/product-page";
import { getProductPageData } from "@/lib/product-page.functions";
import { categorySlugRedirectTarget } from "@/lib/category-slug-redirects";

export const Route = createFileRoute("/$category/$brand")({
  loader: async ({ context, params }) => {
    const legacyCategory = categorySlugRedirectTarget(params.category);
    if (legacyCategory) {
      throw redirect({
        to: "/$category/$brand",
        params: { category: legacyCategory, brand: params.brand },
        statusCode: 301,
      });
    }
    const data = await getProductPageData({ data: { slug: params.brand } });
    if (
      data.offer.categorySlug !== params.category ||
      data.offer.slug !== params.brand
    ) {
      throw redirect({
        to: "/$category/$brand",
        params: { category: data.offer.categorySlug, brand: data.offer.slug },
        statusCode: 301,
      });
    }
    context.queryClient.setQueryData(offerQO(params.brand).queryKey, { offer: data.offer });
    context.queryClient.setQueryData(productAiQO(data.offer).queryKey, data.aiContent);
    return { offer: data.offer, aiContent: data.aiContent, related: data.related, imageFacts: data.imageFacts };
  },
  head: ({ loaderData, match }) =>
    productHead({ loaderData: loaderData as never, pathname: match.pathname }),
  component: ProductPage,
});

// Re-export offerQO so route consumers can prefetch if needed.
export { offerQO };
