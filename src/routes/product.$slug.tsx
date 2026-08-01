import { createFileRoute, redirect } from "@tanstack/react-router";
import { offerQO } from "@/lib/product-page";

// Legacy URL → 301 redirect to /{category}/{brand}.
export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const qc = (context as { queryClient: { ensureQueryData: (o: unknown) => Promise<{ offer: { categorySlug: string; slug: string } }> } }).queryClient;
    const data = await qc.ensureQueryData(offerQO(params.slug) as never);
    throw redirect({
      to: "/$category/$brand",
      params: { category: data.offer.categorySlug, brand: data.offer.slug },
      statusCode: 301,
    });
  },
  component: () => null,
});
