// Lang-aware href builder — Italian-only storefront (no /ru prefix).
import { useLang, type Lang } from "./lang";

export function buildHref(
  to: string,
  params: Record<string, string> | undefined,
  _lang: Lang,
): string {
  let path = to;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      path = path.replace(new RegExp(`\\$${k}\\b`, "g"), v);
    }
  }
  return path;
}

export function useHref() {
  const lang = useLang();
  return (to: string, params?: Record<string, string>) => buildHref(to, params, lang);
}
