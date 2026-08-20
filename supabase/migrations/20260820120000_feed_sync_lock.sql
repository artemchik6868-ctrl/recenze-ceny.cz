-- Single-row lock so GHA/Node feed ingest and Worker hooks cannot run deactivate together.
CREATE TABLE public.feed_sync_lock (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  holder text,
  locked_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT '1970-01-01T00:00:00Z'
);

INSERT INTO public.feed_sync_lock (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

GRANT ALL ON public.feed_sync_lock TO service_role;
ALTER TABLE public.feed_sync_lock ENABLE ROW LEVEL SECURITY;
