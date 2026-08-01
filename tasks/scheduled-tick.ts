import { defineTask } from "nitro/task";
import { runScheduledTick } from "@/lib/scheduled-tick.server";

export default defineTask({
  meta: {
    name: "scheduled-tick",
    description: "Single cron dispatcher: content-drain / sync-daily / indexing-retry",
  },
  async run({ context }) {
    const promise = runScheduledTick();
    context.waitUntil?.(promise);
    const result = await promise;
    console.info(`[cron:scheduled-tick] ran=${result.ran.join(",")} utc=${result.utcHour}:${result.utcMinute}`);
    return { result };
  },
});
