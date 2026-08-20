/** Feed-wave drain is gone. CPA ingest is GitHub Action feed-sync.yml (`npm run sync:feeds`). */
console.error(
  "watch-feed-wave is obsolete: Worker sync-daily only retires leftover wave state.\n" +
    "Daily ingest: GitHub Action feed-sync.yml (or health-check backup).\n" +
    "Manual: npm run sync:feeds",
);
process.exit(1);
