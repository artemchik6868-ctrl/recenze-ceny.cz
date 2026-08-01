import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getCachedProductContent,
  getOrGenerateProductContent,
  contentNeedsRegen,
} from "./ai-content.server";
import { PDP_CONTENT_SLOT, PDP_LEGACY_ALT_SLOT } from "./market";

const ALLOW_ON_DEMAND_AI_CONTENT = process.env.ALLOW_ON_DEMAND_AI_CONTENT === "true";

export const getProductAIContent = createServerFn({ method: "GET" })
  .inputValidator(
    (data: {
      offerId: number;
      source?: "cpa_tl" | "kma" | "m1_top" | "cpagetti" | "adcombo" | "shakes";
      lang?: typeof PDP_CONTENT_SLOT | typeof PDP_LEGACY_ALT_SLOT | "ro";
      categorySlug?: string;
      cacheOnly?: boolean;
    }) =>
      z
        .object({
          offerId: z.coerce.number().int().positive(),
          source: z
            .enum(["cpa_tl", "kma", "m1_top", "cpagetti", "adcombo", "shakes"])
            .default("cpa_tl"),
          lang: z
            .enum([PDP_CONTENT_SLOT, PDP_LEGACY_ALT_SLOT, "ro"])
            .transform((v) => (v === "ro" ? PDP_CONTENT_SLOT : v))
            .default(PDP_CONTENT_SLOT),
          categorySlug: z.string().min(1).default("other"),
          cacheOnly: z.boolean().optional(),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    if (data.cacheOnly) {
      const content = await getCachedProductContent(data.source, data.offerId, data.lang);
      return { content };
    }
    const cached = await getCachedProductContent(data.source, data.offerId, data.lang);
    if (cached && !contentNeedsRegen(cached.content_tier)) {
      return { content: cached };
    }
    if (!ALLOW_ON_DEMAND_AI_CONTENT) {
      return { content: cached };
    }
    const content = await getOrGenerateProductContent(
      data.source,
      data.offerId,
      data.lang,
      data.categorySlug,
      { forceRegen: contentNeedsRegen(cached?.content_tier) },
    );
    return { content: content ?? cached };
  });
