import { redactSecretsInUrl } from "./feed-sync-guards";

const FEED_UA = "recenze-ceny-sync/1.0";
const MAX_ATTEMPTS = 5;

export function retryAfterMs(attempt: number, res?: Response): number {
  const header = res?.headers.get("retry-after");
  if (header) {
    const n = Number(header);
    if (Number.isFinite(n) && n >= 0) return Math.min(60_000, Math.max(500, n * 1000));
  }
  return Math.min(30_000, 1000 * 2 ** attempt);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a partner feed URL with 429/5xx/network retries.
 * Does not log the URL (keys live in query strings).
 */
export async function fetchFeed(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = {
    Accept: "application/json",
    "User-Agent": FEED_UA,
    ...(init.headers ?? {}),
  };
  let lastRes: Response | undefined;
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      lastRes = await fetch(url, {
        ...init,
        headers,
        signal: init.signal ?? AbortSignal.timeout(60_000),
      });
    } catch (err) {
      lastErr = err;
      if (attempt === MAX_ATTEMPTS - 1) throw err;
      await sleep(retryAfterMs(attempt));
      continue;
    }
    if (lastRes.status === 429 || lastRes.status >= 500) {
      if (attempt === MAX_ATTEMPTS - 1) return lastRes;
      console.warn(
        `[feed-sync] HTTP ${lastRes.status} retry ${attempt + 1}/${MAX_ATTEMPTS} ${redactSecretsInUrl(url)}`,
      );
      await sleep(retryAfterMs(attempt, lastRes));
      continue;
    }
    return lastRes;
  }
  if (lastRes) return lastRes;
  throw lastErr instanceof Error ? lastErr : new Error("feed fetch failed");
}
