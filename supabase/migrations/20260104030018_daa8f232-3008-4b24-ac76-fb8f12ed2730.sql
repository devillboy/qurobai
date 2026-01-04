-- Create announcements table for admin announcements
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'maintenance')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create maintenance_mode table (single row)
CREATE TABLE public.maintenance_mode (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  message TEXT DEFAULT 'QurobAi is currently under maintenance. Please check back soon.',
  enabled_by UUID REFERENCES auth.users(id),
  enabled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default maintenance row
INSERT INTO public.maintenance_mode (is_enabled, message) 
VALUES (false, 'QurobAi is currently under maintenance. Please check back soon.');

-- Create admin_settings table
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default admin settings
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
  ('upi_id', '7864084241@ybl'),
  ('support_email', 'sohamghosh679@gmail.com');

-- Add avatar_url to profiles if not exists (already exists based on schema)
-- Add theme_preference to user_settings
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'dark';

-- Enable RLS on all new tables
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_mode ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Announcements policies
CREATE POLICY "Anyone can view active announcements" 
ON public.announcements 
FOR SELECT 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can manage announcements" 
ON public.announcements 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Maintenance mode policies
CREATE POLICY "Anyone can view maintenance status" 
ON public.maintenance_mode 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update maintenance mode" 
ON public.maintenance_mode 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin settings policies
CREATE POLICY "Admins can manage settings" 
ON public.admin_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view public settings" 
ON public.admin_settings 
FOR SELECT 
USING (setting_key IN ('upi_id', 'support_email'));