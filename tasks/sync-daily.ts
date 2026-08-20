import { defineTask } from "nitro/task";
import { runDailySync } from "@/lib/sync-daily.server";

export default defineTask({
  meta: {
    name: "sync-daily",
    description: "No-op: feed ingest moved to Node/GHA; retires leftover wave",
  },
  async run({ context }) {
    const promise = runDailySync();
    context.waitUntil?.(promise);
    const result = await promise;
    console.info(
      `[cron:sync-daily] elapsed=${result.elapsed_ms}ms timedOut=${result.timedOut} remaining=${result.remaining_work.join(",") || "none"}`,
    );
    return { result };
  },
});
