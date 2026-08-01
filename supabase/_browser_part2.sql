-- === 20260531075831_11740606-3a09-4c36-b25b-799f9979c57b.sql ===

DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;
-- === 20260531085600_3c42c902-4349-4639-8f8d-3125402584bb.sql ===

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
-- === 20260602180630_8accc934-4b14-473b-a59b-3e938de8b045.sql ===

-- product_content: hi -> uk, en -> ru
ALTER TABLE public.product_content RENAME COLUMN title_hi      TO title_uk;
ALTER TABLE public.product_content RENAME COLUMN subtitle_hi   TO subtitle_uk;
ALTER TABLE public.product_content RENAME COLUMN meta_desc_hi  TO meta_desc_uk;
ALTER TABLE public.product_content RENAME COLUMN intro_hi      TO intro_uk;
ALTER TABLE public.product_content RENAME COLUMN title_en      TO title_ru;
ALTER TABLE public.product_content RENAME COLUMN subtitle_en   TO subtitle_ru;
ALTER TABLE public.product_content RENAME COLUMN meta_desc_en  TO meta_desc_ru;
ALTER TABLE public.product_content RENAME COLUMN intro_en      TO intro_ru;
ALTER TABLE public.product_content RENAME COLUMN sections      TO sections_uk;
ALTER TABLE public.product_content RENAME COLUMN sections_en   TO sections_ru;
ALTER TABLE public.product_content RENAME COLUMN faq           TO faq_uk;
ALTER TABLE public.product_content RENAME COLUMN faq_en        TO faq_ru;

-- m1_offers: INR -> UAH
ALTER TABLE public.m1_offers RENAME COLUMN price_inr TO price_uah;
ALTER TABLE public.m1_offers RENAME COLUMN pay_inr   TO pay_uah;

-- kma_offers: INR -> UAH
ALTER TABLE public.kma_offers RENAME COLUMN commission_inr TO commission_uah;

-- Очистка старого контента/картинок — backfill и image-proxy перегенерируют
TRUNCATE public.product_content;
TRUNCATE public.product_images;
-- === 20260602200824_bd3de014-9048-4cdd-96b1-2252020bd92c.sql ===

CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;
-- === 20260602200834_49180aa5-a455-4987-9a3e-54d661181006.sql ===

CREATE POLICY "product-images service-role insert"
ON storage.objects FOR INSERT TO service_role
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product-images service-role update"
ON storage.objects FOR UPDATE TO service_role
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product-images service-role delete"
ON storage.objects FOR DELETE TO service_role
USING (bucket_id = 'product-images');
-- === 20260602201344_947f562a-7e06-4056-955c-69fa42d8f4e6.sql ===

ALTER TABLE public.product_content
  ADD COLUMN IF NOT EXISTS display_title_uk text,
  ADD COLUMN IF NOT EXISTS display_title_ru text;
-- === 20260603175448_84e64565-a1b1-4690-b9be-eee53ff5a196.sql ===

CREATE TABLE public.indexing_log (
  id bigserial PRIMARY KEY,
  url text NOT NULL,
  provider text NOT NULL,
  status text NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX indexing_log_provider_created_at_idx ON public.indexing_log (provider, created_at DESC);
GRANT ALL ON public.indexing_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.indexing_log_id_seq TO service_role;
ALTER TABLE public.indexing_log ENABLE ROW LEVEL SECURITY;
-- === 20260603182931_8c5913d8-fd34-44e3-b3e0-fe6e8fd02a6a.sql ===

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
-- === 20260603195150_1bb42020-d7cf-4c78-99b6-3bcb200fc761.sql ===

DELETE FROM public.product_images WHERE source='cpagetti';
-- === 20260604045133_646b9531-6c9e-45bf-8fab-040f738a43ed.sql ===

DELETE FROM public.product_images WHERE source = 'cpagetti';
-- === 20260606113717_e1a6779c-ea0d-4d99-9d9d-405a5bdfe544.sql ===

UPDATE product_content SET source_hash='force-regen' WHERE title_uk ILIKE '%oculminex%' OR title_ru ILIKE '%oculminex%' OR intro_uk ILIKE '%крем для зовнішнього%' OR intro_ru ILIKE '%крем для наружного%';
-- === 20260606121554_5a4692e1-8c7a-40de-ba38-15caed07dd8e.sql ===

UPDATE product_content
SET source_hash = 'force-regen-v19'
WHERE source = 'kma'
  AND offer_id IN (
    SELECT offer_id FROM kma_offers
    WHERE name ~* '(саше|ампул|порош|сироп|флакон)'
  );
-- === 20260606122510_958b92bc-3b46-4904-afe1-de6abbae1cb6.sql ===

UPDATE public.product_content
SET source_hash = 'force-regen-v20'
WHERE source = 'kma'
  AND offer_id IN (
    SELECT offer_id FROM public.kma_offers
    WHERE lower(name) ~ '(^|[^[:alpha:]])(крем|мазь|гель|бальзам|капли|капл[іи]|спрей|саше|ампул|порош|сироп|шампунь|шампо|сыворотк|сироватк|капсул|таблет|пластыр|пластир|чай|флакон|лосьон|масло|свеч|суппозит)([^[:alpha:]]|$)'
  );
-- === 20260606123552_908efb29-961a-411b-a9ce-4a686df7ad3d.sql ===

UPDATE public.product_content SET source_hash = 'force-regen-v21-atomic' WHERE source_hash <> 'force-regen-v21-atomic';
