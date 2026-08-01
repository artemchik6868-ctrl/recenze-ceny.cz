CREATE TABLE public.cpa_tl_offers (
  offer_id integer PRIMARY KEY,
  title text NOT NULL,
  picture_url text,
  category text,
  raw jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  synced_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cpa_tl_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read cpa_tl_offers" ON public.cpa_tl_offers FOR SELECT USING (true);
GRANT SELECT ON public.cpa_tl_offers TO anon, authenticated;
GRANT ALL ON public.cpa_tl_offers TO service_role;
CREATE INDEX idx_cpa_tl_offers_is_active ON public.cpa_tl_offers(is_active);

CREATE TABLE public.m1_offers (
  offer_id integer PRIMARY KEY,
  name text NOT NULL,
  picture_url text,
  category text,
  price_uah numeric,
  pay_uah numeric,
  raw jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  synced_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.m1_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read m1_offers" ON public.m1_offers FOR SELECT USING (true);
GRANT SELECT ON public.m1_offers TO anon, authenticated;
GRANT ALL ON public.m1_offers TO service_role;
CREATE INDEX idx_m1_offers_active ON public.m1_offers(is_active);

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
ALTER TABLE public.cpagetti_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read cpagetti_offers" ON public.cpagetti_offers FOR SELECT USING (true);
GRANT SELECT ON public.cpagetti_offers TO anon, authenticated;
GRANT ALL ON public.cpagetti_offers TO service_role;
