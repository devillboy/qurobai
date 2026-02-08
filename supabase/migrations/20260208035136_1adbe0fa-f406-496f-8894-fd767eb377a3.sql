
-- Add token tracking to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS tokens_used_today integer DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS tokens_reset_date date DEFAULT CURRENT_DATE;

-- Create qurob_bots table
CREATE TABLE public.qurob_bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT 'sparkles',
  icon_color text DEFAULT '#6366f1',
  system_prompt text NOT NULL,
  is_public boolean DEFAULT false,
  is_official boolean DEFAULT false,
  category text DEFAULT 'general',
  uses_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.qurob_bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read public or own bots" ON public.qurob_bots FOR SELECT USING (is_public = true OR user_id = auth.uid());
CREATE POLICY "Users can insert own bots" ON public.qurob_bots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bots" ON public.qurob_bots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bots" ON public.qurob_bots FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all bots" ON public.qurob_bots FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
