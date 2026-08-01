-- Core schema bootstrap (final state after migrations)

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

CREATE TABLE public.cpa_tl_offers (
  offer_id integer PRIMARY KEY,
  title text NOT NULL,
  picture_url text,
  category text,
  raw jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  synced_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cpa_tl_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read cpa_tl_offers" ON public.cpa_tl_offers FOR SELECT USING (true);
GRANT SELECT ON public.cpa_tl_offers TO anon, authenticated;
GRANT ALL ON public.cpa_tl_offers TO service_role;
CREATE INDEX idx_cpa_tl_offers_is_active ON public.cpa_tl_offers(is_active);

CREATE TABLE public.m1_offers (
  offer_id integer PRIMARY KEY,
  name text NOT NULL,
  picture_url text,
  category text,
  price_uah numeric,
  pay_uah numeric,
  raw jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  synced_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.m1_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read m1_offers" ON public.m1_offers FOR SELECT USING (true);
GRANT SELECT ON public.m1_offers TO anon, authenticated;
GRANT ALL ON public.m1_offers TO service_role;
CREATE INDEX idx_m1_offers_active ON public.m1_offers(is_active);

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
ALTER TABLE public.cpagetti_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read cpagetti_offers" ON public.cpagetti_offers FOR SELECT USING (true);
GRANT SELECT ON public.cpagetti_offers TO anon, authenticated;
GRANT ALL ON public.cpagetti_offers TO service_role;

INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.product_images (
  source text NOT NULL,
  offer_id integer NOT NULL,
  original_url text NOT NULL,
  storage_path text NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  source_hash text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, offer_id)
);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read product_images" ON public.product_images FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT ALL ON public.product_images TO service_role;

CREATE POLICY "product-images service-role insert" ON storage.objects FOR INSERT TO service_role WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product-images service-role update" ON storage.objects FOR UPDATE TO service_role USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product-images service-role delete" ON storage.objects FOR DELETE TO service_role USING (bucket_id = 'product-images');

CREATE TABLE public.indexing_log (
  id bigserial PRIMARY KEY,
  url text NOT NULL,
  provider text NOT NULL,
  status text NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.indexing_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.indexing_log_id_seq TO service_role;
ALTER TABLE public.indexing_log ENABLE ROW LEVEL SECURITY;

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
GRANT ALL ON public.product_briefs TO service_role;
ALTER TABLE public.product_briefs ENABLE ROW LEVEL SECURITY;
