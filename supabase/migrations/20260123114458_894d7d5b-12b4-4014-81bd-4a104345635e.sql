-- Tighten overly-permissive INSERT policies to service role only
-- api_usage
DROP POLICY IF EXISTS "System can insert API usage" ON public.api_usage;
CREATE POLICY "Service role can insert API usage"
ON public.api_usage
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- notifications
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.role() = 'service_role');