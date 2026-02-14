
-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  description TEXT,
  expiry_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  batch_id TEXT
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert coupons"
  ON public.coupons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update coupons"
  ON public.coupons FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can delete coupons"
  ON public.coupons FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);
