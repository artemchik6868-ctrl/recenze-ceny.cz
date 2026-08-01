// Language router for UI strings — Czech only (cs-CZ).
import { T } from "./i18n.cs";
import type { Lang } from "./lang";

export const I18N = { cs: T } as const;

export function getI18n(_lang: Lang): typeof T {
  return T;
}

export function useI18n(): typeof T {
  return T;
}
