/**
 * Dispatch production CPA ingest on GitHub Actions (same Node job as the daily cron).
 * Does not paginate feeds on the Cloudflare Worker.
 *
 *   npm run sync:feeds
 *   gh workflow run feed-sync.yml
 */
import { spawnSync } from "node:child_process";

const r = spawnSync("gh", ["workflow", "run", "feed-sync.yml"], {
  stdio: "inherit",
  encoding: "utf8",
});

if (r.status !== 0) {
  console.error(
    "Could not dispatch feed-sync.yml. Install/login GitHub CLI, then:\n  gh workflow run feed-sync.yml\nOr run the same script in CI: npm run sync:feeds-local",
  );
  process.exit(r.status ?? 1);
}

console.info("Dispatched GitHub Action “Feed sync” (Node ingest on ubuntu).");
