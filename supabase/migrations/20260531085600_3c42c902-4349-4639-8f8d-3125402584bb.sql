CREATE TABLE public.cpagetti_offers (
  offer_id integer PRIMARY KEY,
  title text NOT NULL,
  picture_url text,
  category text,
  vertical_id integer,
  raw jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  synced_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cpagetti_offers TO anon, authenticated;
GRANT ALL ON public.cpagetti_offers TO service_role;

ALTER TABLE public.cpagetti_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read cpagetti_offers"
  ON public.cpagetti_offers
  FOR SELECT
  TO public
  USING (true);
