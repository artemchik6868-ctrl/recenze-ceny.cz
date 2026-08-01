UPDATE public.product_content
SET source_hash = 'force-regen-v23'
WHERE source_hash <> 'force-regen-v23'
  AND (
    -- Все ряды, чей контент противоречит generic_item (наша основная проблема),
    -- плюс конкретный товар-эталон (электрический очиститель кистей).
    offer_id = 17178
    OR title_uk ILIKE '%засіб для очей%'
    OR title_ru ILIKE '%средство для глаз%'
    OR subtitle_uk ILIKE '%засіб для очей%'
    OR subtitle_ru ILIKE '%средство для глаз%'
    OR display_title_uk ILIKE '%засіб для очей%'
    OR display_title_ru ILIKE '%средство для глаз%'
    OR (display_title_ru ILIKE '%очистител%кист%' AND display_title_uk NOT ILIKE '%очищувач%пензл%')
  );