import { createFileRoute, redirect } from "@tanstack/react-router";
import { canonicalCategorySlug } from "@/lib/category-path";

// Legacy `/category/{slug}` → 301 to canonical `/{slug}/`.
export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    throw redirect({
      to: "/$cat/",
      params: { cat: canonicalCategorySlug(params.slug) },
      statusCode: 301,
    });
  },
  component: () => null,
});
