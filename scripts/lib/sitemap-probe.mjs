/**
 * Shared sitemap contract for Node probes (plain .mjs — no tsx).
 * Aligns with src/lib/sitemap.server.ts shard shape:
 *   /sitemap.xml → sitemapindex
 *   /sitemap-(static|categories|blog|products)(-N)?.xml → urlset
 */

export const MIN_PAGE_URLS = 10;
export const MIN_STATIC_URLS = 10;
export const SHARD_IDS = Object.freeze(["static", "categories", "blog", "products"]);
export const SHARD_PATH_RE =
  /^\/sitemap-(static|categories|blog|products)(?:-(\d+))?\.xml$/;

/**
 * @param {string} xml
 * @returns {string[]}
 */
export function parseLocs(xml) {
  return [...String(xml).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

/**
 * @param {string} xml
 * @returns {"index" | "urlset" | "invalid"}
 */
export function classifySitemapXml(xml) {
  const text = String(xml);
  if (text.includes("<sitemapindex")) return "index";
  if (text.includes("<urlset")) return "urlset";
  return "invalid";
}

/**
 * @param {string} urlOrPath
 * @returns {{ id: string, part: number, path: string } | null}
 */
export function parseShardPath(urlOrPath) {
  let path = String(urlOrPath).trim();
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname;
  } catch {
    return null;
  }
  const m = path.match(SHARD_PATH_RE);
  if (!m) return null;
  return { id: m[1], part: m[2] ? Number(m[2]) : 1, path };
}

/**
 * Soft majority / tail policy for repeated health attempts.
 * Hard-fail when failedAttempts ≥ failIfAttemptsGe, or the last attempt failed.
 * @param {number} failedAttempts
 * @param {boolean} lastOk
 * @param {number} [failIfAttemptsGe=2]
 */
export function decideHardFail(failedAttempts, lastOk, failIfAttemptsGe = 2) {
  return failedAttempts >= failIfAttemptsGe || !lastOk;
}

/**
 * @param {string} base
 * @param {(input: string, init?: RequestInit) => Promise<Response>} [fetchFn]
 */
function defaultFetch(base, fetchFn) {
  const fetcher = fetchFn ?? globalThis.fetch;
  return (url, init) =>
    fetcher(url, {
      cache: "no-store",
      redirect: "follow",
      ...init,
    });
}

/**
 * @param {Response} res
 * @returns {Promise<{ status: number, text: string }>}
 */
async function readXml(res) {
  return { status: res.status, text: await res.text() };
}

/**
 * Hourly / ops light probe: validate index contract + static shard + catalog signal.
 * Does not treat index shard locs as page URLs.
 *
 * @param {string} base
 * @param {(input: string, init?: RequestInit) => Promise<Response>} [fetchFn]
 * @returns {Promise<{
 *   ok: boolean,
 *   reason: string,
 *   status: number,
 *   kind: "index" | "urlset" | "invalid",
 *   shards: number,
 *   shardIds: string[],
 *   staticUrls: number,
 *   pageUrls: number,
 *   hasCatalogShard: boolean,
 * }>}
 */
export async function probeSitemapLight(base, fetchFn) {
  const root = String(base).replace(/\/$/, "");
  const fetchXml = defaultFetch(root, fetchFn);

  const indexRes = await fetchXml(`${root}/sitemap.xml`);
  const { status, text } = await readXml(indexRes);
  const kind = classifySitemapXml(text);

  if (status !== 200) {
    return emptyLight({ ok: false, reason: `index_status_${status}`, status, kind });
  }

  if (kind === "urlset") {
    const pageUrls = parseLocs(text).length;
    const ok = pageUrls >= MIN_PAGE_URLS;
    return {
      ok,
      reason: ok ? "ok_flat_urlset" : "flat_urlset_too_few_urls",
      status,
      kind,
      shards: 1,
      shardIds: ["static"],
      staticUrls: pageUrls,
      pageUrls,
      hasCatalogShard: false,
    };
  }

  if (kind !== "index") {
    return emptyLight({ ok: false, reason: "index_invalid_xml", status, kind });
  }

  const shardLocs = parseLocs(text);
  if (shardLocs.length === 0) {
    return emptyLight({ ok: false, reason: "index_empty", status, kind });
  }

  /** @type {{ id: string, part: number, path: string, url: string }[]} */
  const shards = [];
  for (const loc of shardLocs) {
    const parsed = parseShardPath(loc);
    if (!parsed) {
      return emptyLight({
        ok: false,
        reason: "shard_path_invalid",
        status,
        kind,
        shards: shardLocs.length,
      });
    }
    shards.push({ ...parsed, url: loc });
  }

  const shardIds = [...new Set(shards.map((s) => s.id))];
  const staticShard = shards.find((s) => s.id === "static");
  if (!staticShard) {
    return {
      ok: false,
      reason: "missing_static_shard",
      status,
      kind,
      shards: shards.length,
      shardIds,
      staticUrls: 0,
      pageUrls: 0,
      hasCatalogShard: shardIds.some((id) => id === "categories" || id === "products"),
    };
  }

  const staticRes = await fetchXml(staticShard.url);
  const staticBody = await readXml(staticRes);
  if (staticBody.status !== 200) {
    return {
      ok: false,
      reason: `static_status_${staticBody.status}`,
      status: staticBody.status,
      kind,
      shards: shards.length,
      shardIds,
      staticUrls: 0,
      pageUrls: 0,
      hasCatalogShard: shardIds.some((id) => id === "categories" || id === "products"),
    };
  }
  if (classifySitemapXml(staticBody.text) !== "urlset") {
    return {
      ok: false,
      reason: "static_not_urlset",
      status: staticBody.status,
      kind,
      shards: shards.length,
      shardIds,
      staticUrls: 0,
      pageUrls: 0,
      hasCatalogShard: shardIds.some((id) => id === "categories" || id === "products"),
    };
  }

  const staticUrls = parseLocs(staticBody.text).length;
  const hasCatalogShard = shardIds.some((id) => id === "categories" || id === "products");

  if (staticUrls < MIN_STATIC_URLS) {
    return {
      ok: false,
      reason: "static_too_few_urls",
      status: staticBody.status,
      kind,
      shards: shards.length,
      shardIds,
      staticUrls,
      pageUrls: staticUrls,
      hasCatalogShard,
    };
  }

  if (!hasCatalogShard) {
    return {
      ok: false,
      reason: "missing_catalog_shard",
      status: staticBody.status,
      kind,
      shards: shards.length,
      shardIds,
      staticUrls,
      pageUrls: staticUrls,
      hasCatalogShard,
    };
  }

  return {
    ok: true,
    reason: "ok",
    status: staticBody.status,
    kind,
    shards: shards.length,
    shardIds,
    staticUrls,
    pageUrls: staticUrls,
    hasCatalogShard,
  };
}

/**
 * Deep probe: walk every shard and aggregate page locs (preflight / audit / smoke).
 *
 * @param {string} base
 * @param {(input: string, init?: RequestInit) => Promise<Response>} [fetchFn]
 * @returns {Promise<{
 *   ok: boolean,
 *   reason: string,
 *   status: number,
 *   kind: "index" | "urlset" | "invalid",
 *   shards: number,
 *   shardIds: string[],
 *   locs: string[],
 *   pageUrls: number,
 * }>}
 */
export async function probeSitemapDeep(base, fetchFn) {
  const root = String(base).replace(/\/$/, "");
  const fetchXml = defaultFetch(root, fetchFn);

  const indexRes = await fetchXml(`${root}/sitemap.xml`);
  const { status, text } = await readXml(indexRes);
  const kind = classifySitemapXml(text);

  if (status !== 200) {
    return {
      ok: false,
      reason: `index_status_${status}`,
      status,
      kind,
      shards: 0,
      shardIds: [],
      locs: [],
      pageUrls: 0,
    };
  }

  if (kind === "urlset") {
    const locs = parseLocs(text);
    const ok = locs.length >= MIN_PAGE_URLS;
    return {
      ok,
      reason: ok ? "ok_flat_urlset" : "flat_urlset_too_few_urls",
      status,
      kind,
      shards: 1,
      shardIds: ["static"],
      locs,
      pageUrls: locs.length,
    };
  }

  if (kind !== "index") {
    return {
      ok: false,
      reason: "index_invalid_xml",
      status,
      kind,
      shards: 0,
      shardIds: [],
      locs: [],
      pageUrls: 0,
    };
  }

  const shardLocs = parseLocs(text);
  if (shardLocs.length === 0) {
    return {
      ok: false,
      reason: "index_empty",
      status,
      kind,
      shards: 0,
      shardIds: [],
      locs: [],
      pageUrls: 0,
    };
  }

  /** @type {string[]} */
  const shardIds = [];
  /** @type {string[]} */
  const locs = [];

  for (const shardUrl of shardLocs) {
    const parsed = parseShardPath(shardUrl);
    if (!parsed) {
      return {
        ok: false,
        reason: "shard_path_invalid",
        status,
        kind,
        shards: shardLocs.length,
        shardIds,
        locs,
        pageUrls: locs.length,
      };
    }
    if (!shardIds.includes(parsed.id)) shardIds.push(parsed.id);

    const shardRes = await fetchXml(shardUrl);
    const shardBody = await readXml(shardRes);
    if (shardBody.status !== 200 || classifySitemapXml(shardBody.text) !== "urlset") {
      return {
        ok: false,
        reason: `shard_fetch_failed_${parsed.id}`,
        status: shardBody.status || status,
        kind,
        shards: shardLocs.length,
        shardIds,
        locs,
        pageUrls: locs.length,
      };
    }
    locs.push(...parseLocs(shardBody.text));
  }

  const ok = locs.length >= MIN_PAGE_URLS;
  return {
    ok,
    reason: ok ? "ok" : "too_few_page_urls",
    status,
    kind,
    shards: shardLocs.length,
    shardIds,
    locs,
    pageUrls: locs.length,
  };
}

/**
 * @param {{
 *   ok: boolean,
 *   reason: string,
 *   status: number,
 *   kind: "index" | "urlset" | "invalid",
 *   shards?: number,
 * }} partial
 */
function emptyLight(partial) {
  return {
    ok: partial.ok,
    reason: partial.reason,
    status: partial.status,
    kind: partial.kind,
    shards: partial.shards ?? 0,
    shardIds: [],
    staticUrls: 0,
    pageUrls: 0,
    hasCatalogShard: false,
  };
}
