// Shared helpers for routes that exist in both HI and EN.
//
// Every HI route file reads the current language from `match.pathname`
// (in head()) or via `useLang()` (in the component). The EN mirror
// routes reuse the HI route's loader / head / component as-is, so all
// the language-switching logic lives in one place: the HI route.

import {
  getLangFromPath,
  stripLangPrefix,
  LANG_OG_LOCALE,
  type Lang,
} from "./lang";

const RESERVED_FIRST_SEGMENTS = new Set([
  "category",
  "product",
  "about",
  "faq",
  "terms",
  "privacy",
  "contact",
  "delivery",
  "payment",
  "returns",
  "medical-expert",
  "sluzby",
  "pruvodce",
  "ghid",
  "clanky",
  "api",
]);

/** Category hub URL: /{categorySlug} (not /category/{slug}). */
export function isCategoryPath(pathname: string): boolean {
  const hi = stripLangPrefix(pathname.replace(/\/$/, "") || "/");
  const m = hi.match(/^\/([^/]+)$/);
  if (!m) return false;
  return !RESERVED_FIRST_SEGMENTS.has(m[1]);
}

/** Product URL: /{categorySlug}/{brandSlug} */
export function isProductPath(pathname: string): boolean {
  const hi = stripLangPrefix(pathname.replace(/\/$/, "") || "/");
  const m = hi.match(/^\/([^/]+)\/([^/]+)$/);
  if (!m) return false;
  return !RESERVED_FIRST_SEGMENTS.has(m[1]);
}

/** Pull `{ lang, hiPath }` out of any pathname. */
export function pathLang(pathname: string): { lang: Lang; hiPath: string } {
  return {
    lang: getLangFromPath(pathname),
    hiPath: stripLangPrefix(pathname),
  };
}

/** og:locale meta entry for the current language. */
export function ogLocaleMeta(lang: Lang) {
  return { property: "og:locale" as const, content: LANG_OG_LOCALE[lang] };
}
