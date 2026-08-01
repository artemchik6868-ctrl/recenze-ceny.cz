import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { loadProductPageData } from "./product-page.server";

export const getProductPageData = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) =>
    z.object({ slug: z.string().min(1).max(120) }).parse(data),
  )
  .handler(async ({ data }) => {
    return await loadProductPageData(data.slug);
  });
