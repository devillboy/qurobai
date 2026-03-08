-- Fix security: coupon codes should not be publicly readable
DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupon_codes;

-- Only authenticated users can validate a specific coupon
CREATE POLICY "Authenticated users can check coupons"
ON public.coupon_codes
FOR SELECT
TO authenticated
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- Fix security: prevent users from self-assigning is_official on qurob_bots
DROP POLICY IF EXISTS "Users can update own bots" ON public.qurob_bots;

CREATE POLICY "Users can update own bots without changing official status"
ON public.qurob_bots
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND is_official = false);