-- Projects table for organizing conversations (ChatGPT-style)
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#4a8fca',
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add project_id to conversations
ALTER TABLE public.conversations ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- API Keys table for developer access
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_preview TEXT NOT NULL,
  name TEXT DEFAULT 'My API Key',
  model TEXT DEFAULT 'qurob-2',
  is_trial BOOLEAN DEFAULT true,
  trial_expires_at TIMESTAMPTZ,
  requests_today INT DEFAULT 0,
  requests_month INT DEFAULT 0,
  total_requests BIGINT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API Usage tracking
CREATE TABLE public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
  tokens_used INT DEFAULT 0,
  model TEXT,
  endpoint TEXT,
  status_code INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can manage own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

-- API Keys policies
CREATE POLICY "Users can manage own API keys" ON public.api_keys
  FOR ALL USING (auth.uid() = user_id);

-- API Usage policies
CREATE POLICY "Users can view own API usage" ON public.api_usage
  FOR SELECT USING (
    api_key_id IN (SELECT id FROM public.api_keys WHERE user_id = auth.uid())
  );

CREATE POLICY "System can insert API usage" ON public.api_usage
  FOR INSERT WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_conversations_project ON public.conversations(project_id);
CREATE INDEX idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX idx_api_usage_key ON public.api_usage(api_key_id);
CREATE INDEX idx_api_usage_created ON public.api_usage(created_at);

-- Trigger for projects updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();