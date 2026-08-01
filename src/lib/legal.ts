// Language router for legal/info pages — Polish only.
import type { Lang } from "./lang";
import { LEGAL, type LegalPage } from "./legal.cs";

export function getLegalByLang(slug: string, _lang: Lang): LegalPage | undefined {
  return LEGAL[slug];
}
