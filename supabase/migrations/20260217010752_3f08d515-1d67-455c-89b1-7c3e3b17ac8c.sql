
-- Drop all existing restrictive policies
DROP POLICY IF EXISTS "Anyone can check coupon status" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can delete coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can view all coupons" ON public.coupons;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Authenticated users can view all coupons"
ON public.coupons FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert coupons"
ON public.coupons FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update coupons"
ON public.coupons FOR UPDATE TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can delete coupons"
ON public.coupons FOR DELETE TO authenticated
USING (auth.uid() = created_by);
