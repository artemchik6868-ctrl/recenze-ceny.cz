/** Post-generation content quality score (no LLM). */

import type { AIProductContent } from "./ai-content.server";
import { getCategorySeoIntent } from "./seo-intent.cs";
import { hasGermanLocaleLeak, hasPolishLocaleLeak, hasSlovenianLocaleLeak } from "./locale-leak-cz";

export type ContentQualityInput = {
  content: AIProductContent;
  categorySlug: string;
  siblingHtmlSamples?: string[];
};

export type ContentQualityScore = {
  total: number;
  keywordCoverage: number;
  uniqueness: number;
  htmlDepth: number;
  faqSpecificity: number;
  localePurity: number;
  needsRegen: boolean;
};

function keywordCoverage(html: string, categorySlug: string): number {
  const intent = getCategorySeoIntent(categorySlug);
  const lc = html.toLowerCase();
  const primary = intent.primaryKeyword.toLowerCase();
  let score = 0;
  if (lc.includes(primary)) score += 15;
  const hits = intent.secondaryKeywords.filter((k) => lc.includes(k.toLowerCase())).length;
  score += Math.min(10, hits * 3);
  return Math.min(25, score);
}

function jaccardDistinct(a: string, b: string): number {
  const words = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/<[^>]+>/g, " ")
        .split(/\W+/)
        .filter((w) => w.length > 4),
    );
  const sa = words(a);
  const sb = words(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter++;
  const union = sa.size + sb.size - inter;
  return union > 0 ? inter / union : 0;
}

function uniquenessScore(html: string, siblings: string[]): number {
  if (siblings.length === 0) return 20;
  const sim = Math.max(...siblings.map((s) => jaccardDistinct(html, s)));
  if (sim >= 0.85) return 5;
  if (sim >= 0.7) return 12;
  if (sim >= 0.55) return 18;
  return 25;
}

function htmlDepthScore(html: string): number {
  const len = html.length;
  if (len >= 1200) return 20;
  if (len >= 800) return 16;
  if (len >= 500) return 12;
  if (len >= 400) return 8;
  return 0;
}

function faqSpecificityScore(faq: AIProductContent["faq"], brand: string): number {
  if (!faq || faq.length < 3) return 0;
  const brandLc = brand.toLowerCase();
  const withBrand = faq.filter((f) => f.q.toLowerCase().includes(brandLc)).length;
  const avgLen =
    faq.reduce((s, f) => s + (f.a?.split(/\s+/).length ?? 0), 0) / faq.length;
  let score = Math.min(8, withBrand * 3);
  if (avgLen >= 60) score += 7;
  else if (avgLen >= 40) score += 4;
  return Math.min(15, score);
}

function localePurityScore(blob: string): number {
  let score = 15;
  if (hasGermanLocaleLeak(blob)) score -= 8;
  if (hasPolishLocaleLeak(blob)) score -= 5;
  if (hasSlovenianLocaleLeak(blob)) score -= 5;
  return Math.max(0, score);
}

export function scoreProductContent(input: ContentQualityInput): ContentQualityScore {
  const html = input.content.description_html ?? "";
  const blob = [
    html,
    input.content.subtitle,
    input.content.meta_desc,
    ...(input.content.faq ?? []).flatMap((f) => [f.q, f.a]),
  ].join(" ");
  const brand = input.content.display_title?.split(/\s*[—–-]\s*/)[0]?.trim() ?? "";

  const keywordCoverageScore = keywordCoverage(html.slice(0, 800), input.categorySlug);
  const uniqueness = uniquenessScore(html, input.siblingHtmlSamples ?? []);
  const htmlDepth = htmlDepthScore(html);
  const faqSpecificity = faqSpecificityScore(input.content.faq, brand);
  const localePurity = localePurityScore(blob);
  const total = keywordCoverageScore + uniqueness + htmlDepth + faqSpecificity + localePurity;

  return {
    total,
    keywordCoverage: keywordCoverageScore,
    uniqueness,
    htmlDepth,
    faqSpecificity,
    localePurity,
    needsRegen: total < 60,
  };
}
