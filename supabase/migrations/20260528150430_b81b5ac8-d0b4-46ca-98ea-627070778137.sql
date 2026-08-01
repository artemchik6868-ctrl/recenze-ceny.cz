CREATE TABLE public.cpa_tl_offers (
  offer_id integer PRIMARY KEY,
  title text NOT NULL,
  picture_url text,
  category text,
  raw jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  synced_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cpa_tl_offers TO anon;
GRANT SELECT ON public.cpa_tl_offers TO authenticated;
GRANT ALL ON public.cpa_tl_offers TO service_role;

ALTER TABLE public.cpa_tl_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read cpa_tl_offers"
ON public.cpa_tl_offers
FOR SELECT
USING (true);

CREATE INDEX idx_cpa_tl_offers_is_active ON public.cpa_tl_offers(is_active);