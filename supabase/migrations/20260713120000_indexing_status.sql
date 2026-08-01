-- Tracks GSC inspection results and smart retry scheduling for indexer pings.
CREATE TABLE public.indexing_status (
  url text PRIMARY KEY,
  indexed boolean,
  verdict text,
  coverage_state text,
  last_inspected_at timestamptz,
  last_notified_at timestamptz,
  retry_after timestamptz,
  inspect_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX indexing_status_retry_idx
  ON public.indexing_status (retry_after)
  WHERE indexed IS NOT TRUE;

CREATE INDEX indexing_status_inspect_idx
  ON public.indexing_status (last_inspected_at)
  WHERE indexed IS NOT TRUE;

GRANT ALL ON public.indexing_status TO service_role;
ALTER TABLE public.indexing_status ENABLE ROW LEVEL SECURITY;
