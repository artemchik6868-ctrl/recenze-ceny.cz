// GSC URL Inspection + smart retry for URLs that were pinged but not indexed.
//
// Requires the same GOOGLE_INDEXING_SA_JSON service account with Owner in GSC,
// plus "Google Search Console API" enabled in GCP (searchconsole.googleapis.com).
//
// Flow (daily cron):
//   1. Inspect URLs previously notified via Google Indexing API (GSC quota ~2000/day).
//   2. Re-notify only non-indexed URLs whose last ping is older than RETRY_COOLDOWN_DAYS.
//
// Related: weekly sitemap resubmit is separate — see gsc-sitemap.server.ts
// (Mon 07:00 UTC /api/public/hooks/submit-sitemap). That re-fetches sitemap.xml only.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE } from "@/lib/site";
import { getGoogleAccessToken, GOOGLE_SCOPE_WEBMASTERS } from "./google-sa.server";
import { pingGoogleIndexing, pingIndexNow } from "./indexers.server";

const GSC_SITE_URL =
  process.env.GSC_SITE_URL ?? `sc-domain:${new URL(SITE.url).hostname}`;
const RETRY_COOLDOWN_DAYS = 7;
const INSPECT_STALE_DAYS = 7;
const DEFAULT_INSPECT_LIMIT = 15;
const DEFAULT_NOTIFY_LIMIT = 30;
const INSPECT_DELAY_MS = 250;

type IndexStatusRow = {
  url: string;
  indexed: boolean | null;
  verdict: string | null;
  coverage_state: string | null;
  last_inspected_at: string | null;
  last_notified_at: string | null;
  retry_after: string | null;
  inspect_error: string | null;
};

type GscIndexStatus = {
  verdict?: string;
  coverageState?: string;
};

type GscInspectResponse = {
  inspectionResult?: {
    indexStatusResult?: GscIndexStatus;
  };
  error?: { message?: string };
};

