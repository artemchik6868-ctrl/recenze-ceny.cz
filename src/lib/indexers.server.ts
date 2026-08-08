// Fire-and-forget notifications to search engines about new/updated URLs.
//
// Providers:
// - IndexNow global (`api.indexnow.org`) — Bing, Yandex, Naver, Seznam, …
// - Seznam IndexNow direct (`search.seznam.cz`) — explicit CZ ping (same key)
// - Google Indexing API — requires a service account; officially supports only
//   JobPosting/BroadcastEvent, but works in practice for other pages. Hard daily
//   quota of 200 URL notifications per project — we enforce it via indexing_log.
//
// All providers are best-effort: failures are logged to indexing_log but never
// surfaced to callers. Designed to be invoked without `await` from sync paths.
//
// IndexNow host rate limits: 429 → status `rate_limited` + shared cooldown
// (sentinel row in indexing_log). Hard `error` is for non-429 failures only.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getGoogleAccessToken, GOOGLE_SCOPE_INDEXING } from "./google-sa.server";
import {
  INDEXNOW_CHUNK_SIZE,
  INDEXNOW_COOLDOWN_MS,
  INDEXNOW_COOLDOWN_SENTINEL,
  cooldownUntilFromRetryAfter,
  formatCooldownError,
  isCooldownActive,
  isIndexNowRateLimitHttpStatus,
  parseRetryAfterMs,
} from "./indexing-rate-limit";

const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const INDEXNOW_HOST = "recenze-ceny.cz";
const INDEXNOW_KEY_LOCATION = INDEXNOW_KEY
  ? `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`
  : null;

const GOOGLE_SA_JSON = process.env.GOOGLE_INDEXING_SA_JSON;
const GOOGLE_DAILY_LIMIT = 200;

type IndexerProvider = "indexnow" | "seznam" | "google";

type LogStatus = "ok" | "error" | "skipped_quota" | "skipped_config" | "rate_limited";

type LogRow = {
  url: string;
  provider: IndexerProvider;
  status: LogStatus;
  error?: string | null;
};

/** Global hub + Seznam direct (IndexNow.org lists both). Sequential, not parallel. */
const INDEXNOW_ENDPOINTS: Array<{ provider: "indexnow" | "seznam"; url: string }> = [
  { provider: "indexnow", url: "https://api.indexnow.org/indexnow" },
  { provider: "seznam", url: "https://search.seznam.cz/indexnow" },
];

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

/** Shared IndexNow/Seznam quiet period from last rate_limited sentinel or 429 row. */
async function readIndexNowCooldownActive(nowMs = Date.now()): Promise<boolean> {
  try {
    const since = new Date(nowMs - INDEXNOW_COOLDOWN_MS * 2).toISOString();
    const { data, error } = await supabaseAdmin
      .from("indexing_log")
      .select("created_at, error, status, url")
      .in("provider", ["indexnow", "seznam"])
      .eq("status", "rate_limited")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) {
      console.warn("[indexers] cooldown read failed:", error.message);
      return false;
    }
    for (const row of data ?? []) {
      const url = String((row as { url?: string }).url ?? "");
      const createdAt = String((row as { created_at?: string }).created_at ?? "");
      const err = (row as { error?: string | null }).error;
      // Prefer sentinel rows; any recent rate_limited also arms cooldown.
      if (
        url === INDEXNOW_COOLDOWN_SENTINEL ||
        isCooldownActive({ createdAt, error: err }, nowMs)
      ) {
        if (isCooldownActive({ createdAt, error: err }, nowMs)) return true;
      }
    }
    return false;
  } catch (err) {
    console.warn("[indexers] cooldown read error:", err);
    return false;
  }
}

async function writeIndexNowCooldown(
  provider: "indexnow" | "seznam",
  untilIso: string,
): Promise<void> {
  await logBatch([
    {
      url: INDEXNOW_COOLDOWN_SENTINEL,
      provider,
      status: "rate_limited",
      error: formatCooldownError(untilIso),
    },
  ]);
}

async function logRateLimited(
  provider: "indexnow" | "seznam",
  urls: string[],
  error: string,
): Promise<void> {
  if (urls.length === 0) return;
  await logBatch(
    urls.map((url) => ({
      url,
      provider,
      status: "rate_limited" as const,
      error: error.slice(0, 500),
    })),
  );
}

