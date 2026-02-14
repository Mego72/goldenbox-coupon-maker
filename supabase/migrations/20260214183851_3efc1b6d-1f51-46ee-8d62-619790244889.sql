
-- Rename customer_name to company_name
ALTER TABLE public.coupons RENAME COLUMN customer_name TO company_name;

-- Add consumption tracking fields
ALTER TABLE public.coupons ADD COLUMN consumed_by_customer text;
ALTER TABLE public.coupons ADD COLUMN consumed_by_mobile text;
ALTER TABLE public.coupons ADD COLUMN consumed_at timestamp with time zone;
ALTER TABLE public.coupons ADD COLUMN is_consumed boolean NOT NULL DEFAULT false;

-- Allow public read access for POS check (anon can check coupon status)
CREATE POLICY "Anyone can check coupon status"
ON public.coupons
FOR SELECT
USING (true);
