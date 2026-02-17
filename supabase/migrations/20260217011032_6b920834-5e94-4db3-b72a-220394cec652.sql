
-- Drop restrictive delete/update policies
DROP POLICY IF EXISTS "Authenticated users can delete coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can update coupons" ON public.coupons;

-- Recreate allowing any authenticated user
CREATE POLICY "Authenticated users can delete coupons"
ON public.coupons FOR DELETE TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update coupons"
ON public.coupons FOR UPDATE TO authenticated
USING (true);
