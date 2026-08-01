import { isProductPath } from "./route-lang";

/** Strip modulepreload links on PDP — JS loads via async module script only. */
export function optimizePdpHtml(html: string, pathname: string): string {
  if (!isProductPath(pathname)) return html;

  let out = html.replace(/<link rel="modulepreload"[^>]*>/g, "");

  // Drop duplicate LCP image preload (keep first).
  const lcpPreload = /<link rel="preload" as="image" href="[^"]+" fetchpriority="high"[^>]*\/>/gi;
  let seenLcp = false;
  out = out.replace(lcpPreload, (m) => {
    if (seenLcp) return "";
    seenLcp = true;
    return m;
  });

  // Partner CDN preloads need no-referrer (KMA hotlink protection).
  out = out.replace(
    /<link rel="preload" as="image"([^>]*)\/>/gi,
    (m, attrs: string) => {
      if (/referrerpolicy/i.test(attrs)) return m;
      if (
        /href="[^"]*\/api\/partner\//i.test(attrs) ||
        /href="[^"]*kma\.biz/i.test(attrs)
      ) {
        return `<link rel="preload" as="image"${attrs} referrerpolicy="no-referrer"/>`;
      }
      return m;
    },
  );

  return out;
}

const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://recenze-ceny.cz";

export function pdpCssEarlyHint(html: string, pathname: string): string | null {
  if (!isProductPath(pathname)) return null;
  const m = html.match(/<link rel="stylesheet" href="(\/assets\/styles-[^"]+\.css)"/);
  if (!m) return null;
  return `<${SITE_ORIGIN}${m[1]}>; rel=preload; as=style`;
}
