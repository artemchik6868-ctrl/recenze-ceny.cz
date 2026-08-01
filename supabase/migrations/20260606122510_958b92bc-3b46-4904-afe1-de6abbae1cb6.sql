UPDATE public.product_content
SET source_hash = 'force-regen-v20'
WHERE source = 'kma'
  AND offer_id IN (
    SELECT offer_id FROM public.kma_offers
    WHERE lower(name) ~ '(^|[^[:alpha:]])(крем|мазь|гель|бальзам|капли|капл[іи]|спрей|саше|ампул|порош|сироп|шампунь|шампо|сыворотк|сироватк|капсул|таблет|пластыр|пластир|чай|флакон|лосьон|масло|свеч|суппозит)([^[:alpha:]]|$)'
  );