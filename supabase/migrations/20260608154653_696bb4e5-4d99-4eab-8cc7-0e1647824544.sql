ALTER TABLE public.product_content
  ADD COLUMN IF NOT EXISTS description_html_uk text,
  ADD COLUMN IF NOT EXISTS description_html_ru text;