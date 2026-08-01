// ProductBrief — normalized contract between raw feed and LLM/QA.

import type { ProductFacts } from "./product-facts";
import { requiredTermsBg } from "./product-facts.cs-labels";
import { getCategoryDescriptor } from "./category-descriptors.cs";
import type { OfferSource } from "./types";

export type ProductBrief = {
  source: OfferSource;
  offerId: number;
  categorySlug: string;
  brand: string;
  cleanTitle: string;
  cleanedDescription: string;
  physicalForm: ProductFacts;
  niche: {
    uk?: { short: string; problem: string; mustMention: string[]; primary: string[]; effects: string[] };
    ru?: { short: string; problem: string; mustMention: string[]; primary: string[]; effects: string[] };
  };
  allowedLexicon: { uk: string[]; ru: string[] };
  forbiddenLexicon: { uk: string[]; ru: string[] };
  warnings: string[];
  confidence: number;
};

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));
}

export function buildProductBrief(input: {
  source: OfferSource;
  offerId: number;
  categorySlug: string;
  rawTitle: string;
  cleanTitle: string;
  cleanedDescription: string;
  cleanerWarnings: string[];
  facts: ProductFacts;
}): ProductBrief {
  const dBg = getCategoryDescriptor(input.categorySlug);
  const warnings: string[] = [...input.cleanerWarnings];

  if (input.categorySlug === "krevni-tlak" && input.facts.kind === "device") {
    warnings.push("rare-form-for-niche:device-blood-pressure");
  }
  if (
    (input.categorySlug === "sluch" || input.categorySlug === "zrak") &&
    input.facts.kind === "capsules"
  ) {
    warnings.push("supplement-in-sensory-niche");
  }

  const allowedBg = uniq([
    ...requiredTermsBg(input.facts),
    ...(dBg?.mustMention ?? []),
    ...(dBg?.primaryKeywords ?? []),
  ]);

  let confidence = 1;
  if (warnings.includes("thin-description")) confidence -= 0.3;
  if (input.facts.kind === "unknown") confidence -= 0.3;
  if (warnings.some((w) => w.startsWith("rare-form-for-niche"))) confidence -= 0.2;
  if (confidence < 0) confidence = 0;

  const nicheBlock = dBg
    ? {
        short: dBg.short,
        problem: dBg.problem,
        mustMention: dBg.mustMention ?? [],
        primary: dBg.primaryKeywords ?? [],
        effects: dBg.keyEffects ?? [],
      }
    : undefined;

  return {
    source: input.source,
    offerId: input.offerId,
    categorySlug: input.categorySlug,
    brand: input.cleanTitle.split(/\s+/)[0] ?? input.rawTitle,
    cleanTitle: input.cleanTitle,
    cleanedDescription: input.cleanedDescription,
    physicalForm: input.facts,
    niche: { uk: nicheBlock, ru: nicheBlock },
    allowedLexicon: { uk: allowedBg, ru: allowedBg },
    forbiddenLexicon: { uk: [], ru: [] },
    warnings,
    confidence,
  };
}

export function summarizeBrief(brief: ProductBrief): string {
  return [
    `src=${brief.source}#${brief.offerId}`,
    `niche=${brief.categorySlug}`,
    `form=${brief.physicalForm.kind}`,
    `conf=${brief.confidence.toFixed(2)}`,
    brief.warnings.length ? `warn=[${brief.warnings.join(",")}]` : "",
  ].filter(Boolean).join(" ");
}
