import { defineTask } from "nitro/task";
import { syncAllFeedsExclusive } from "@/lib/content-pipeline.server";

export default defineTask({
  meta: {
    name: "sync-feeds",
    description: "Emergency Worker CPA ingest (prefer Node scripts/sync-feeds-local.ts)",
  },
  async run({ context }) {
    const promise = syncAllFeedsExclusive("worker:task-sync-feeds");
    context.waitUntil?.(promise);
    const result = await promise;
    console.info(
      `[cron:sync-feeds] lock=${result.lock} elapsed=${result.elapsed_ms}ms failed=${result.failed.join(",") || "none"}`,
    );
    return { result };
  },
});
