-- Add personalization fields to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS base_tone text DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS custom_instructions text DEFAULT NULL;