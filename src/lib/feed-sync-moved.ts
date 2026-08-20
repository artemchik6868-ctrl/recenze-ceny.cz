/** Worker must not paginate CPA feeds (CF subrequest cap). Ingest is Node/GHA. */

export const FEED_INGEST_MOVED_BODY = {
  ok: false as const,
  error: "feed_ingest_moved_to_gha",
  hint: "Daily ingest is GitHub Action health-check.yml (job feed_sync). Manual: `npm run sync:feeds` (feed-sync.yml workflow_dispatch). Not this Worker.",
};

export function feedIngestMovedResponse(): Response {
  return Response.json(FEED_INGEST_MOVED_BODY, { status: 501 });
}
