import { defineTask } from "nitro/task";
import { retryMissingContent, CONTENT_DRAIN_DEADLINE_MS } from "@/lib/content-pipeline.server";

export default defineTask({
  meta: {
    name: "content-drain",
    description: "Retry missing AI content for sources that still need it",
  },
  async run({ context }) {
    const promise = retryMissingContent({ deadlineMs: CONTENT_DRAIN_DEADLINE_MS });
    context.waitUntil?.(promise);
    const result = await promise;
    console.info(
      `[cron:content-drain] elapsed=${result.elapsed_ms}ms generated=${result.totalGenerated} failed=${result.totalFailed} missing=${result.totalMissing}`,
    );
    return { result };
  },
});
