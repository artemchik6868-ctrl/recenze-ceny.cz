// CZ storefront — single-locale canonical + hreflang (cs-CZ + x-default).

import { SITE } from "./site";

/**
 * @param path The pathname (e.g. `/about`, `/joint-care`).
 */
export function canonicalLinks(path: string, _lang?: string) {
  const url = `${SITE.url}${path}`;
  return [
    { rel: "canonical" as const, href: url },
    { rel: "alternate" as const, hrefLang: "cs-CZ", href: url },
    { rel: "alternate" as const, hrefLang: "x-default", href: url },
  ];
}

export function ogUrlMeta(path: string, _lang?: string) {
  const url = `${SITE.url}${path}`;
  return { property: "og:url", content: url } as const;
}
