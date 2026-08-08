/**
 * Gate AI content until landing/image fact extraction has been attempted
 * (any status including errors). Missing DB row while extract is applicable = not ready.
 *
 * Soft age bypass: offers older than FACTS_WAIT_MS may claim without a facts row so
 * content can warm+generate instead of sitting missing for hours (health stale = 2h).
 */

import type { OfferSource } from "./types";
import { isImageFactsSource } from "./image-facts";
import {
  isClearlyCzLandingUrl,
  listAdaptiveLandingUrls,
  listCpaTlCzLandingUrls,
  listM1TopLandingUrls,
} from "./landing-facts";

/** Sources that run landing-facts drain before content. */
export const LANDING_FACTS_CONTENT_SOURCES = ["shakes", "cpa_tl", "m1_top"] as const;

/**
 * Fresh offers wait for :00 facts drain; older ones proceed via warm-on-claim.
 * Keep well below health-check stale (2h).
 */
export const FACTS_WAIT_MS = 30 * 60 * 1000;

/** True when offer is old enough that missing facts rows should not block content. */
export function offerAgeAllowsFactsBypass(
  syncedAt: string | null | undefined,
  nowMs = Date.now(),
  waitMs = FACTS_WAIT_MS,
): boolean {
  if (!syncedAt) return false;
  const ts = Date.parse(syncedAt);
  if (!Number.isFinite(ts)) return false;
  return nowMs - ts >= waitMs;
}

export type LandingFactsContentSource = (typeof LANDING_FACTS_CONTENT_SOURCES)[number];

export function isLandingFactsContentSource(
  source: string,
): source is LandingFactsContentSource {
  return (LANDING_FACTS_CONTENT_SOURCES as readonly string[]).includes(source);
}

/** Any persisted status means extraction was attempted (ok, no_url, fetch_error, …). */
export function isFactsExtractionAttempted(status: string | null | undefined): boolean {
  return typeof status === "string" && status.trim().length > 0;
}

/** True when the landing-facts drain would queue this offer (has a candidate URL). */
export function hasExtractableLandingForSource(source: OfferSource, raw: unknown): boolean {
  if (!isLandingFactsContentSource(source)) return false;
  if (!raw || typeof raw !== "object") return false;
  if (source === "shakes") {
    const candidates = listAdaptiveLandingUrls(
      raw as { landings?: Array<{ type?: string; url?: string }> },
    );
    return candidates.some((u) => isClearlyCzLandingUrl(u));
  }
  if (source === "m1_top") {
    return (
      listM1TopLandingUrls(
        raw as { tracking_link?: Array<string | null | undefined> | null },
      ).length > 0
    );
  }
  return (
    listCpaTlCzLandingUrls(
      raw as {
        landings?: Array<{ url?: string; language_code?: string; language?: string }>;
      },
    ).length > 0
  );
}

export function landingFactsReadyForContent(opts: {
  source: OfferSource;
  hasExtractableLanding: boolean;
  landingStatus: string | null | undefined;
}): boolean {
  if (!isLandingFactsContentSource(opts.source)) return true;
  if (!opts.hasExtractableLanding) return true;
  return isFactsExtractionAttempted(opts.landingStatus);
}

export function imageFactsReadyForContent(opts: {
  source: OfferSource;
  imageFactsEnabled: boolean;
  hasImageUrl: boolean;
  imageStatus: string | null | undefined;
}): boolean {
  if (!opts.imageFactsEnabled) return true;
  if (!isImageFactsSource(opts.source)) return true;
  if (!opts.hasImageUrl) return true;
  return isFactsExtractionAttempted(opts.imageStatus);
}

export function offerFactsReadyForContent(opts: {
  source: OfferSource;
  hasExtractableLanding: boolean;
  landingStatus: string | null | undefined;
  imageFactsEnabled: boolean;
  hasImageUrl: boolean;
  imageStatus: string | null | undefined;
  /** When set, aged offers bypass a missing facts row (warm runs after claim). */
  syncedAt?: string | null | undefined;
  nowMs?: number;
}): boolean {
  const landingOk = landingFactsReadyForContent(opts);
  const imageOk = imageFactsReadyForContent(opts);
  if (landingOk && imageOk) return true;
  if (offerAgeAllowsFactsBypass(opts.syncedAt, opts.nowMs)) return true;
  return false;
}

/** Skip live landing warm when a status row already exists (any outcome). */
export function shouldWarmLandingFacts(opts: {
  source: OfferSource;
  landingStatus: string | null | undefined;
}): boolean {
  if (!isLandingFactsContentSource(opts.source)) return false;
  return !isFactsExtractionAttempted(opts.landingStatus);
}

/** Skip live image warm when a status row already exists (any outcome). */
export function shouldWarmImageFacts(opts: {
  source: OfferSource;
  imageFactsEnabled: boolean;
  imageStatus: string | null | undefined;
}): boolean {
  if (!opts.imageFactsEnabled) return false;
  if (!isImageFactsSource(opts.source)) return false;
  return !isFactsExtractionAttempted(opts.imageStatus);
}
