-- Add persona column to user_settings
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS persona TEXT DEFAULT 'default';

-- Add voice_output_enabled column
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS voice_output_enabled BOOLEAN DEFAULT false;

-- Add language_preference column
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';

-- Create user_memory table for AI memory feature
CREATE TABLE IF NOT EXISTS public.user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_key TEXT NOT NULL,
  memory_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, memory_key)
);

-- Enable RLS on user_memory
ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_memory
CREATE POLICY "Users can view their own memory" ON public.user_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory" ON public.user_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory" ON public.user_memory
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory" ON public.user_memory
  FOR DELETE USING (auth.uid() = user_id);

-- Create chat_templates table
CREATE TABLE IF NOT EXISTS public.chat_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  icon TEXT DEFAULT 'sparkles',
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on chat_templates
ALTER TABLE public.chat_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_templates
CREATE POLICY "Anyone can view public templates" ON public.chat_templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own templates" ON public.chat_templates
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create templates" ON public.chat_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all templates" ON public.chat_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default templates
INSERT INTO public.chat_templates (title, description, prompt, category, icon) VALUES
  ('Code Review', 'Get expert feedback on your code', 'Please review this code and suggest improvements:', 'coding', 'code'),
  ('Explain Like I''m 5', 'Simple explanations for complex topics', 'Explain this in simple terms that a child could understand:', 'learning', 'lightbulb'),
  ('Blog Post Writer', 'Generate engaging blog content', 'Write a detailed blog post about:', 'writing', 'file-text'),
  ('Debug Helper', 'Find and fix bugs in code', 'Help me debug this code. The error is:', 'coding', 'bug'),
  ('Study Plan', 'Create a personalized learning path', 'Create a study plan for learning:', 'learning', 'book'),
  ('Email Composer', 'Write professional emails', 'Write a professional email about:', 'writing', 'mail'),
  ('Hindi Translator', 'Translate to/from Hindi', 'Translate this to Hindi:', 'language', 'languages'),
  ('Image Generator', 'Create AI images', 'Generate an image of:', 'creative', 'image')
ON CONFLICT DO NOTHING;

-- Add trigger for user_memory updated_at
CREATE TRIGGER update_user_memory_updated_at
  BEFORE UPDATE ON public.user_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();