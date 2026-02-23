
ALTER TABLE public.coupons
ADD COLUMN credit_number text DEFAULT NULL,
ADD COLUMN company_due numeric DEFAULT NULL;
