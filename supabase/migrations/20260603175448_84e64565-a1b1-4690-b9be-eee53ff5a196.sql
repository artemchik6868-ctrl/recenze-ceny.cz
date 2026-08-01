CREATE TABLE public.indexing_log (
  id bigserial PRIMARY KEY,
  url text NOT NULL,
  provider text NOT NULL,
  status text NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX indexing_log_provider_created_at_idx ON public.indexing_log (provider, created_at DESC);
GRANT ALL ON public.indexing_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.indexing_log_id_seq TO service_role;
ALTER TABLE public.indexing_log ENABLE ROW LEVEL SECURITY;