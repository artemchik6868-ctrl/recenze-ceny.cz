-- Track which vision model actually answered (OpenRouter free router may remap).
ALTER TABLE public.offer_image_facts
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS generation_id text;
