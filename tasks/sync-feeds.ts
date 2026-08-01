import { defineTask } from "nitro/task";
import { syncAllFeeds } from "@/lib/content-pipeline.server";

export default defineTask({
  meta: {
    name: "sync-feeds",
    description: "Pull CPA feeds and deactivate stale offers (no AI)",
  },
  async run({ context }) {
    const promise = syncAllFeeds();
    context.waitUntil?.(promise);
    const result = await promise;
    console.info(`[cron:sync-feeds] elapsed=${result.elapsed_ms}ms`);
    return { result };
  },
});
