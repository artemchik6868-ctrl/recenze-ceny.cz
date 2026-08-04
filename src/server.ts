import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { productLcpHintUrl } from "./lib/lcp-early-hint";
import { isCategoryPath, isProductPath } from "./lib/route-lang";
import { optimizePdpHtml, pdpCssEarlyHint } from "./lib/pdp-html-optimize";
import { buildSitemapResponse } from "./lib/sitemap.server";

const APEX_HOST = "recenze-ceny.cz";

/** Short edge TTL for public HTML. Listings slightly longer than PDP (prices / indexable). */
const HTML_EDGE_CACHE_LISTING =
  "public, max-age=0, s-maxage=60, stale-while-revalidate=300";
const HTML_EDGE_CACHE_PDP =
  "public, max-age=0, s-maxage=45, stale-while-revalidate=300";

const CACHEABLE_EXACT = new Set([
  "/",
  "/about",
  "/faq",
  "/terms",
  "/privacy",
  "/contact",
  "/delivery",
  "/payment",
  "/returns",
  "/medical-expert",
  "/category",
  "/product",
  "/pruvodce",
  "/sluzby",
  "/clanky",
]);

function isCacheableHtmlPath(pathname: string): boolean {
  if (requestIsServerFn(pathname)) return false;
  if (isProductPath(pathname)) return true;
  const path = pathname.replace(/\/$/, "") || "/";
  if (CACHEABLE_EXACT.has(path)) return true;
  if (isCategoryPath(pathname)) return true;
  if (path.startsWith("/category/")) return true;
  if (path.startsWith("/pruvodce/")) return true;
  if (path.startsWith("/delivery/")) return true;
  if (path.startsWith("/sluzby/")) return true;
  if (path.startsWith("/clanky/")) return true;
  return false;
}

function requestIsServerFn(pathname: string): boolean {
  return pathname.startsWith("/_serverFn");
}

function withHtmlEdgeCache(response: Response, request: Request): Response {
  if (request.method !== "GET" && request.method !== "HEAD") return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") || response.status !== 200) return response;
  const pathname = new URL(request.url).pathname;
  if (!isCacheableHtmlPath(pathname)) return response;
  if (response.headers.has("Cache-Control")) return response;

  const headers = new Headers(response.headers);
  headers.set(
    "Cache-Control",
    isProductPath(pathname) ? HTML_EDGE_CACHE_PDP : HTML_EDGE_CACHE_LISTING,
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function redirectWwwToApex(request: Request): Response | null {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (host !== `www.${APEX_HOST}`) return null;
  const target = new URL(request.url);
  target.protocol = "https:";
  target.host = APEX_HOST;
  return Response.redirect(target.toString(), 301);
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

const BOT_UA_RE =
  /googlebot|bingbot|yandex(?:bot|images)?|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|applebot|semrushbot|ahrefsbot|gptbot|claudebot|bytespider|petalsearch/i;

function isLikelyBot(userAgent: string): boolean {
  return BOT_UA_RE.test(userAgent);
}

/** Structured 5xx log for CF Workers Logs / Query Builder — errors only, negligible CPU. */
function logAvailabilityError(request: Request, status: number, reason?: string): void {
  const { pathname } = new URL(request.url);
  const ua = request.headers.get("user-agent") ?? "";
  console.warn(
    JSON.stringify({
      type: "availability_error",
      path: pathname,
      status,
      method: request.method,
      cfRay: request.headers.get("cf-ray"),
      country: request.headers.get("cf-ipcountry"),
      likelyBot: isLikelyBot(ua),
      ...(reason ? { reason } : {}),
    }),
  );
}

function healthResponse(): Response {
  return Response.json(
    { ok: true, t: Date.now() },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
        "content-type": "application/json; charset=utf-8",
      },
    },
  );
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
const FONT_EARLY_HINTS = [
  "</fonts/Newsreader-latin.woff2>; rel=preload; as=font; type=font/woff2; crossorigin=anonymous",
  "</fonts/Newsreader-latin-ext.woff2>; rel=preload; as=font; type=font/woff2; crossorigin=anonymous",
  "</fonts/Manrope-latin.woff2>; rel=preload; as=font; type=font/woff2; crossorigin=anonymous",
  "</fonts/Manrope-latin-ext.woff2>; rel=preload; as=font; type=font/woff2; crossorigin=anonymous",
];

async function optimizePdpResponse(
  response: Response,
  request: Request,
): Promise<{ response: Response; cssHint: string | null }> {
  const pathname = new URL(request.url).pathname;
  if (!isProductPath(pathname)) {
    return { response, cssHint: null };
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") || response.status >= 400) {
    return { response, cssHint: null };
  }

  const html = await response.text();
  const optimized = optimizePdpHtml(html, pathname);
  const cssHint = pdpCssEarlyHint(optimized, pathname);
  const headers = new Headers(response.headers);
  return {
    response: new Response(optimized, {
      status: response.status,
      statusText: response.statusText,
      headers,
    }),
    cssHint,
  };
}

function attachEarlyHints(response: Response, request: Request, htmlHint?: string | null): Response {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") || response.status >= 400) return response;

  const pathname = new URL(request.url).pathname;
  const hints: string[] = [];
  const lcpUrl = productLcpHintUrl(pathname);
  if (lcpUrl) {
    const partnerPreload =
      /\/api\/partner\//i.test(lcpUrl) || /kma\.biz/i.test(lcpUrl);
    const referrerPart = partnerPreload ? "; referrerpolicy=no-referrer" : "";
    hints.push(`<${lcpUrl}>; rel=preload; as=image; fetchpriority=high${referrerPart}`);
  }
  if (htmlHint) {
    hints.push(htmlHint);
  }
  hints.push(...FONT_EARLY_HINTS);
  if (hints.length === 0) return response;

  const headers = new Headers(response.headers);
  const existing = headers.get("Link");
  headers.set("Link", existing ? `${existing}, ${hints.join(", ")}` : hints.join(", "));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const wwwRedirect = redirectWwwToApex(request);
    if (wwwRedirect) return wwwRedirect;

    const { pathname } = new URL(request.url);
    if (pathname === "/api/public/health" || pathname === "/api/public/health/") {
      return healthResponse();
    }
    if (pathname === "/sitemap.xml") {
      return buildSitemapResponse();
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      if (normalized.status >= 500) {
        logAvailabilityError(request, normalized.status);
      }
      const { response: pdpOptimized, cssHint } = await optimizePdpResponse(normalized, request);
      const withHints = attachEarlyHints(pdpOptimized, request, cssHint);
      return withHtmlEdgeCache(withHints, request);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      logAvailabilityError(request, 500, reason);
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
