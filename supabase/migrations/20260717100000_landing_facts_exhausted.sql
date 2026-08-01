-- Allow terminal exhausted status (stop thin LLM retries until url_hash changes).
ALTER TABLE public.shakes_landing_facts
  DROP CONSTRAINT IF EXISTS shakes_landing_facts_status_check;

ALTER TABLE public.shakes_landing_facts
  ADD CONSTRAINT shakes_landing_facts_status_check
  CHECK (status IN ('ok', 'thin', 'no_url', 'fetch_error', 'skip_geo', 'exhausted'));

ALTER TABLE public.m1_landing_facts
  DROP CONSTRAINT IF EXISTS m1_landing_facts_status_check;

ALTER TABLE public.m1_landing_facts
  ADD CONSTRAINT m1_landing_facts_status_check
  CHECK (status IN ('ok', 'thin', 'no_url', 'fetch_error', 'skip_geo', 'exhausted'));

ALTER TABLE public.cpa_tl_landing_facts
  DROP CONSTRAINT IF EXISTS cpa_tl_landing_facts_status_check;

ALTER TABLE public.cpa_tl_landing_facts
  ADD CONSTRAINT cpa_tl_landing_facts_status_check
  CHECK (status IN ('ok', 'thin', 'no_url', 'fetch_error', 'skip_geo', 'exhausted'));
