-- Editorial blog posts (offline RSS → LLM ingest). Worker only reads published rows.
-- cover_image_path stores a hotlinked remote image URL (no Storage download).

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  excerpt text,
  body_html text NOT NULL,
  meta_title text,
  meta_description text,
  category_slug text NOT NULL,
  cover_image_path text,
  cover_credit text,
  source_url text NOT NULL,
  source_name text,
  product_ids text[] NOT NULL DEFAULT '{}'::text[],
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'rejected')),
  published_at timestamptz,
  content_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_slug_unique UNIQUE (slug),
  CONSTRAINT blog_posts_source_url_unique UNIQUE (source_url)
);

CREATE INDEX IF NOT EXISTS blog_posts_published_idx
  ON public.blog_posts (published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS blog_posts_content_hash_idx
  ON public.blog_posts (content_hash)
  WHERE content_hash IS NOT NULL;

GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read published blog_posts" ON public.blog_posts;
CREATE POLICY "public read published blog_posts"
  ON public.blog_posts FOR SELECT
  TO anon, authenticated
  USING (status = 'published');
