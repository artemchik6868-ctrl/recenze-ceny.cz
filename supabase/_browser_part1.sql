
-- === 20260527061438_1bb82b27-bf8c-43fa-a149-33b8398a0c6a.sql ===

CREATE TABLE public.product_content (
  offer_id INTEGER PRIMARY KEY,
  source_hash TEXT NOT NULL,
  title_hi TEXT NOT NULL,
  subtitle_hi TEXT NOT NULL,
  meta_desc_hi TEXT NOT NULL,
  intro_hi TEXT NOT NULL,
  sections JSONB NOT NULL,
  faq JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_content TO anon, authenticated;
GRANT ALL ON public.product_content TO service_role;

ALTER TABLE public.product_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read product_content"
  ON public.product_content
  FOR SELECT
  TO anon, authenticated
  USING (true);
-- === 20260528143510_4774fa74-dc3f-4868-96be-83ca4e970b0d.sql ===


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
-- === 20260528144805_0b146cb2-c362-498c-8aea-c1c30c619f2f.sql ===

-- skipped cron
-- === 20260528150430_b81b5ac8-d0b4-46ca-98ea-627070778137.sql ===

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
-- === 20260528152548_8736e1dd-d5e4-4965-8d72-1d46ea8014bb.sql ===


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
-- === 20260528153811_4f0377e6-5025-4359-8ca3-733fe53d3e5f.sql ===

UPDATE public.m1_offers
SET picture_url = replace(picture_url, '/offer_img100x100/', '/offer_img300x300/')
WHERE picture_url LIKE '%/offer_img100x100/%';
-- === 20260531063919_b29ce6c9-17cb-40af-92f0-d739a67100a9.sql ===

ALTER TABLE public.product_content
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS subtitle_en text,
  ADD COLUMN IF NOT EXISTS intro_en text,
  ADD COLUMN IF NOT EXISTS sections_en jsonb,
  ADD COLUMN IF NOT EXISTS faq_en jsonb,
  ADD COLUMN IF NOT EXISTS meta_desc_en text;
-- === 20260531075818_ee172285-cf28-476e-b169-6efff6810aa8.sql ===

-- Public bucket for processed product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access on the bucket objects
CREATE POLICY "Public read product-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Table: cache of self-hosted product images
CREATE TABLE public.product_images (
  source        text        NOT NULL,
  offer_id      integer     NOT NULL,
  original_url  text        NOT NULL,
  storage_path  text        NOT NULL,
  width         integer     NOT NULL,
  height        integer     NOT NULL,
  source_hash   text        NOT NULL,
  processed_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, offer_id)
);

GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT ALL    ON public.product_images TO service_role;

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read product_images"
ON public.product_images FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX product_images_source_idx ON public.product_images (source);
