-- Durable feed-sync wave: resume unfinished partner syncs across Worker invocations.
CREATE TABLE public.pipeline_feed_wave (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  pending text[] NOT NULL DEFAULT '{}',
  active_source text,
  active_cursor jsonb,
  wave_id uuid NOT NULL DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  last_result jsonb
);

INSERT INTO public.pipeline_feed_wave (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

GRANT ALL ON public.pipeline_feed_wave TO service_role;
ALTER TABLE public.pipeline_feed_wave ENABLE ROW LEVEL SECURITY;
