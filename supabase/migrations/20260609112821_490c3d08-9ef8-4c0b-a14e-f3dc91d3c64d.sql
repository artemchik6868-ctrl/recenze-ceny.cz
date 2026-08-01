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