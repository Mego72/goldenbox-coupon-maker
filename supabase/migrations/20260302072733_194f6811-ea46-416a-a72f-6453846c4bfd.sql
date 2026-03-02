
-- Add is_unlimited column to coupons table
ALTER TABLE public.coupons ADD COLUMN is_unlimited boolean NOT NULL DEFAULT false;

-- Create coupon_consumptions table
CREATE TABLE public.coupon_consumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  code text NOT NULL,
  branch_name text NOT NULL,
  consumed_at timestamptz NOT NULL DEFAULT now(),
  mobile_number text,
  credit_number text,
  company_due numeric,
  customer_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupon_consumptions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can SELECT
CREATE POLICY "Authenticated users can view consumptions"
  ON public.coupon_consumptions
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role has full access by default (bypasses RLS)
