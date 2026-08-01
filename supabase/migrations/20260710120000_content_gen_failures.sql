-- Track AI content generation failures, locks, and cooldowns for backfill/drain.
CREATE TABLE IF NOT EXISTS public.content_gen_failures (
  source text NOT NULL,
  offer_id integer NOT NULL,
  fail_count integer NOT NULL DEFAULT 0,
  last_failed_at timestamptz,
  locked_until timestamptz,
  last_error text,
  last_attempt_at timestamptz,
  PRIMARY KEY (source, offer_id)
);

ALTER TABLE public.content_gen_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role all content_gen_failures"
  ON public.content_gen_failures
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.content_gen_failures TO service_role;
