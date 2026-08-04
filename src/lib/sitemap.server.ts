/**
 * Lightweight sitemap builder — uses the same index policy as live pages.
 */
import { loadOffers } from "@/lib/offers.server";
import { isProductIndexable } from "@/lib/index-policy";
import { SITE, GUIDE_PATH, SERVICES_PATH, BLOG_PATH } from "@/lib/site";
import { CITIES, cityPath } from "@/lib/cities.cs";
import { canonicalCategorySlug, categoryPath } from "@/lib/category-path";
import { listPublishedBlogSitemapEntries } from "@/lib/blog.server";

export type SitemapEntry = {
  path: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
};

function formatLastmod(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function staticSitemapEntries(): SitemapEntry[] {
  return [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/category", changefreq: "weekly", priority: "0.8" },
    { path: "/about", changefreq: "monthly", priority: "0.6" },
    { path: "/contact", changefreq: "monthly", priority: "0.6" },
    { path: "/delivery", changefreq: "weekly", priority: "0.7" },
    ...CITIES.map((c) => ({
      path: cityPath(c.slug),
      changefreq: "weekly",
      priority: "0.65",
    })),
    { path: "/payment", changefreq: "monthly", priority: "0.6" },
    { path: "/faq", changefreq: "monthly", priority: "0.7" },
    { path: "/medical-expert", changefreq: "monthly", priority: "0.7" },
    { path: "/returns", changefreq: "monthly", priority: "0.5" },
    { path: "/product", changefreq: "daily", priority: "0.7" },
    { path: SERVICES_PATH, changefreq: "monthly", priority: "0.7" },
    { path: `${SERVICES_PATH}/kaloricka-kalkulacka`, changefreq: "monthly", priority: "0.6" },
    { path: `${SERVICES_PATH}/personalni-pomocnik`, changefreq: "monthly", priority: "0.6" },
    { path: `${SERVICES_PATH}/vodni-bilance`, changefreq: "monthly", priority: "0.6" },
    { path: BLOG_PATH, changefreq: "daily", priority: "0.75" },
    { path: "/privacy", changefreq: "yearly", priority: "0.3" },
    { path: "/terms", changefreq: "yearly", priority: "0.3" },
  ];
}

async function loadProductSitemapEntries(): Promise<SitemapEntry[]> {
  const offers = await loadOffers();
  const seenPaths = new Set<string>();
  const entries: SitemapEntry[] = [];

  for (const o of offers) {
    if (!isProductIndexable(o)) continue;
    const path = `/${o.categorySlug}/${o.slug}`;
    if (seenPaths.has(path)) continue;
    seenPaths.add(path);
    entries.push({
      path,
      changefreq: "weekly",
      priority: "0.7",
      lastmod: formatLastmod(o.contentGeneratedAt),
    });
  }

  return entries;
}

async function loadCategorySitemapEntries(productPaths: SitemapEntry[]): Promise<SitemapEntry[]> {
  const slugs = new Set<string>();
  for (const e of productPaths) {
    const m = e.path.match(/^\/([^/]+)\/[^/]+$/);
    if (m) slugs.add(canonicalCategorySlug(m[1]!));
  }
  return [...slugs]
    .sort()
    .map((slug) => ({
      path: categoryPath(slug),
      changefreq: "daily",
      priority: "0.8",
    }));
}

export async function buildSitemapEntries(): Promise<SitemapEntry[]> {
  const staticEntries = staticSitemapEntries();
  const products = await loadProductSitemapEntries();
  const categories = await loadCategorySitemapEntries(products);
  const guides = categories.map((c) => ({
    path: `${GUIDE_PATH}${c.path}`,
    changefreq: "weekly",
    priority: "0.75",
  }));
  const blogRows = await listPublishedBlogSitemapEntries().catch(() => []);
  const blogPosts: SitemapEntry[] = blogRows.map((row) => ({
    path: row.path,
    changefreq: "weekly",
    priority: "0.65",
    lastmod: formatLastmod(row.lastmod),
  }));
  return [...staticEntries, ...categories, ...guides, ...blogPosts, ...products];
}

export async function buildSitemapResponse(): Promise<Response> {
  try {
    const entries = await buildSitemapEntries();
    const blocks = entries.map((e) => {
      const href = `${SITE.url}${e.path}`;
      const safeLoc = escapeXml(href);
      const lines = [
        "  <url>",
        `    <loc>${safeLoc}</loc>`,
        e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
        `    <changefreq>${e.changefreq}</changefreq>`,
        `    <priority>${e.priority}</priority>`,
        `    <xhtml:link rel="alternate" hreflang="cs-CZ" href="${safeLoc}"/>`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${safeLoc}"/>`,
        "  </url>",
      ];
      return lines.filter(Boolean).join("\n");
    });
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${blocks.join("\n")}
</urlset>`;
    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sitemap] failed to build full sitemap, falling back to static:", message);
    try {
      const entries = staticSitemapEntries();
      const xml = await renderSitemapXml(entries);
      return new Response(xml, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=600",
        },
      });
    } catch {
      return new Response("Sitemap unavailable", { status: 503 });
    }
  }
}

// Legacy API used by existing route — delegates to DB-direct builder.
export async function renderSitemapXml(entries: SitemapEntry[]): Promise<string> {
  const siteUrl = SITE.url;
  const blocks = entries.map((e) => {
    const href = `${siteUrl}${e.path}`;
    const safeLoc = escapeXml(href);
    const lines = [
      "  <url>",
      `    <loc>${safeLoc}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      `    <changefreq>${e.changefreq}</changefreq>`,
      `    <priority>${e.priority}</priority>`,
      `    <xhtml:link rel="alternate" hreflang="cs-CZ" href="${safeLoc}"/>`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${safeLoc}"/>`,
      "  </url>",
    ];
    return lines.filter(Boolean).join("\n");
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${blocks.join("\n")}
</urlset>`;
}
