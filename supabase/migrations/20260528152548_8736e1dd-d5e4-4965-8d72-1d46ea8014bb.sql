
CREATE TABLE public.m1_offers (
  offer_id integer PRIMARY KEY,
  name text NOT NULL,
  picture_url text,
  category text,
  price_inr numeric,
  pay_inr numeric,
  raw jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  synced_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.m1_offers TO anon, authenticated;
GRANT ALL ON public.m1_offers TO service_role;

ALTER TABLE public.m1_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read m1_offers" ON public.m1_offers FOR SELECT USING (true);

CREATE INDEX idx_m1_offers_active ON public.m1_offers(is_active);
