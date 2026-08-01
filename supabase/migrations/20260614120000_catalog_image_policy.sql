-- Catalog shelf override (other → resolved niche) + image ingest tiers.

ALTER TABLE public.product_briefs
  ADD COLUMN IF NOT EXISTS resolved_category_slug text;

ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS ingest_status text NOT NULL DEFAULT 'self_hosted';

ALTER TABLE public.product_images
  ALTER COLUMN storage_path DROP NOT NULL;

ALTER TABLE public.product_images
  ALTER COLUMN width DROP NOT NULL;

ALTER TABLE public.product_images
  ALTER COLUMN height DROP NOT NULL;

CREATE INDEX IF NOT EXISTS product_briefs_resolved_slug_idx
  ON public.product_briefs (resolved_category_slug)
  WHERE resolved_category_slug IS NOT NULL AND resolved_category_slug <> 'other';
