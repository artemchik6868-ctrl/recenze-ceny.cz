-- Public bucket for processed product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access on the bucket objects
CREATE POLICY "Public read product-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Table: cache of self-hosted product images
CREATE TABLE public.product_images (
  source        text        NOT NULL,
  offer_id      integer     NOT NULL,
  original_url  text        NOT NULL,
  storage_path  text        NOT NULL,
  width         integer     NOT NULL,
  height        integer     NOT NULL,
  source_hash   text        NOT NULL,
  processed_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, offer_id)
);

GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT ALL    ON public.product_images TO service_role;

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read product_images"
ON public.product_images FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX product_images_source_idx ON public.product_images (source);