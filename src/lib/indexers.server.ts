// Fire-and-forget notifications to search engines about new/updated URLs.
//
// Providers:
// - IndexNow (Bing, Yandex, Seznam, Naver) — instant, no OAuth, no daily limit.
// - Google Indexing API — requires a service account; officially supports only
//   JobPosting/BroadcastEvent, but works in practice for other pages. Hard daily
//   quota of 200 URL notifications per project — we enforce it via indexing_log.
//
// Both providers are best-effort: failures are logged to indexing_log but never
// surfaced to callers. Designed to be invoked without `await` from sync paths.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getGoogleAccessToken, GOOGLE_SCOPE_INDEXING } from "./google-sa.server";

const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const INDEXNOW_HOST = "recenze-ceny.cz";
const INDEXNOW_KEY_LOCATION = INDEXNOW_KEY
  ? `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`
  : null;

const GOOGLE_SA_JSON = process.env.GOOGLE_INDEXING_SA_JSON;
const GOOGLE_DAILY_LIMIT = 200;

type LogRow = {
  url: string;
  provider: "indexnow" | "google";
  status: "ok" | "error" | "skipped_quota" | "skipped_config";
  error?: string | null;
};

async function logBatch(rows: LogRow[]): Promise<void> {
  if (rows.length === 0) return;
  try {
    await supabaseAdmin.from("indexing_log").insert(rows);
  } catch (err) {
    console.warn("[indexers] failed to write indexing_log:", err);
  }
}

function dedupe(urls: string[]): string[] {
  return [...new Set(urls.filter((u) => typeof u === "string" && u.length > 0))];
}

// ---------- IndexNow ----------

export async function pingIndexNow(urls: string[]): Promise<void> {
  const list = dedupe(urls);
  if (list.length === 0) return;
  if (!INDEXNOW_KEY || !INDEXNOW_KEY_LOCATION) {
    await logBatch(
      list.map((url) => ({ url, provider: "indexnow", status: "skipped_config" })),
    );
    return;
  }
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: INDEXNOW_HOST,
        key: INDEXNOW_KEY,
        keyLocation: INDEXNOW_KEY_LOCATION,
        urlList: list,
      }),
    });
    const ok = res.ok || res.status === 202;
    const errorText = ok ? null : `${res.status} ${await res.text().catch(() => "")}`.slice(0, 500);
    await logBatch(
      list.map((url) => ({
        url,
        provider: "indexnow",
        status: ok ? "ok" : "error",
        error: errorText,
      })),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logBatch(
      list.map((url) => ({ url, provider: "indexnow", status: "error", error: msg.slice(0, 500) })),
    );
  }
}

// ---------- Google Indexing API ----------

async function googleQuotaUsedToday(): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabaseAdmin
    .from("indexing_log")
    .select("*", { count: "exact", head: true })
    .eq("provider", "google")
    .eq("status", "ok")
    .gte("created_at", since);
  if (error) {
    console.warn("[indexers] quota check failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function pingGoogleIndexing(urls: string[]): Promise<void> {
  const list = dedupe(urls);
  if (list.length === 0) return;
  if (!GOOGLE_SA_JSON) {
    await logBatch(
      list.map((url) => ({ url, provider: "google", status: "skipped_config" })),
    );
    return;
  }
  const token = await getGoogleAccessToken(GOOGLE_SCOPE_INDEXING);
  if (!token) {
    await logBatch(
      list.map((url) => ({ url, provider: "google", status: "error", error: "no_token" })),
    );
    return;
  }

  const used = await googleQuotaUsedToday();
  const remaining = Math.max(0, GOOGLE_DAILY_LIMIT - used);
  const toSend = list.slice(0, remaining);
  const skipped = list.slice(remaining);

  if (skipped.length > 0) {
    await logBatch(
      skipped.map((url) => ({ url, provider: "google", status: "skipped_quota" })),
    );
  }

  const rows: LogRow[] = [];
  for (const url of toSend) {
    try {
      const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, type: "URL_UPDATED" }),
      });
      if (res.ok) {
        rows.push({ url, provider: "google", status: "ok" });
      } else {
        const text = await res.text().catch(() => "");
        rows.push({
          url,
          provider: "google",
          status: "error",
          error: `${res.status} ${text}`.slice(0, 500),
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      rows.push({ url, provider: "google", status: "error", error: msg.slice(0, 500) });
    }
  }
  await logBatch(rows);
}

// ---------- Combined fire-and-forget ----------

export async function notifyIndexers(urls: string[]): Promise<void> {
  const list = dedupe(urls);
  if (list.length === 0) return;
  try {
    await Promise.allSettled([pingIndexNow(list), pingGoogleIndexing(list)]);
  } catch (err) {
    console.warn("[indexers] notifyIndexers error:", err);
  }
}

// Build canonical URL for an offer page.
export function offerUrls(categorySlug: string, slug: string): string[] {
  const base = `https://${INDEXNOW_HOST}`;
  return [`${base}/${categorySlug}/${slug}`];
}
