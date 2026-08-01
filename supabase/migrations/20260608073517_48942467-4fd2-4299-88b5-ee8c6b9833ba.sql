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