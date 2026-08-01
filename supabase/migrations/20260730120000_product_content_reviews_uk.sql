-- LLM customer reviews (cs-CZ stored in reviews_uk, same pattern as faq_uk).
ALTER TABLE public.product_content
  ADD COLUMN IF NOT EXISTS reviews_uk jsonb NOT NULL DEFAULT '[]'::jsonb;