async function postIndexNow(
  endpoint: string,
  provider: "indexnow" | "seznam",
  list: string[],
): Promise<"ok" | "rate_limited" | "error"> {
  const CHUNK = INDEXNOW_CHUNK_SIZE;
  let outcome: "ok" | "rate_limited" | "error" = "ok";

  for (let i = 0; i < list.length; i += CHUNK) {
    const chunk = list.slice(i, i + CHUNK);
    const remaining = list.slice(i + CHUNK);
    let attempt = 0;
    let handled = false;

    while (attempt < 2 && !handled) {
      attempt += 1;
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            host: INDEXNOW_HOST,
            key: INDEXNOW_KEY,
            keyLocation: INDEXNOW_KEY_LOCATION,
            urlList: chunk,
          }),
        });

        if (isIndexNowRateLimitHttpStatus(res.status)) {
          const retryMs = parseRetryAfterMs(res.headers.get("retry-after"));
          if (attempt < 2 && (retryMs == null || retryMs < 5000)) {
            await new Promise((r) => setTimeout(r, 2500 * attempt));
            continue;
          }
          const body = await res.text().catch(() => "");
          const until = cooldownUntilFromRetryAfter(retryMs);
          const errText = `429 ${body}`.slice(0, 500);
          await logRateLimited(provider, chunk, errText);
          if (remaining.length) await logRateLimited(provider, remaining, errText);
          await writeIndexNowCooldown(provider, until);
          console.warn(
            `[indexers] ${provider} rate-limited; cooldown until ${until} (deferred ${chunk.length + remaining.length} urls)`,
          );
          return "rate_limited";
        }

        const ok = res.ok || res.status === 202;
        const errorText = ok
          ? null
          : `${res.status} ${await res.text().catch(() => "")}`.slice(0, 500);
        await logBatch(
          chunk.map((url) => ({
            url,
            provider,
            status: ok ? ("ok" as const) : ("error" as const),
            error: errorText,
          })),
        );
        if (!ok) outcome = "error";
        handled = true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await logBatch(
          chunk.map((url) => ({
            url,
            provider,
            status: "error" as const,
            error: msg.slice(0, 500),
          })),
        );
        outcome = "error";
        handled = true;
      }
    }

    if (i + CHUNK < list.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return outcome;
}

// ---------- IndexNow (global + Seznam direct) ----------

export async function pingIndexNow(urls: string[]): Promise<void> {
  const list = dedupe(urls);
  if (list.length === 0) return;
  if (!INDEXNOW_KEY || !INDEXNOW_KEY_LOCATION) {
    await logBatch(
      INDEXNOW_ENDPOINTS.flatMap(({ provider }) =>
        list.map((url) => ({ url, provider, status: "skipped_config" as const })),
      ),
    );
    return;
  }

  if (await readIndexNowCooldownActive()) {
    const err = "host_cooldown_active";
    for (const { provider } of INDEXNOW_ENDPOINTS) {
      await logRateLimited(provider, list, err);
    }
    console.info(`[indexers] IndexNow skipped — host cooldown (${list.length} urls)`);
    return;
  }

  // Sequential endpoints — parallel blasts double the chance of 429.
  for (const { provider, url } of INDEXNOW_ENDPOINTS) {
    if (await readIndexNowCooldownActive()) {
      await logRateLimited(provider, list, "host_cooldown_active");
      continue;
    }
    const result = await postIndexNow(url, provider, list);
    if (result === "rate_limited") {
      // Remaining providers also defer under the same host quiet period.
      const rest = INDEXNOW_ENDPOINTS.filter((e) => e.provider !== provider);
      for (const e of rest) {
        await logRateLimited(e.provider, list, "host_cooldown_active");
      }
      break;
    }
  }
}

/** Explicit Seznam-only IndexNow ping (also covered by pingIndexNow). */
export async function pingSeznam(urls: string[]): Promise<void> {
  const list = dedupe(urls);
  if (list.length === 0) return;
  if (!INDEXNOW_KEY || !INDEXNOW_KEY_LOCATION) {
    await logBatch(list.map((url) => ({ url, provider: "seznam", status: "skipped_config" })));
    return;
  }
  if (await readIndexNowCooldownActive()) {
    await logRateLimited("seznam", list, "host_cooldown_active");
    return;
  }
  await postIndexNow("https://search.seznam.cz/indexnow", "seznam", list);
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
        const statusCode = res.status;
        if (isIndexNowRateLimitHttpStatus(statusCode)) {
          rows.push({
            url,
            provider: "google",
            status: "rate_limited",
            error: `${statusCode} ${text}`.slice(0, 500),
          });
        } else {
          rows.push({
            url,
            provider: "google",
            status: "error",
            error: `${statusCode} ${text}`.slice(0, 500),
          });
        }
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
    // IndexNow first (may set host cooldown); Google is independent.
    await pingIndexNow(list);
    await pingGoogleIndexing(list);
  } catch (err) {
    console.warn("[indexers] notifyIndexers error:", err);
  }
}

// Build canonical URL for an offer page.
export function offerUrls(categorySlug: string, slug: string): string[] {
  const base = `https://${INDEXNOW_HOST}`;
  return [`${base}/${categorySlug}/${slug}`];
}

/** Canonical URL for a published blog article (`/clanky/{slug}`). */
export function blogPostUrls(slug: string): string[] {
  const base = `https://${INDEXNOW_HOST}`;
  return [`${base}/clanky/${slug}`];
}
