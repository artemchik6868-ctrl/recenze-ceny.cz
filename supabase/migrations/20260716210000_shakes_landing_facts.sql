-- Cached LLM/heuristic facts from Shakes CZ adaptive landings (service_role only).
CREATE TABLE public.shakes_landing_facts (
  offer_id integer PRIMARY KEY REFERENCES public.shakes_offers (offer_id) ON DELETE CASCADE,
  source_url text NOT NULL DEFAULT '',
  url_hash text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'no_url'
    CHECK (status IN ('ok', 'thin', 'no_url', 'fetch_error', 'skip_geo')),
  lang_hint text NOT NULL DEFAULT 'unknown',
  method text NOT NULL DEFAULT 'llm',
  facts jsonb,
  prompt_block text,
  error text,
  fail_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  extracted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX shakes_landing_facts_status_idx
  ON public.shakes_landing_facts (status);

CREATE INDEX shakes_landing_facts_locked_until_idx
  ON public.shakes_landing_facts (locked_until)
  WHERE locked_until IS NOT NULL;

GRANT ALL ON public.shakes_landing_facts TO service_role;

ALTER TABLE public.shakes_landing_facts ENABLE ROW LEVEL SECURITY;

-- No public/anon policies — service_role bypasses RLS.
