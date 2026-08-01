// Language router for category content — Czech only.
import type { Lang } from "./lang";
import { getCategoryContent } from "./content.cs";
import type { CategoryContent } from "./content.cs";

export function getCategoryContentByLang(slug: string, _lang: Lang): CategoryContent {
  return getCategoryContent(slug);
}

export { localizeCategory, categoryDisplayName, categoryDisplayShort } from "./category-display-name";
