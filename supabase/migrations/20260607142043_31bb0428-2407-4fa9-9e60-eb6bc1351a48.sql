
ALTER TABLE public.product_content
  ADD COLUMN IF NOT EXISTS qa_status_uk text,
  ADD COLUMN IF NOT EXISTS qa_status_ru text,
  ADD COLUMN IF NOT EXISTS qa_reason_uk text,
  ADD COLUMN IF NOT EXISTS qa_reason_ru text,
  ADD COLUMN IF NOT EXISTS qa_checked_at timestamptz;

CREATE INDEX IF NOT EXISTS product_content_qa_status_idx
  ON public.product_content (qa_status_uk, qa_status_ru);
