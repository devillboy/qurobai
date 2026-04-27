
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS brain_memory_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_per_chat_memory boolean NOT NULL DEFAULT true;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS memory_enabled boolean;
