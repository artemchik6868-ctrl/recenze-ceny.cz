import assert from "node:assert/strict";
import {
  classifySitemapXml,
  decideHardFail,
  parseLocs,
  parseShardPath,
  probeSitemapLight,
  probeSitemapDeep,
  MIN_STATIC_URLS,
} from "./lib/sitemap-probe.mjs";

let failed = 0;

function ok(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === "function") {
      return result.then(
        () => console.log(`ok - ${name}`),
        (err) => {
          failed += 1;
          console.error(`fail - ${name}`);
          console.error(err);
        },
      );
    }
    console.log(`ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`fail - ${name}`);
    console.error(err);
  }
}

const SITE = "https://recenze-ceny.cz";

function indexXml(shardPaths) {
  const blocks = shardPaths
    .map(
      (p) => `  <sitemap>
    <loc>${SITE}${p}</loc>
  </sitemap>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${blocks}
</sitemapindex>`;
}

function urlsetXml(paths) {
  const urls = paths
    .map(
      (p) => `  <url>
    <loc>${SITE}${p}</loc>
  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

const STATIC_PATHS = Array.from({ length: 12 }, (_, i) => `/page-${i}`);
const CATEGORY_PATHS = ["/klouby/", "/autodoplnky/"];
const PRODUCT_PATHS = ["/klouby/product-a/", "/autodoplnky/product-b/"];

/**
 * @param {Record<string, { status?: number, body: string }>} map
 */
function mockFetch(map) {
  return async (input) => {
    const url = String(input);
    const path = new URL(url).pathname;
    const hit = map[path] ?? map[url];
    if (!hit) {
      return new Response("not found", { status: 404 });
    }
    return new Response(hit.body, {
      status: hit.status ?? 200,
      headers: { "Content-Type": "application/xml" },
    });
  };
}

ok("classifySitemapXml", () => {
  assert.equal(classifySitemapXml("<sitemapindex></sitemapindex>"), "index");
  assert.equal(classifySitemapXml("<urlset></urlset>"), "urlset");
  assert.equal(classifySitemapXml("<html></html>"), "invalid");
});

ok("parseLocs + parseShardPath", () => {
  assert.deepEqual(parseLocs("<loc>a</loc><loc>b</loc>"), ["a", "b"]);
  assert.deepEqual(parseShardPath(`${SITE}/sitemap-static.xml`), {
    id: "static",
    part: 1,
    path: "/sitemap-static.xml",
  });
  assert.deepEqual(parseShardPath("/sitemap-products-2.xml"), {
    id: "products",
    part: 2,
    path: "/sitemap-products-2.xml",
  });
  assert.equal(parseShardPath("/sitemap-unknown.xml"), null);
});

ok("decideHardFail soft majority / tail", () => {
  assert.equal(decideHardFail(0, true), false);
  assert.equal(decideHardFail(1, true), false);
  assert.equal(decideHardFail(1, false), true);
  assert.equal(decideHardFail(2, true), true);
  assert.equal(decideHardFail(2, false), true);
});

await ok("light: healthy index + 4 shards", async () => {
  const fetchFn = mockFetch({
    "/sitemap.xml": {
      body: indexXml([
        "/sitemap-static.xml",
        "/sitemap-categories.xml",
        "/sitemap-blog.xml",
        "/sitemap-products.xml",
      ]),
    },
    "/sitemap-static.xml": { body: urlsetXml(STATIC_PATHS) },
    "/sitemap-categories.xml": { body: urlsetXml(CATEGORY_PATHS) },
    "/sitemap-blog.xml": { body: urlsetXml(["/clanky/post-1/"]) },
    "/sitemap-products.xml": { body: urlsetXml(PRODUCT_PATHS) },
  });
  const result = await probeSitemapLight(SITE, fetchFn);
  assert.equal(result.ok, true);
  assert.equal(result.reason, "ok");
  assert.equal(result.shards, 4);
  assert.equal(result.staticUrls, STATIC_PATHS.length);
  assert.equal(result.hasCatalogShard, true);
  assert.ok(result.staticUrls >= MIN_STATIC_URLS);
});

await ok("light: must not treat index 4 locs as page URLs (old false positive)", async () => {
  // Index only — no shard bodies served. Old probe counted 4 locs and failed urls>=10.
  // New light probe must fail for missing static fetch, NOT because "4 < 10".
  const fetchFn = mockFetch({
    "/sitemap.xml": {
      body: indexXml([
        "/sitemap-static.xml",
        "/sitemap-categories.xml",
        "/sitemap-blog.xml",
        "/sitemap-products.xml",
      ]),
    },
  });
  const result = await probeSitemapLight(SITE, fetchFn);
  assert.equal(result.ok, false);
  assert.equal(result.shards, 4);
  assert.equal(result.reason, "static_status_404");
  assert.notEqual(result.reason, "flat_urlset_too_few_urls");
});

await ok("light: broken static shard", async () => {
  const fetchFn = mockFetch({
    "/sitemap.xml": {
      body: indexXml(["/sitemap-static.xml", "/sitemap-products.xml"]),
    },
    "/sitemap-static.xml": { status: 500, body: "error" },
    "/sitemap-products.xml": { body: urlsetXml(PRODUCT_PATHS) },
  });
  const result = await probeSitemapLight(SITE, fetchFn);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "static_status_500");
});

