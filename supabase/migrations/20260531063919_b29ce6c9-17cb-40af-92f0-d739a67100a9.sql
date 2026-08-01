ALTER TABLE public.product_content
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS subtitle_en text,
  ADD COLUMN IF NOT EXISTS intro_en text,
  ADD COLUMN IF NOT EXISTS sections_en jsonb,
  ADD COLUMN IF NOT EXISTS faq_en jsonb,
  ADD COLUMN IF NOT EXISTS meta_desc_en text;