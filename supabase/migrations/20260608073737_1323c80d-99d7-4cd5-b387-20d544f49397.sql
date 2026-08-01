DROP POLICY IF EXISTS "public read product_briefs" ON public.product_briefs;
REVOKE SELECT ON public.product_briefs FROM anon, authenticated;