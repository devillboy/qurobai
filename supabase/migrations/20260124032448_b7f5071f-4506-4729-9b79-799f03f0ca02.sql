-- Allow redeem-code payments without requiring a screenshot
ALTER TABLE public.payment_screenshots
  ALTER COLUMN screenshot_url DROP NOT NULL;