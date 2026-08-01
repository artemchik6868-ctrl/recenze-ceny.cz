-- Track when an offer first appeared in our catalogue (stable across feed re-syncs).
ALTER TABLE public.cpa_tl_offers ADD COLUMN IF NOT EXISTS first_seen_at timestamptz;
ALTER TABLE public.kma_offers ADD COLUMN IF NOT EXISTS first_seen_at timestamptz;
ALTER TABLE public.m1_offers ADD COLUMN IF NOT EXISTS first_seen_at timestamptz;
ALTER TABLE public.cpagetti_offers ADD COLUMN IF NOT EXISTS first_seen_at timestamptz;

UPDATE public.cpa_tl_offers SET first_seen_at = synced_at WHERE first_seen_at IS NULL;
UPDATE public.kma_offers SET first_seen_at = synced_at WHERE first_seen_at IS NULL;
UPDATE public.m1_offers SET first_seen_at = synced_at WHERE first_seen_at IS NULL;
UPDATE public.cpagetti_offers SET first_seen_at = synced_at WHERE first_seen_at IS NULL;

ALTER TABLE public.cpa_tl_offers ALTER COLUMN first_seen_at SET DEFAULT now();
ALTER TABLE public.kma_offers ALTER COLUMN first_seen_at SET DEFAULT now();
ALTER TABLE public.m1_offers ALTER COLUMN first_seen_at SET DEFAULT now();
ALTER TABLE public.cpagetti_offers ALTER COLUMN first_seen_at SET DEFAULT now();

ALTER TABLE public.cpa_tl_offers ALTER COLUMN first_seen_at SET NOT NULL;
ALTER TABLE public.kma_offers ALTER COLUMN first_seen_at SET NOT NULL;
ALTER TABLE public.m1_offers ALTER COLUMN first_seen_at SET NOT NULL;
ALTER TABLE public.cpagetti_offers ALTER COLUMN first_seen_at SET NOT NULL;
