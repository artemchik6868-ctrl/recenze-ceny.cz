-- === 20260609112821_490c3d08-9ef8-4c0b-a14e-f3dc91d3c64d.sql ===

UPDATE public.product_content
SET
  display_title_ru = NULLIF(trim(both ' ,;:-—|.·•' FROM regexp_replace(regexp_replace(regexp_replace(display_title_ru,
    '(^|[^[:alnum:]])\d{1,5}\s*(руб\.?|rub|грн\.?|uah|usd|eur|₽|₴|\$|€)([^[:alnum:]]|$)', '\1\3', 'gi'),
    '(^|[^[:alnum:]])(бесплатно|безкоштовно|free|hold|статик|динамик|static|dynamic|UA|RU|UAH|KZ|BY|NEW|TOP|VIP)([^[:alnum:]]|$)', '\1\3', 'gi'),
    '\s{2,}', ' ', 'g')), ''),
  display_title_uk = NULLIF(trim(both ' ,;:-—|.·•' FROM regexp_replace(regexp_replace(regexp_replace(display_title_uk,
    '(^|[^[:alnum:]])\d{1,5}\s*(руб\.?|rub|грн\.?|uah|usd|eur|₽|₴|\$|€)([^[:alnum:]]|$)', '\1\3', 'gi'),
    '(^|[^[:alnum:]])(бесплатно|безкоштовно|free|hold|статик|динамик|static|dynamic|UA|RU|UAH|KZ|BY|NEW|TOP|VIP)([^[:alnum:]]|$)', '\1\3', 'gi'),
    '\s{2,}', ' ', 'g')), '')
WHERE
  display_title_ru ~* '\d+\s*(руб|грн|usd|eur|₽|₴|\$|€)'
  OR display_title_uk ~* '\d+\s*(руб|грн|usd|eur|₽|₴|\$|€)'
  OR display_title_ru ~* '(бесплатно|безкоштовно|free|hold|статик|динамик|static|dynamic)'
  OR display_title_uk ~* '(бесплатно|безкоштовно|free|hold|статик|динамик|static|dynamic)';
-- === 20260609151457_7d1e5e9a-2c5f-4177-a0e7-1d7841d84075.sql ===

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
