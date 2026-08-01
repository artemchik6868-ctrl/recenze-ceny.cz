CREATE POLICY "product-images service-role insert"
ON storage.objects FOR INSERT TO service_role
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product-images service-role update"
ON storage.objects FOR UPDATE TO service_role
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product-images service-role delete"
ON storage.objects FOR DELETE TO service_role
USING (bucket_id = 'product-images');