

## Plan: Unlimited (Multi-Use) Coupons

### Summary
Add support for "unlimited" coupons that can be consumed multiple times. Each consumption is logged in a separate table instead of marking the coupon as consumed.

### Database Changes

**1. Add `is_unlimited` column to `coupons` table**
```sql
ALTER TABLE public.coupons ADD COLUMN is_unlimited boolean NOT NULL DEFAULT false;
```

**2. Create `coupon_consumptions` table**
```sql
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
```
- RLS policies: allow service role full access (edge function uses service role key), authenticated users can SELECT.
- Enable RLS on the table.

### Edge Function Changes

**3. Update `consume-coupon/index.ts`**
- After fetching the coupon, check `is_unlimited`:
  - If `true`: skip the "already consumed" check. Instead of updating the coupon row, INSERT a new row into `coupon_consumptions` with branch_name, mobile_number, credit_number, company_due, customer_name. Do NOT set `is_consumed = true` on the coupon.
  - If `false`: keep existing behavior (single-use, mark coupon as consumed).

### Frontend Changes

**4. Update `CouponGenerator.tsx`**
- Add an "Unlimited / Multi-use" toggle (checkbox/switch) in the generation form.
- Pass `is_unlimited` when saving coupons to the database.

**5. Update `CouponList.tsx`**
- Add `is_unlimited` to the Coupon interface.
- Show an "Unlimited" badge in the grid for unlimited coupons.
- For unlimited coupons, hide the "Reset" button (not applicable).
- Optionally show a "View Consumptions" button that queries `coupon_consumptions` for that coupon.

**6. Update `ApiDocs.tsx`**
- Document the updated behavior: when a coupon is unlimited, consume-coupon logs each usage separately and the coupon remains active.

**7. Update `ConsumptionReport.tsx`**
- For unlimited coupons, pull data from `coupon_consumptions` table to include in the report alongside single-use consumed coupons.

### Technical Details
- The `coupon_consumptions` table uses `coupon_id` FK for integrity and stores `code` for convenience.
- The edge function uses `SUPABASE_SERVICE_ROLE_KEY`, so RLS won't block inserts from the API.
- The `check-coupon` API should also be aware: unlimited coupons should return `valid: true` even if previously consumed.

