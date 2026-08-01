import { defineTask } from "nitro/task";
import { runIndexingRetry } from "@/lib/indexing-retry.server";

export default defineTask({
  meta: {
    name: "indexing-retry",
    description: "GSC URL inspection + smart retry for non-indexed product pages",
  },
  async run({ context }) {
    const promise = runIndexingRetry({ inspectLimit: 15, notifyLimit: 30 });
    context.waitUntil?.(promise);
    const result = await promise;
    console.info(
      `[cron:indexing-retry] inspected=${result.inspected} indexed=${result.indexedFound} notIndexed=${result.notIndexed} retried=${result.retried} inspectErrors=${result.inspectErrors}`,
    );
    return { result };
  },
});