await ok("light: static too few URLs", async () => {
  const fetchFn = mockFetch({
    "/sitemap.xml": {
      body: indexXml(["/sitemap-static.xml", "/sitemap-categories.xml"]),
    },
    "/sitemap-static.xml": { body: urlsetXml(["/a", "/b"]) },
    "/sitemap-categories.xml": { body: urlsetXml(CATEGORY_PATHS) },
  });
  const result = await probeSitemapLight(SITE, fetchFn);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "static_too_few_urls");
  assert.equal(result.staticUrls, 2);
});

await ok("light: invalid shard path", async () => {
  const fetchFn = mockFetch({
    "/sitemap.xml": {
      body: indexXml(["/sitemap-weird.xml", "/sitemap-static.xml"]),
    },
  });
  const result = await probeSitemapLight(SITE, fetchFn);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "shard_path_invalid");
});

await ok("light: missing catalog shard", async () => {
  const fetchFn = mockFetch({
    "/sitemap.xml": {
      body: indexXml(["/sitemap-static.xml", "/sitemap-blog.xml"]),
    },
    "/sitemap-static.xml": { body: urlsetXml(STATIC_PATHS) },
    "/sitemap-blog.xml": { body: urlsetXml(["/clanky/x/"]) },
  });
  const result = await probeSitemapLight(SITE, fetchFn);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "missing_catalog_shard");
});

await ok("deep: aggregates page URLs across shards", async () => {
  const fetchFn = mockFetch({
    "/sitemap.xml": {
      body: indexXml(["/sitemap-static.xml", "/sitemap-products.xml"]),
    },
    "/sitemap-static.xml": { body: urlsetXml(STATIC_PATHS) },
    "/sitemap-products.xml": { body: urlsetXml(PRODUCT_PATHS) },
  });
  const result = await probeSitemapDeep(SITE, fetchFn);
  assert.equal(result.ok, true);
  assert.equal(result.pageUrls, STATIC_PATHS.length + PRODUCT_PATHS.length);
  assert.equal(result.locs.length, result.pageUrls);
  assert.equal(result.shards, 2);
});

await ok("deep: flat urlset still accepted", async () => {
  const fetchFn = mockFetch({
    "/sitemap.xml": { body: urlsetXml(STATIC_PATHS) },
  });
  const result = await probeSitemapDeep(SITE, fetchFn);
  assert.equal(result.ok, true);
  assert.equal(result.kind, "urlset");
  assert.equal(result.pageUrls, STATIC_PATHS.length);
});

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nall sitemap-probe tests passed");
