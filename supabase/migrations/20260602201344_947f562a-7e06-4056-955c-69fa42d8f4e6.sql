ALTER TABLE public.product_content
  ADD COLUMN IF NOT EXISTS display_title_uk text,
  ADD COLUMN IF NOT EXISTS display_title_ru text;