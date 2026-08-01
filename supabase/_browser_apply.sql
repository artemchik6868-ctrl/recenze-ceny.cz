

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

-- === 20260606125347_9f8fab9d-1a34-45e0-b81a-4a8ecd180814.sql ===

UPDATE public.product_content SET source_hash = 'force-regen-v22' WHERE source_hash <> 'force-regen-v22';

-- === 20260606132005_3e02f147-6b81-45b3-af23-57d4e77ebab8.sql ===

UPDATE public.product_content
SET source_hash = 'force-regen-v23'
WHERE source_hash <> 'force-regen-v23'
  AND (
    -- Все ряды, чей контент противоречит generic_item (наша основная проблема),
    -- плюс конкретный товар-эталон (электрический очиститель кистей).
    offer_id = 17178
    OR title_uk ILIKE '%засіб для очей%'
    OR title_ru ILIKE '%средство для глаз%'
    OR subtitle_uk ILIKE '%засіб для очей%'
    OR subtitle_ru ILIKE '%средство для глаз%'
    OR display_title_uk ILIKE '%засіб для очей%'
    OR display_title_ru ILIKE '%средство для глаз%'
    OR (display_title_ru ILIKE '%очистител%кист%' AND display_title_uk NOT ILIKE '%очищувач%пензл%')
  );

-- === 20260607121810_139f5dff-49fa-426f-8f85-bce5e126480f.sql ===

UPDATE public.product_content
SET source_hash = 'force-purge-v26-' || offer_id::text
WHERE (source = 'cpa_tl' AND offer_id IN (17178, 20995))
   OR (
     -- broad sweep: any row with eye-care / alcohol-craving terms in short fields
     (
       coalesce(display_title_uk,'') || ' ' || coalesce(subtitle_uk,'') || ' ' || coalesce(meta_desc_uk,'') || ' ' || coalesce(title_uk,'') ||
       coalesce(display_title_ru,'') || ' ' || coalesce(subtitle_ru,'') || ' ' || coalesce(meta_desc_ru,'') || ' ' || coalesce(title_ru,'')
     ) ~* '(засіб для оч|средство для глаз|для оч[ейі]\b|для глаз\b|втом\w+ оч|сухіст\w+ оч|\bзір\b|\bзрен(ие|ия|ию)\b|тяг\w+ до алкогол|тягу до алкогол|зменшення тяги до алкогол)'
   );

-- === 20260607142043_31bb0428-2407-4fa9-9e60-eb6bc1351a48.sql ===


ALTER TABLE public.product_content
  ADD COLUMN IF NOT EXISTS qa_status_uk text,
  ADD COLUMN IF NOT EXISTS qa_status_ru text,
  ADD COLUMN IF NOT EXISTS qa_reason_uk text,
  ADD COLUMN IF NOT EXISTS qa_reason_ru text,
  ADD COLUMN IF NOT EXISTS qa_checked_at timestamptz;

CREATE INDEX IF NOT EXISTS product_content_qa_status_idx
  ON public.product_content (qa_status_uk, qa_status_ru);

-- === 20260608073517_48942467-4fd2-4299-88b5-ee8c6b9833ba.sql ===

CREATE TABLE public.product_briefs (
  source text NOT NULL,
  offer_id integer NOT NULL,
  pipeline_version text NOT NULL,
  source_hash text NOT NULL,
  category_slug text NOT NULL,
  brand text,
  clean_title text,
  physical_form text NOT NULL,
  brief_confidence numeric NOT NULL,
  warnings text[] NOT NULL DEFAULT '{}',
  allowed_lex_uk text[] NOT NULL DEFAULT '{}',
  allowed_lex_ru text[] NOT NULL DEFAULT '{}',
  forbidden_lex_uk text[] NOT NULL DEFAULT '{}',
  forbidden_lex_ru text[] NOT NULL DEFAULT '{}',
  cleaned_desc_len integer NOT NULL,
  qa_status_uk text,
  qa_status_ru text,
  qa_errors_uk text[] NOT NULL DEFAULT '{}',
  qa_errors_ru text[] NOT NULL DEFAULT '{}',
  generated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, offer_id)
);

GRANT SELECT ON public.product_briefs TO anon, authenticated;
GRANT ALL ON public.product_briefs TO service_role;

