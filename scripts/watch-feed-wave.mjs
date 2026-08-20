/** Feed-wave drain is gone. Daily ingest: health-check.yml. Manual: `npm run sync:feeds`. */
console.error(
  "watch-feed-wave is obsolete: Worker sync-daily only retires leftover wave state.\n" +
    "Daily ingest: GitHub Action health-check.yml (job feed_sync).\n" +
    "Manual: npm run sync:feeds (feed-sync.yml workflow_dispatch)",
);
process.exit(1);
