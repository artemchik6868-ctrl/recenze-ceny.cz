import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { loadCategoryPageData } from "./category-page.server";

export const getCategoryPageData = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) =>
    z.object({ slug: z.string().min(1).max(80) }).parse(data),
  )
  .handler(async ({ data }) => {
    return await loadCategoryPageData(data.slug);
  });