ALTER TABLE public.product_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read product_briefs"
  ON public.product_briefs
  FOR SELECT
  USING (true);

CREATE INDEX product_briefs_qa_status_uk_idx ON public.product_briefs (qa_status_uk) WHERE qa_status_uk IS NOT NULL;
CREATE INDEX product_briefs_qa_status_ru_idx ON public.product_briefs (qa_status_ru) WHERE qa_status_ru IS NOT NULL;
CREATE INDEX product_briefs_pipeline_version_idx ON public.product_briefs (pipeline_version);

-- === 20260608073737_1323c80d-99d7-4cd5-b387-20d544f49397.sql ===

DROP POLICY IF EXISTS "public read product_briefs" ON public.product_briefs;
REVOKE SELECT ON public.product_briefs FROM anon, authenticated;

-- === 20260608154653_696bb4e5-4d99-4eab-8cc7-0e1647824544.sql ===

ALTER TABLE public.product_content
  ADD COLUMN IF NOT EXISTS description_html_uk text,
  ADD COLUMN IF NOT EXISTS description_html_ru text;

-- === 20260608181946_284e58d0-bdde-42f9-b92e-82fda9905192.sql ===

DELETE FROM public.product_content WHERE (source='cpagetti' AND offer_id IN (16555,16567)) OR (source='kma' AND offer_id IN (10785,11786,10890,11511));

-- === 20260609111345_fef6e093-2814-4fdd-a42a-d964e5ccbbdc.sql ===

ALTER TABLE public.product_content ADD COLUMN IF NOT EXISTS form_kind text;

-- === 20260609112821_490c3d08-9ef8-4c0b-a14e-f3dc91d3c64d.sql ===

UPDATE public.product_content
SET
  display_title_ru = NULLIF(trim(both ' ,;:-—|.·•' FROM regexp_replace(regexp_replace(regexp_replace(display_title_ru,
    '(^|[^[:alnum:]])\d{1,5}\s*(руб\.?|rub|грн\.?|uah|usd|eur|₽|₴|\$|€)([^[:alnum:]]|$)', '\1\3', 'gi'),
    '(^|[^[:alnum:]])(бесплатно|безкоштовно|free|hold|статик|динамик|static|dynamic|UA|RU|UAH|KZ|BY|NEW|TOP|VIP)([^[:alnum:]]|$)', '\1\3', 'gi'),
    '\s{2,}', ' ', 'g')), ''),
  display_title_uk = NULLIF(trim(both ' ,;:-—|.·•' FROM regexp_replace(regexp_replace(regexp_replace(display_title_uk,
    '(^|[^[:alnum:]])\d{1,5}\s*(руб\.?|rub|грн\.?|uah|usd|eur|₽|₴|\$|€)([^[:alnum:]]|$)', '\1\3', 'gi'),
    '(^|[^[:alnum:]])(бесплатно|безкоштовно|free|hold|статик|динамик|static|dynamic|UA|RU|UAH|KZ|BY|NEW|TOP|VIP)([^[:alnum:]]|$)', '\1\3', 'gi'),
    '\s{2,}', ' ', 'g')), '')
WHERE
  display_title_ru ~* '\d+\s*(руб|грн|usd|eur|₽|₴|\$|€)'
  OR display_title_uk ~* '\d+\s*(руб|грн|usd|eur|₽|₴|\$|€)'
  OR display_title_ru ~* '(бесплатно|безкоштовно|free|hold|статик|динамик|static|dynamic)'
  OR display_title_uk ~* '(бесплатно|безкоштовно|free|hold|статик|динамик|static|dynamic)';

-- === 20260609151457_7d1e5e9a-2c5f-4177-a0e7-1d7841d84075.sql ===

-- Force regeneration of display_title rows where a Cyrillic-leading title
-- still contains an uppercase English descriptor word (legacy data from
-- before splitBrandAndTail learned to handle Cyrillic brands).
UPDATE public.product_content
SET source_hash = 'force-retranslate-' || extract(epoch from now())::bigint::text
WHERE (
  (display_title_ru ~ '[A-Z]{4,}' AND display_title_ru !~ '^[A-Za-z]')
  OR
  (display_title_uk ~ '[A-Z]{4,}' AND display_title_uk !~ '^[A-Za-z]')
);
