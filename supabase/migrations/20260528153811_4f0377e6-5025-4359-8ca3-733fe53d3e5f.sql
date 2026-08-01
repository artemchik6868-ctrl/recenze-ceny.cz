UPDATE public.m1_offers
SET picture_url = replace(picture_url, '/offer_img100x100/', '/offer_img300x300/')
WHERE picture_url LIKE '%/offer_img100x100/%';