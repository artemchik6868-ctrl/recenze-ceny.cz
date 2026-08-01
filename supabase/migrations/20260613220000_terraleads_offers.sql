CREATE TABLE public.terraleads_offers (
  offer_id integer PRIMARY KEY,
  title text NOT NULL,
  picture_url text,
  category text,
  raw jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  synced_at timestamptz NOT NULL DEFAULT now(),
  first_seen_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.terraleads_offers TO anon, authenticated;
GRANT ALL ON public.terraleads_offers TO service_role;

ALTER TABLE public.terraleads_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read terraleads_offers"
  ON public.terraleads_offers
  FOR SELECT
  TO public
  USING (true);
