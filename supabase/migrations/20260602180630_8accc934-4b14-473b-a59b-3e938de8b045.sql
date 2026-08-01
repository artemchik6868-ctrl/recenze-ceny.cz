-- product_content: hi -> uk, en -> ru
ALTER TABLE public.product_content RENAME COLUMN title_hi      TO title_uk;
ALTER TABLE public.product_content RENAME COLUMN subtitle_hi   TO subtitle_uk;
ALTER TABLE public.product_content RENAME COLUMN meta_desc_hi  TO meta_desc_uk;
ALTER TABLE public.product_content RENAME COLUMN intro_hi      TO intro_uk;
ALTER TABLE public.product_content RENAME COLUMN title_en      TO title_ru;
ALTER TABLE public.product_content RENAME COLUMN subtitle_en   TO subtitle_ru;
ALTER TABLE public.product_content RENAME COLUMN meta_desc_en  TO meta_desc_ru;
ALTER TABLE public.product_content RENAME COLUMN intro_en      TO intro_ru;
ALTER TABLE public.product_content RENAME COLUMN sections      TO sections_uk;
ALTER TABLE public.product_content RENAME COLUMN sections_en   TO sections_ru;
ALTER TABLE public.product_content RENAME COLUMN faq           TO faq_uk;
ALTER TABLE public.product_content RENAME COLUMN faq_en        TO faq_ru;

-- m1_offers: INR -> UAH
ALTER TABLE public.m1_offers RENAME COLUMN price_inr TO price_uah;
ALTER TABLE public.m1_offers RENAME COLUMN pay_inr   TO pay_uah;

-- kma_offers: INR -> UAH
ALTER TABLE public.kma_offers RENAME COLUMN commission_inr TO commission_uah;

-- Очистка старого контента/картинок — backfill и image-proxy перегенерируют
TRUNCATE public.product_content;
TRUNCATE public.product_images;