// Feed ingest moved to GHA. Do not paginate CPA APIs on the Worker.
import { createFileRoute } from "@tanstack/react-router";
import { checkHookSecret } from "@/lib/hook-auth";
import { feedIngestMovedResponse } from "@/lib/feed-sync-moved";

function run(request: Request) {
  return checkHookSecret(request) ?? feedIngestMovedResponse();
}

export const Route = createFileRoute("/api/public/hooks/sync-m1-top")({
  server: {
    handlers: {
      POST: ({ request }) => run(request),
      GET: ({ request }) => run(request),
    },
  },
});
