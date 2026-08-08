// Single Cloudflare cron entry — dispatches jobs by UTC clock.
// One trigger (*/30) fits free-tier cron limits; HTTP hooks still call tasks directly.
// Workstreams split by half-hour so content-drain is not starved/killed after landing+image.

import {
  isTopOfHourUtc,
  scheduledTickWorkstream,
  type ScheduledTickWorkstream,
} from "./scheduled-tick-workstream";
import { runDailySync, type DailySyncResult } from "./sync-daily.server";
import {
  drainNextFeedUnit,
  isWaveActive,
  loadWave,
  type FeedUnitResult,
} from "./feed-sync-wave.server";
import {
  retryMissingContent,
  drainMissingReviews,
  CONTENT_DRAIN_DEADLINE_MS,
} from "./content-pipeline.server";
import { listSourceMissingOfferIds } from "./content-backfill.server";
import { runIndexingRetry, type IndexingRetryResult } from "./indexing-retry.server";
import { runSitemapSubmit, type SitemapSubmitResult } from "./gsc-sitemap.server";
import {
  drainCpaTlLandingFacts,
  drainM1TopLandingFacts,
  drainShakesLandingFacts,
  LANDING_FACTS_DRAIN_DEADLINE_MS,
  type LandingFactsDrainResult,
} from "./landing-facts.server";
import {
  drainOfferImageFacts,
  IMAGE_FACTS_DRAIN_DEADLINE_MS,
  type ImageFactsDrainResult,
} from "./image-facts.server";
import type { OfferSource } from "./types";

export type { ScheduledTickWorkstream };
export { isTopOfHourUtc, scheduledTickWorkstream };

export type ScheduledTickResult = {
  ok: true;
  utcHour: number;
  utcMinute: number;
  ran: string[];
  workstream?: ScheduledTickWorkstream;
  syncDaily?: DailySyncResult;
  feedWaveUnit?: FeedUnitResult;
  landingFactsDrain?: LandingFactsDrainResult;
  m1LandingFactsDrain?: LandingFactsDrainResult;
  cpaTlLandingFactsDrain?: LandingFactsDrainResult;
  imageFactsDrain?: ImageFactsDrainResult;
  contentDrain?: Awaited<ReturnType<typeof retryMissingContent>>;
  reviewsDrain?: Awaited<ReturnType<typeof drainMissingReviews>>;
  indexingRetry?: IndexingRetryResult;
  sitemapSubmit?: SitemapSubmitResult;
};

