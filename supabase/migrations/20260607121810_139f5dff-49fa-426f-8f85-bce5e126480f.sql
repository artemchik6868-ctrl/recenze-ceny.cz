UPDATE public.product_content
SET source_hash = 'force-purge-v26-' || offer_id::text
WHERE (source = 'cpa_tl' AND offer_id IN (17178, 20995))
   OR (
     -- broad sweep: any row with eye-care / alcohol-craving terms in short fields
     (
       coalesce(display_title_uk,'') || ' ' || coalesce(subtitle_uk,'') || ' ' || coalesce(meta_desc_uk,'') || ' ' || coalesce(title_uk,'') ||
       coalesce(display_title_ru,'') || ' ' || coalesce(subtitle_ru,'') || ' ' || coalesce(meta_desc_ru,'') || ' ' || coalesce(title_ru,'')
     ) ~* '(засіб для оч|средство для глаз|для оч[ейі]\b|для глаз\b|втом\w+ оч|сухіст\w+ оч|\bзір\b|\bзрен(ие|ия|ию)\b|тяг\w+ до алкогол|тягу до алкогол|зменшення тяги до алкогол)'
   );