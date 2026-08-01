CREATE TABLE public.product_content (
  source text NOT NULL DEFAULT 'cpa_tl',
  offer_id integer NOT NULL,
  source_hash text NOT NULL,
  title_uk text NOT NULL,
  subtitle_uk text NOT NULL,
  meta_desc_uk text NOT NULL,
  intro_uk text NOT NULL,
  title_ru text,
  subtitle_ru text,
  meta_desc_ru text,
  intro_ru text,
  sections_uk jsonb NOT NULL,
  sections_ru jsonb,
  faq_uk jsonb NOT NULL,
  faq_ru jsonb,
  display_title_uk text,
  display_title_ru text,
  description_html_uk text,
  description_html_ru text,
  form_kind text,
  qa_status_uk text,
  qa_status_ru text,
  qa_reason_uk text,
  qa_reason_ru text,
  qa_checked_at timestamptz,
  generated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, offer_id)
);
ALTER TABLE public.product_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read product_content" ON public.product_content FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.product_content TO anon, authenticated;
GRANT ALL ON public.product_content TO service_role;

CREATE TABLE public.kma_offers (
  offer_id integer PRIMARY KEY,
  name text NOT NULL,
  logo text,
  category text,
  itemprice_rub numeric,
  commission_uah numeric,
  raw jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  synced_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kma_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read kma_offers" ON public.kma_offers FOR SELECT USING (true);
GRANT SELECT ON public.kma_offers TO anon, authenticated;
GRANT ALL ON public.kma_offers TO service_role;

CREATE TABLE public.kma_channels (
  offer_id integer PRIMARY KEY,
  channel_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kma_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read kma_channels" ON public.kma_channels FOR SELECT USING (true);
GRANT SELECT ON public.kma_channels TO anon, authenticated;
GRANT ALL ON public.kma_channels TO service_role;