export async function runScheduledTick(now = new Date()): Promise<ScheduledTickResult> {
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const onTheHour = isTopOfHourUtc(utcMinute);
  const ran: string[] = [];

  // 02:00 UTC — seed daily feed wave + drain one unit (feeds only; AI via content-drain).
  if (onTheHour && utcHour === 2) {
    const syncDaily = await runDailySync();
    ran.push("sync-daily");
    console.info(
      `[scheduled-tick] sync-daily elapsed=${syncDaily.elapsed_ms}ms timedOut=${syncDaily.timedOut} remaining=${syncDaily.remaining_work.join(",") || "none"}`,
    );
    return { ok: true, utcHour, utcMinute, ran, syncDaily };
  }

  // 06:00 UTC — GSC inspect + smart indexer retry (wave continues on later ticks).
  if (onTheHour && utcHour === 6) {
    const indexingRetry = await runIndexingRetry({ inspectLimit: 15, notifyLimit: 30 });
    ran.push("indexing-retry");
    console.info(
      `[scheduled-tick] indexing-retry inspected=${indexingRetry.inspected} notIndexed=${indexingRetry.notIndexed} retried=${indexingRetry.retried}`,
    );
    return { ok: true, utcHour, utcMinute, ran, indexingRetry };
  }

  // Mon 07:00 UTC — GSC sitemap resubmit + status check (not a per-URL force crawl).
  if (onTheHour && utcHour === 7 && now.getUTCDay() === 1) {
    const sitemapSubmit = await runSitemapSubmit();
    ran.push("sitemap-submit");
    console.info(
      `[scheduled-tick] sitemap-submit ok=${sitemapSubmit.ok} submitted=${sitemapSubmit.submitted} errors=${sitemapSubmit.status?.errors ?? "-"} warnings=${sitemapSubmit.status?.warnings ?? "-"}`,
    );
    return { ok: true, utcHour, utcMinute, ran, sitemapSubmit };
  }

  // Unfinished feed wave takes priority over landing-facts / content-drain.
  const wave = await loadWave();
  if (isWaveActive(wave)) {
    const feedWaveUnit = await drainNextFeedUnit();
    ran.push("feed-wave");
    console.info(
      `[scheduled-tick] feed-wave source=${feedWaveUnit.source ?? "none"} ok=${feedWaveUnit.ok} waveDone=${feedWaveUnit.waveDone} pending=${feedWaveUnit.pending.join(",") || "none"}`,
    );
    return { ok: true, utcHour, utcMinute, ran, feedWaveUnit };
  }

  const workstream = scheduledTickWorkstream(utcMinute);

  // :00 — landing facts + image-facts only (no content/reviews in this invoke).
  if (workstream === "facts") {
    // Prefer offers that still need AI content so the facts gate unblocks health backlog.
    const [shakesMissing, m1Missing, cpaTlMissing] = await Promise.all([
      listSourceMissingOfferIds("shakes", { limit: 40 }),
      listSourceMissingOfferIds("m1_top", { limit: 40 }),
      listSourceMissingOfferIds("cpa_tl", { limit: 40 }),
    ]);

    const landingFactsDrain = await drainShakesLandingFacts({
      deadlineMs: LANDING_FACTS_DRAIN_DEADLINE_MS,
      limit: 5,
      preferOfferIds: shakesMissing,
    });
    ran.push("landing-facts-drain");
    console.info(
      `[scheduled-tick] landing-facts-drain processed=${landingFactsDrain.processed} ok=${landingFactsDrain.okCount} remaining=${landingFactsDrain.remaining} prefer=${shakesMissing.length}`,
    );

    const m1LandingFactsDrain = await drainM1TopLandingFacts({
      deadlineMs: LANDING_FACTS_DRAIN_DEADLINE_MS,
      limit: 5,
      preferOfferIds: m1Missing,
    });
    ran.push("m1-landing-facts-drain");
    console.info(
      `[scheduled-tick] m1-landing-facts-drain processed=${m1LandingFactsDrain.processed} ok=${m1LandingFactsDrain.okCount} remaining=${m1LandingFactsDrain.remaining} prefer=${m1Missing.length}`,
    );

    const cpaTlLandingFactsDrain = await drainCpaTlLandingFacts({
      deadlineMs: LANDING_FACTS_DRAIN_DEADLINE_MS,
      limit: 5,
      preferOfferIds: cpaTlMissing,
    });
    ran.push("cpa-tl-landing-facts-drain");
    console.info(
      `[scheduled-tick] cpa-tl-landing-facts-drain processed=${cpaTlLandingFactsDrain.processed} ok=${cpaTlLandingFactsDrain.okCount} remaining=${cpaTlLandingFactsDrain.remaining} prefer=${cpaTlMissing.length}`,
    );

    const imagePrefer: Array<{ source: OfferSource; offerId: number }> = [
      ...shakesMissing.map((offerId) => ({ source: "shakes" as const, offerId })),
      ...m1Missing.map((offerId) => ({ source: "m1_top" as const, offerId })),
      ...cpaTlMissing.map((offerId) => ({ source: "cpa_tl" as const, offerId })),
    ];
    // Also prefer other sources missing AI (image facts cover all six).
    for (const source of ["kma", "cpagetti", "adcombo"] as OfferSource[]) {
      const ids = await listSourceMissingOfferIds(source, { limit: 20 });
      for (const offerId of ids) imagePrefer.push({ source, offerId });
    }

    const imageFactsDrain = await drainOfferImageFacts({
      deadlineMs: IMAGE_FACTS_DRAIN_DEADLINE_MS,
      limit: 3,
      preferOffers: imagePrefer,
    });
    ran.push("image-facts-drain");
    console.info(
      `[scheduled-tick] image-facts-drain processed=${imageFactsDrain.processed} ok=${imageFactsDrain.okCount} remaining=${imageFactsDrain.remaining} reason=${imageFactsDrain.stoppedReason ?? "-"} circuit=${imageFactsDrain.circuitTrips} prefer=${imagePrefer.length}`,
    );

    return {
      ok: true,
      utcHour,
      utcMinute,
      ran,
      workstream,
      landingFactsDrain,
      m1LandingFactsDrain,
      cpaTlLandingFactsDrain,
      imageFactsDrain,
    };
  }

  // :30 — content-drain + reviews with full wall budget (no landing ahead).
  const contentDrain = await retryMissingContent({ deadlineMs: CONTENT_DRAIN_DEADLINE_MS });
  ran.push("content-drain");
  console.info(
    `[scheduled-tick] content-drain generated=${contentDrain.totalGenerated} failed=${contentDrain.totalFailed} missing=${contentDrain.totalMissing}`,
  );

  const reviewsBudget = Math.max(30_000, Math.min(60_000, CONTENT_DRAIN_DEADLINE_MS));
  const reviewsDrain = await drainMissingReviews({
    deadlineMs: reviewsBudget,
    perSourceLimit: 2,
  });
  ran.push("reviews-drain");
  console.info(
    `[scheduled-tick] reviews-drain updated=${reviewsDrain.totalUpdated} failed=${reviewsDrain.totalFailed}`,
  );

  return {
    ok: true,
    utcHour,
    utcMinute,
    ran,
    workstream,
    contentDrain,
    reviewsDrain,
  };
}
