UPDATE product_content
SET source_hash = 'force-regen-v19'
WHERE source = 'kma'
  AND offer_id IN (
    SELECT offer_id FROM kma_offers
    WHERE name ~* '(саше|ампул|порош|сироп|флакон)'
  );