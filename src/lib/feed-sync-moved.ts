/** Worker must not paginate CPA feeds (CF subrequest cap). Ingest is Node/GHA. */

export const FEED_INGEST_MOVED_BODY = {
  ok: false as const,
  error: "feed_ingest_moved_to_gha",
  hint: "Run GitHub Action feed-sync.yml (workflow_dispatch) or `npm run sync:feeds`. Daily ingest is GHA, not this Worker.",
};

export function feedIngestMovedResponse(): Response {
  return Response.json(FEED_INGEST_MOVED_BODY, { status: 501 });
}
