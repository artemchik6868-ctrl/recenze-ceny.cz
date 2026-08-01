-- Vision facts from partner product images (service_role only).
-- Covers all OfferSource values.

CREATE TABLE public.offer_image_facts (
  source text NOT NULL,
  offer_id integer NOT NULL,
  image_url text NOT NULL DEFAULT '',
  image_hash text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'no_image'
    CHECK (status IN ('ok', 'thin', 'no_image', 'fetch_error', 'exhausted')),
  method text NOT NULL DEFAULT 'none'
    CHECK (method IN ('free', 'paid', 'none')),
  facts jsonb,
  prompt_block text,
  error text,
  fail_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_llm_at timestamptz,
  llm_attempts integer NOT NULL DEFAULT 0,
  model text,
  generation_id text,
  extracted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, offer_id)
);

CREATE INDEX offer_image_facts_status_idx
  ON public.offer_image_facts (status);

CREATE INDEX offer_image_facts_locked_until_idx
  ON public.offer_image_facts (locked_until)
  WHERE locked_until IS NOT NULL;

CREATE INDEX offer_image_facts_source_status_idx
  ON public.offer_image_facts (source, status);

GRANT ALL ON public.offer_image_facts TO service_role;

ALTER TABLE public.offer_image_facts ENABLE ROW LEVEL SECURITY;

-- Daily LLM call / token budget (UTC day). Reserve slots before gateway calls.
CREATE TABLE public.image_facts_daily_budget (
  day date PRIMARY KEY,
  free_calls integer NOT NULL DEFAULT 0,
  paid_calls integer NOT NULL DEFAULT 0,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.image_facts_daily_budget TO service_role;

ALTER TABLE public.image_facts_daily_budget ENABLE ROW LEVEL SECURITY;
