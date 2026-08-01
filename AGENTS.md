# AGENTS.md — SEO & routing conventions

Czech storefront (`recenze-ceny.cz`). TanStack Start SSR on Cloudflare Workers.

## How SEO works

1. **SSR first** — catalog data loads in route `loader` → `createServerFn` → Supabase. Crawlers get full HTML without JS.
2. **Page meta** — use `pageHead()` from `src/lib/page-head.ts` for every public route.
3. **Indexation** — reuse `isProductIndexable()` / `isCategoryIndexable()` from `src/lib/index-policy.ts` (always-on for catalog URLs); do not duplicate rules.
4. **JSON-LD** — add `scripts` in the same `head()` return; copy patterns from nearby routes.

## Adding a new page

```ts
import { pageHead } from "@/lib/page-head";
import { pathLang } from "@/lib/route-lang";
import { getI18n } from "@/lib/i18n";
import { DEFAULT_LANG } from "@/lib/lang";

head: ({ match }) => {
  const { lang } = pathLang(match.pathname);
  const T = getI18n(lang);
  return pageHead({
    path: "/delivery",
    title: `${T.delivery.title} — ${T.siteName}`,
    description: T.delivery.intro,
    lang,
  });
},
```

When a route has no `pathLang()` (static path), pass `lang: DEFAULT_LANG` explicitly.

`pageHead()` defaults to `DEFAULT_LANG` (`cs`) for `og:locale` and hreflang.

`pageHead()` always emits: title, description, canonical, hreflang (cs-CZ + x-default), Open Graph, Twitter Card, default `og-image.jpg`.

Optional fields: `image`, `type` (default `website`), `robots`, `extraMeta`, `links`, `scripts`, `styles`.

## PDP content slot (legacy `*_uk`)

Czech AI body/FAQ lives in `product_content.*_uk` columns. That suffix is a **legacy DB slot name**, not the UI locale (`cs`). Use `PDP_CONTENT_SLOT` / `pdpSlotCol` / `readPdpSlotRow` from `src/lib/market.ts` — do not hardcode `*_uk` in new UI or server paths, and never treat the slot as `useLang()`.

## Product pages (PDP)

Use `productHead()` in `src/lib/product-page.tsx` — it wraps `pageHead()` with product title/desc, LCP preload, critical CSS, and Product JSON-LD when content is ready.

Loader pattern (`src/lib/product-page.server.ts`):

```ts
// offer + aiContent + related — all server-side for first HTML
const data = await loadProductPageData(slug);
```

PDP meta strings (title slots, CTA, description parts) live in `src/lib/pdp-variants.ts`. Length/AI-merge logic stays in `src/lib/seo-meta.ts` — call `metaDescPartsFor` + `metaCtaFor`, don't inline locale strings.

Pending body (no AI content yet):

```ts
import { csPlaceholderHtml } from "@/lib/ai-content.cs-fallbacks";

const html = csPlaceholderHtml(displayTitle, {
  categorySlug: offer.categorySlug,
  formKind: "generic_item",
});
```

## Indexation

Catalog indexation is **always-on**. `isProductIndexable(offer)` is true whenever the offer has a public PDP path (`categorySlug` + `slug`) — AI content, `contentGeneratedAt`, category resolution, and `other` do **not** gate robots or sitemap. `isCategoryIndexable()` always returns `true`. Real 404s still use `notFoundHead()` → `noindex, follow`.

```ts
import { isProductIndexable, robotsNoindexMeta } from "@/lib/index-policy";

const robots = robotsNoindexMeta(isProductIndexable(offer));
return pageHead({
  path: hiPath,
  title,
  description: desc,
  robots: robots?.content ?? null,
});
```

Sitemap (`src/lib/sitemap.server.ts`) uses the same `isProductIndexable()` filter.

## JSON-LD examples

- Home: FAQPage + ItemList — `src/routes/index.tsx`
- Category: CollectionPage + BreadcrumbList + FAQPage — `src/routes/$cat.index.tsx` (canonical `/{slug}/`)
- Product: `@graph` Product/Review — `src/lib/product-structured-data.ts`
- Legal with FAQ: FAQPage — `src/components/LegalPageView.tsx`

### Schema locale (PDP)

Expert and market fields come from i18n + site constants — same as `medical-expert.tsx`:

```ts
const M = getI18n(lang).medicalExpert;
const marketCountry = SITE.address.country;
// reviewedBy: { name: M.name, jobTitle: M.title, url: `${SITE.url}/medical-expert` }
// applicableCountry / addressCountry: marketCountry
// FAQPage in @graph only when faq.length > 0
```

### Category lists (meta + JSON-LD + grid)

Filter before count, ItemList, and product grid:

```ts
import { isProductIndexable, isCategoryIndexable, robotsNoindexMeta } from "@/lib/index-policy";
import { offerDisplayTitle } from "@/lib/offer-display";

const visible = offers.filter(isProductIndexable);
const count = visible.length;
const robots = robotsNoindexMeta(isCategoryIndexable(count));
// ItemList: visible.slice(0, 20), name: offerDisplayTitle(o)
```

### notFound pages

```ts
import { notFoundHead } from "@/lib/page-head";

head: ({ match, loaderData }) => {
  if (!loaderData?.category) return notFoundHead(`/${params.slug}`);
  // ...
};
```

Category hubs live at `/{slug}/` (canonical). Legacy `/category/{slug}` 301s to the hub. The `/category/` index remains the all-categories directory. Use `categoryPath(slug)` from `src/lib/category-path.ts` for links, sitemap, and JSON-LD.

Catch-all `src/routes/$.tsx` uses the same helper.

When loaders `throw notFound()`, route `head()` may not run — `__root.tsx` covers this:

```ts
import { notFoundHead } from "@/lib/page-head";
import { DEFAULT_LANG } from "@/lib/lang";
import { headPathname } from "@/lib/head-pathname";

head: (ctx) => {
  const pathname = headPathname(ctx);
  if (ctx.matches.some((m) => m.status === "notFound")) {
    return notFoundHead(pathname, DEFAULT_LANG);
  }
  // essential meta…
};
```

### Internal link grids

Loader-fed product grids render directly — no `React.lazy` on category/related grids (data is already in the loader).

## Prefer

- `categoryPath(slug)` for category hub URLs (not `/category/{slug}`)
- `offerDisplayTitle(offer)` for visible names and schema `name` fields
- `canonicalLinks()` via `pageHead()` — not hand-built `<link rel="canonical">`
- Loader-seeded data for internal links (related products, category grids)

## Avoid (soft guidance)

- Hand-rolling `meta: [{ property: "og:title" }]` without `pageHead()` — easy to drop Twitter/image tags
- Client-only `useQuery` for SEO-important internal links
- Adding URLs to sitemap without passing `isProductIndexable()`

## Root layout

`src/routes/__root.tsx` — essential meta (charset, viewport, GSC), fonts, favicons, Organization/WebSite JSON-LD on non-PDP pages. Per-page title/OG/Twitter come from route `head()` via `pageHead()`.

## QA

```bash
npm run seo:preflight
npm run test:seo-meta-cz
```
