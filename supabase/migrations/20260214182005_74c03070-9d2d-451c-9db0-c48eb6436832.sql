
ALTER TABLE public.coupons
ADD COLUMN max_discount_value numeric NULL,
ADD COLUMN customer_name text NULL;
