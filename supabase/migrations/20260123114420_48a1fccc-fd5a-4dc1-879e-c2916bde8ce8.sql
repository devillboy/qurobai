-- Enable realtime updates for payment status tracking
-- (safe to run even if already enabled; will error only if already added, which is acceptable in migration history)
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_screenshots;