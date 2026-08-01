import { getI18n } from "@/lib/i18n";
import type { Lang } from "@/lib/lang";
import { LANG_LOCALE } from "@/lib/lang";
import { pageHead } from "@/lib/page-head";
import { SITE, SERVICES_PATH } from "@/lib/site";

export function serviceToolHead(opts: {
  lang: Lang;
  path: string;
  title: string;
  description: string;
  pageName: string;
}) {
  const T = getI18n(opts.lang);
  const fullTitle = opts.title.includes(T.siteName) ? opts.title : `${opts.title} — ${T.siteName}`;
  return pageHead({
    path: opts.path,
    title: fullTitle,
    description: opts.description,
    lang: opts.lang,
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: opts.pageName,
          description: opts.description,
          url: `${SITE.url}${opts.path}`,
          applicationCategory: "HealthApplication",
          operatingSystem: "Any",
          inLanguage: LANG_LOCALE[opts.lang],
          isPartOf: { "@type": "WebSite", name: T.siteName, url: SITE.url },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: T.product.crumbHome, item: `${SITE.url}/` },
            {
              "@type": "ListItem",
              position: 2,
              name: T.services.breadcrumb,
              item: `${SITE.url}${SERVICES_PATH}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: opts.pageName,
              item: `${SITE.url}${opts.path}`,
            },
          ],
        }),
      },
    ],
  });
}
