import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy RO URL → 301 redirect to /pruvodce/{slug}.
export const Route = createFileRoute("/ghid/$slug")({
  loader: ({ params }) => {
    throw redirect({
      to: "/pruvodce/$slug",
      params: { slug: params.slug },
      statusCode: 301,
    });
  },
  component: () => null,
});
