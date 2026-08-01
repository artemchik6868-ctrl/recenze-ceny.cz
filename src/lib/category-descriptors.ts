// Language router for category descriptors — Czech storefront.
import type { Lang } from "./lang";
import { getCategoryDescriptor, type CategoryDescriptor } from "./category-descriptors.cs";

export type { CategoryDescriptor };

export function getCategoryDescriptorByLang(slug: string, _lang: Lang): CategoryDescriptor {
  return getCategoryDescriptor(slug)!;
}

const HEADLINE_STOP = new Set<string>([
  "za", "od", "de", "la", "las", "los", "el", "con", "sin", "en", "y", "o",
  "un", "una", "uno", "al", "a", "v", "pri", "na", "po", "iz", "do", "the", "for", "with", "and",
]);

function normalizeForOverlap(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .replace(/['ʼ'`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function displayTitleOverlapsCategory(
  displayTitle: string,
  descriptor: CategoryDescriptor,
): boolean {
  const title = normalizeForOverlap(displayTitle);
  if (!title) return false;
  const sources: string[] = [];
  if (descriptor.short) sources.push(descriptor.short);
  if (descriptor.long) sources.push(descriptor.long);
  for (const t of descriptor.primaryKeywords ?? []) sources.push(t);
  for (const t of descriptor.mustMention ?? []) sources.push(t);
  const stems = new Set<string>();
  for (const src of sources) {
    for (const w of normalizeForOverlap(src).split(/\s+/)) {
      if (w.length < 4 || HEADLINE_STOP.has(w)) continue;
      stems.add(w.slice(0, Math.min(w.length, 5)));
    }
  }
  for (const stem of stems) {
    if (title.includes(stem)) return true;
  }
  return false;
}
