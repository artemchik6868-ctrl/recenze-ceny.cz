// Weekly GSC sitemap resubmit + status check.
//
// Uses Search Console Sitemaps API (webmasters.sitemaps.submit / get).
// This notifies Google to re-fetch the sitemap file — it does NOT force
// crawl of every URL. Per-URL recrawl stays in indexing-retry + Indexing API.
//
// Requires the same GOOGLE_INDEXING_SA_JSON service account with Owner in GSC,
// plus "Google Search Console API" enabled (same setup as indexing-retry).
//
// Cron: Mon 07:00 UTC via scheduled-tick. Manual: /api/public/hooks/submit-sitemap.

import { SITE } from "@/lib/site";
import { getGoogleAccessToken, GOOGLE_SCOPE_WEBMASTERS } from "./google-sa.server";

const GSC_SITE_URL =
  process.env.GSC_SITE_URL ?? `sc-domain:${new URL(SITE.url).hostname}`;

export const SITEMAP_FEED_URL = `${SITE.url}/sitemap.xml`;

type GscSitemapResource = {
  path?: string;
  lastSubmitted?: string;
  lastDownloaded?: string;
  isPending?: boolean;
  isSitemapsIndex?: boolean;
  type?: string;
  errors?: string | number;
  warnings?: string | number;
};

export type SitemapSubmitResult = {
  ok: boolean;
  dryRun: boolean;
  feedpath: string;
  siteUrl: string;
  submitted: boolean;
  skipped?: "no_token";
  error?: string;
  status?: {
    path: string | null;
    lastSubmitted: string | null;
    lastDownloaded: string | null;
    isPending: boolean | null;
    errors: number | null;
    warnings: number | null;
  };
};

function sitemapApiUrl(siteUrl: string, feedpath: string): string {
  return `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(feedpath)}`;
}

function parseCount(value: string | number | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toStatus(body: GscSitemapResource): SitemapSubmitResult["status"] {
  return {
    path: body.path ?? null,
    lastSubmitted: body.lastSubmitted ?? null,
    lastDownloaded: body.lastDownloaded ?? null,
    isPending: typeof body.isPending === "boolean" ? body.isPending : null,
    errors: parseCount(body.errors),
    warnings: parseCount(body.warnings),
  };
}

export async function submitSitemapToGsc(
  token: string,
  opts: { siteUrl?: string; feedpath?: string } = {},
): Promise<{ ok: true } | { ok: false; error: string }> {
  const siteUrl = opts.siteUrl ?? GSC_SITE_URL;
  const feedpath = opts.feedpath ?? SITEMAP_FEED_URL;
  try {
    const res = await fetch(sitemapApiUrl(siteUrl, feedpath), {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `${res.status} ${text}`.slice(0, 500) };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg.slice(0, 500) };
  }
}

export async function getSitemapFromGsc(
  token: string,
  opts: { siteUrl?: string; feedpath?: string } = {},
): Promise<{ ok: true; body: GscSitemapResource } | { ok: false; error: string }> {
  const siteUrl = opts.siteUrl ?? GSC_SITE_URL;
  const feedpath = opts.feedpath ?? SITEMAP_FEED_URL;
  try {
    const res = await fetch(sitemapApiUrl(siteUrl, feedpath), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await res.json().catch(() => ({}))) as GscSitemapResource & {
      error?: { message?: string };
    };
    if (!res.ok) {
      const msg = body.error?.message ?? `${res.status} ${JSON.stringify(body)}`.slice(0, 500);
      return { ok: false, error: msg };
    }
    return { ok: true, body };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg.slice(0, 500) };
  }
}

export async function runSitemapSubmit(opts: { dryRun?: boolean } = {}): Promise<SitemapSubmitResult> {
  const dryRun = opts.dryRun === true;
  const feedpath = SITEMAP_FEED_URL;
  const siteUrl = GSC_SITE_URL;

  const token = await getGoogleAccessToken(GOOGLE_SCOPE_WEBMASTERS);
  if (!token) {
    console.warn("[gsc-sitemap] no GSC token — skip sitemap submit");
    return {
      ok: false,
      dryRun,
      feedpath,
      siteUrl,
      submitted: false,
      skipped: "no_token",
    };
  }

  let submitted = false;
  if (!dryRun) {
    const submit = await submitSitemapToGsc(token, { siteUrl, feedpath });
    if (!submit.ok) {
      console.warn(`[gsc-sitemap] submit failed: ${submit.error}`);
      return {
        ok: false,
        dryRun,
        feedpath,
        siteUrl,
        submitted: false,
        error: submit.error,
      };
    }
    submitted = true;
  }

  const get = await getSitemapFromGsc(token, { siteUrl, feedpath });
  if (!get.ok) {
    console.warn(`[gsc-sitemap] get failed: ${get.error}`);
    return {
      ok: submitted || dryRun,
      dryRun,
      feedpath,
      siteUrl,
      submitted,
      error: get.error,
    };
  }

  const status = toStatus(get.body);
  console.info(
    `[gsc-sitemap] ok submitted=${submitted} dryRun=${dryRun} lastSubmitted=${status?.lastSubmitted ?? "-"} lastDownloaded=${status?.lastDownloaded ?? "-"} errors=${status?.errors ?? 0} warnings=${status?.warnings ?? 0}`,
  );

  return {
    ok: true,
    dryRun,
    feedpath,
    siteUrl,
    submitted,
    status,
  };
}
