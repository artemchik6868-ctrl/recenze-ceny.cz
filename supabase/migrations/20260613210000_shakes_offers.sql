CREATE TABLE public.shakes_offers (
  offer_id integer PRIMARY KEY,
  title text NOT NULL,
  picture_url text,
  category text,
  raw jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  synced_at timestamptz NOT NULL DEFAULT now(),
  first_seen_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shakes_offers TO anon, authenticated;
GRANT ALL ON public.shakes_offers TO service_role;

ALTER TABLE public.shakes_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read shakes_offers"
  ON public.shakes_offers
  FOR SELECT
  TO public
  USING (true);
