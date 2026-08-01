-- Force regeneration of display_title rows where a Cyrillic-leading title
-- still contains an uppercase English descriptor word (legacy data from
-- before splitBrandAndTail learned to handle Cyrillic brands).
UPDATE public.product_content
SET source_hash = 'force-retranslate-' || extract(epoch from now())::bigint::text
WHERE (
  (display_title_ru ~ '[A-Z]{4,}' AND display_title_ru !~ '^[A-Za-z]')
  OR
  (display_title_uk ~ '[A-Z]{4,}' AND display_title_uk !~ '^[A-Za-z]')
);