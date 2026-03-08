ALTER TABLE public.payment_screenshots ADD COLUMN IF NOT EXISTS utr_number text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_screenshots_utr_unique 
ON public.payment_screenshots (utr_number) 
WHERE utr_number IS NOT NULL AND status = 'approved';