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
