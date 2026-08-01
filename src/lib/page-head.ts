// Unified page <head> builder — canonical, Open Graph, Twitter.

import { getI18n } from "./i18n";
import { canonicalLinks } from "./hreflang";
import { ogLocaleMeta } from "./route-lang";
import { DEFAULT_LANG, type Lang } from "./lang";
import { SITE } from "./site";

export const DEFAULT_OG_IMAGE = `${SITE.url}/og-image.jpg`;

type MetaEntry = { title?: string; name?: string; property?: string; content?: string };
type LinkEntry = {
  rel: string;
  href?: string;
  hrefLang?: string;
  as?: string;
  type?: string;
  crossOrigin?: string;
  fetchpriority?: string;
  referrerPolicy?: string;
};
type ScriptEntry = { type?: string; children?: string; src?: string };
type StyleEntry = { children?: string };

export type PageHeadInput = {
  path: string;
  title: string;
  description: string;
  lang?: Lang;
  image?: string | null;
  type?: string;
  robots?: string | null;
  extraMeta?: MetaEntry[];
  links?: LinkEntry[];
  styles?: StyleEntry[];
  scripts?: ScriptEntry[];
};

export function notFoundHead(path: string, lang: Lang = DEFAULT_LANG) {
  const T = getI18n(lang);
  return pageHead({
    path,
    title: `${T.notFound.h} — ${T.siteName}`,
    description: T.notFound.sub,
    lang,
    robots: "noindex, follow",
  });
}

export function pageHead(input: PageHeadInput) {
  const lang = input.lang ?? DEFAULT_LANG;
  const T = getI18n(lang);
  const image = input.image ?? DEFAULT_OG_IMAGE;
  const type = input.type ?? "website";

  const meta: MetaEntry[] = [
    { title: input.title },
    { name: "description", content: input.description },
    ...(input.robots ? [{ name: "robots", content: input.robots }] : []),
    ...(input.extraMeta ?? []),
    { property: "og:site_name", content: T.siteName },
    { property: "og:type", content: type },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:url", content: `${SITE.url}${input.path}` },
    ogLocaleMeta(lang),
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
  ];

  if (image) {
    meta.push(
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: image },
    );
  }

  return {
    meta,
    links: [...canonicalLinks(input.path, lang), ...(input.links ?? [])],
    ...(input.styles?.length ? { styles: input.styles } : {}),
    ...(input.scripts?.length ? { scripts: input.scripts } : {}),
  };
}
