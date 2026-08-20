// CPA feed ingest is Node/GHA (`npm run sync:feeds` → workflow_dispatch).
// This Worker hook must not paginate partner APIs (CF subrequest cap).

import { createFileRoute } from "@tanstack/react-router";
import { checkHookSecret } from "@/lib/hook-auth";
import { feedIngestMovedResponse } from "@/lib/feed-sync-moved";

function run(request: Request) {
  return checkHookSecret(request) ?? feedIngestMovedResponse();
}

export const Route = createFileRoute("/api/public/hooks/sync-feeds")({
  server: {
    handlers: {
      POST: ({ request }) => run(request),
      GET: ({ request }) => run(request),
    },
  },
});
