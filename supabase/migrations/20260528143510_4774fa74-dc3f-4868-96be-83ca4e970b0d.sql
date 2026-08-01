
-- 1. kma_offers
CREATE TABLE public.kma_offers (
  offer_id integer PRIMARY KEY,
  name text NOT NULL,
  logo text,
  category text,
  itemprice_rub numeric,
  commission_inr numeric,
  raw jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  synced_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.kma_offers TO anon, authenticated;
GRANT ALL ON public.kma_offers TO service_role;

ALTER TABLE public.kma_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read kma_offers" ON public.kma_offers
  FOR SELECT USING (true);

-- 2. kma_channels
CREATE TABLE public.kma_channels (
  offer_id integer PRIMARY KEY,
  channel_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.kma_channels TO anon, authenticated;
GRANT ALL ON public.kma_channels TO service_role;

ALTER TABLE public.kma_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read kma_channels" ON public.kma_channels
  FOR SELECT USING (true);

-- 3. Extend product_content with source
ALTER TABLE public.product_content
  ADD COLUMN source text NOT NULL DEFAULT 'cpa_tl';

ALTER TABLE public.product_content
  DROP CONSTRAINT IF EXISTS product_content_pkey;

ALTER TABLE public.product_content
  ADD PRIMARY KEY (source, offer_id);
