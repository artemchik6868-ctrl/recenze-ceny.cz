import { defineTask } from "nitro/task";
import { FEED_INGEST_MOVED_BODY } from "@/lib/feed-sync-moved";

export default defineTask({
  meta: {
    name: "sync-feeds",
    description: "Disabled — CPA ingest is GitHub Action feed-sync.yml, not the Worker",
  },
  async run() {
    console.warn("[cron:sync-feeds] skipped: feed_ingest_moved_to_gha");
    return { result: FEED_INGEST_MOVED_BODY };
  },
});