export type IndexingRetryResult = {
  ok: true;
  inspected: number;
  indexedFound: number;
  notIndexed: number;
  inspectErrors: number;
  retried: number;
  retrySkipped: number;
  dryRun: boolean;
};

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function daysFromNowIso(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function parseGscIndexed(result: GscInspectResponse): boolean | null {
  const idx = result.inspectionResult?.indexStatusResult;
  if (!idx) return null;
  const verdict = idx.verdict ?? "";
  if (verdict === "PASS" || verdict === "PARTIAL") return true;
  if (verdict === "FAIL") return false;
  const state = (idx.coverageState ?? "").toLowerCase();
  // EN + CS (and other locales) coverage strings from GSC.
  if (
    state.includes("not indexed") ||
    state.includes("unknown to google") ||
    state.includes("nezná") ||
    state.includes("nezna") ||
    state.includes("neindexov")
  ) {
    return false;
  }
  if (state.includes("indexed") || state.includes("indexováno") || state.includes("indexovano")) {
    return true;
  }
  return null;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function upsertIndexingStatusBatch(
  rows: Array<{ url: string } & Partial<Omit<IndexStatusRow, "url">>>,
): Promise<void> {
  const chunk = 40;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk).map((row) => ({
      ...row,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabaseAdmin.from("indexing_status").upsert(slice, { onConflict: "url" });
    if (error) console.warn("[indexing-retry] batch upsert failed:", error.message);
  }
}

async function upsertIndexingStatus(
  url: string,
  patch: Partial<Omit<IndexStatusRow, "url">>,
): Promise<void> {
  await upsertIndexingStatusBatch([{ url, ...patch }]);
}

async function loadNotifiedUrls(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const { data, error } = await supabaseAdmin
    .from("indexing_log")
    .select("url, created_at")
    .eq("provider", "google")
    .eq("status", "ok")
    .order("created_at", { ascending: false })
    .limit(3000);
  if (error) {
    console.warn("[indexing-retry] indexing_log read failed:", error.message);
    return map;
  }
  for (const row of data ?? []) {
    if (!map.has(row.url)) map.set(row.url, row.created_at);
  }
  return map;
}

async function loadStatusMap(urls: string[]): Promise<Map<string, IndexStatusRow>> {
  const map = new Map<string, IndexStatusRow>();
  if (urls.length === 0) return map;
  const chunk = 200;
  for (let i = 0; i < urls.length; i += chunk) {
    const slice = urls.slice(i, i + chunk);
    const { data, error } = await supabaseAdmin
      .from("indexing_status")
      .select("*")
      .in("url", slice);
    if (error) {
      console.warn("[indexing-retry] indexing_status read failed:", error.message);
      continue;
    }
    for (const row of (data ?? []) as IndexStatusRow[]) map.set(row.url, row);
  }
  return map;
}

async function inspectUrl(
  inspectionUrl: string,
  token: string,
): Promise<{ ok: true; body: GscInspectResponse } | { ok: false; error: string }> {
  try {
    const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inspectionUrl,
        siteUrl: GSC_SITE_URL,
        languageCode: "cs-CZ",
      }),
    });
    const body = (await res.json().catch(() => ({}))) as GscInspectResponse;
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

function pickInspectCandidates(
  notified: Map<string, string>,
  statusMap: Map<string, IndexStatusRow>,
  limit: number,
): string[] {
  const staleBefore = daysAgoIso(INSPECT_STALE_DAYS);
  const candidates: { url: string; score: number }[] = [];
  for (const [url, lastNotifiedAt] of notified) {
    const status = statusMap.get(url);
    if (status?.indexed === true) continue;
    if (!status?.last_inspected_at) {
      candidates.push({ url, score: 0 });
      continue;
    }
    if (status.last_inspected_at < staleBefore) {
      candidates.push({ url, score: 1 });
      continue;
    }
    if (status.inspect_error) {
      candidates.push({ url, score: 2 });
    }
    void lastNotifiedAt;
  }
  candidates.sort((a, b) => a.score - b.score);
  return candidates.slice(0, limit).map((c) => c.url);
}

function pickRetryCandidates(
  statusMap: Map<string, IndexStatusRow>,
  notified: Map<string, string>,
  limit: number,
): string[] {
  const notifyCooldownBefore = daysAgoIso(RETRY_COOLDOWN_DAYS);
  const now = new Date().toISOString();
  const out: string[] = [];
  for (const [url, status] of statusMap) {
    if (status.indexed === true) continue;
    if (status.indexed === null && !status.last_inspected_at) continue;
    if (status.retry_after && status.retry_after > now) continue;
    const lastNotified = status.last_notified_at ?? notified.get(url);
    if (!lastNotified || lastNotified > notifyCooldownBefore) continue;
    out.push(url);
    if (out.length >= limit) break;
  }
  return out;
}

export async function runIndexingRetry(opts: {
  inspectLimit?: number;
  notifyLimit?: number;
  dryRun?: boolean;
} = {}): Promise<IndexingRetryResult> {
  const inspectLimit = opts.inspectLimit ?? DEFAULT_INSPECT_LIMIT;
  const notifyLimit = opts.notifyLimit ?? DEFAULT_NOTIFY_LIMIT;
  const dryRun = opts.dryRun === true;

  const notified = await loadNotifiedUrls();
  const allUrls = [...notified.keys()];
  let statusMap = await loadStatusMap(allUrls);

  // Seed last_notified_at from indexing_log for rows we have not tracked yet.
  const seedRows: Array<{ url: string; last_notified_at: string }> = [];
  for (const [url, createdAt] of notified) {
    const existing = statusMap.get(url);
    if (!existing) {
      const seed: IndexStatusRow = {
        url,
        indexed: null,
        verdict: null,
        coverage_state: null,
        last_inspected_at: null,
        last_notified_at: createdAt,
        retry_after: null,
        inspect_error: null,
      };
      statusMap.set(url, seed);
      seedRows.push({ url, last_notified_at: createdAt });
    } else if (!existing.last_notified_at) {
      existing.last_notified_at = createdAt;
      seedRows.push({ url, last_notified_at: createdAt });
    }
  }
  if (!dryRun && seedRows.length > 0) {
    await upsertIndexingStatusBatch(seedRows);
  }

  const inspectCandidates = pickInspectCandidates(notified, statusMap, inspectLimit);
  let inspected = 0;
  let indexedFound = 0;
  let notIndexed = 0;
  let inspectErrors = 0;

  // dry_run still calls GSC (read-only) so metrics are real; DB writes + notify are skipped.
  const inspectToken = await getGoogleAccessToken(GOOGLE_SCOPE_WEBMASTERS);
  if (inspectCandidates.length > 0 && !inspectToken) {
    console.warn("[indexing-retry] no GSC token — skip inspect phase");
  }

  const inspectUpdates: Array<{ url: string } & Partial<Omit<IndexStatusRow, "url">>> = [];

  for (const url of inspectCandidates) {
    if (!inspectToken) break;

    const result = await inspectUrl(url, inspectToken);
    inspected += 1;
    const now = new Date().toISOString();

    if (!result.ok) {
      inspectErrors += 1;
      inspectUpdates.push({
        url,
        inspect_error: result.error,
        last_inspected_at: now,
        retry_after: daysFromNowIso(INSPECT_STALE_DAYS),
      });
      const row = statusMap.get(url);
      if (row) {
        row.inspect_error = result.error;
        row.last_inspected_at = now;
      }
      await sleep(INSPECT_DELAY_MS);
      continue;
    }

    const idx = result.body.inspectionResult?.indexStatusResult;
    const indexed = parseGscIndexed(result.body);
    if (indexed === true) indexedFound += 1;
    else if (indexed === false) notIndexed += 1;

    inspectUpdates.push({
      url,
      indexed,
      verdict: idx?.verdict ?? null,
      coverage_state: idx?.coverageState ?? null,
      last_inspected_at: now,
      inspect_error: null,
      retry_after: indexed === true ? null : daysFromNowIso(RETRY_COOLDOWN_DAYS),
    });

    const row = statusMap.get(url) ?? {
      url,
      indexed: null,
      verdict: null,
      coverage_state: null,
      last_inspected_at: null,
      last_notified_at: notified.get(url) ?? null,
      retry_after: null,
      inspect_error: null,
    };
    row.indexed = indexed;
    row.verdict = idx?.verdict ?? null;
    row.coverage_state = idx?.coverageState ?? null;
    row.last_inspected_at = now;
    row.inspect_error = null;
    row.retry_after = indexed === true ? null : daysFromNowIso(RETRY_COOLDOWN_DAYS);
    statusMap.set(url, row);

    await sleep(INSPECT_DELAY_MS);
  }

  if (!dryRun && inspectUpdates.length > 0) {
    await upsertIndexingStatusBatch(inspectUpdates);
  }

  const retryCandidates = pickRetryCandidates(statusMap, notified, notifyLimit);
  let retried = 0;
  const retrySkipped = retryCandidates.length;

  if (retryCandidates.length > 0 && !dryRun) {
    await Promise.allSettled([
      pingGoogleIndexing(retryCandidates),
      pingIndexNow(retryCandidates),
    ]);
    const now = new Date().toISOString();
    await upsertIndexingStatusBatch(
      retryCandidates.map((url) => ({
        url,
        last_notified_at: now,
        retry_after: daysFromNowIso(RETRY_COOLDOWN_DAYS),
      })),
    );
    retried = retryCandidates.length;
  } else if (dryRun && retryCandidates.length > 0) {
    // Would-retry count only — no IndexNow / Google Indexing pings.
    retried = retryCandidates.length;
  }

  return {
    ok: true,
    inspected,
    indexedFound,
    notIndexed,
    inspectErrors,
    retried,
    retrySkipped: Math.max(0, retrySkipped - retried),
    dryRun,
  };
}
