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