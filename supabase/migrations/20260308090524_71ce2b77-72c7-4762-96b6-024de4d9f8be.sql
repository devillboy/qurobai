
-- Add qurob_id column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qurob_id TEXT UNIQUE;

-- Create function to generate unique qurob_id
CREATE OR REPLACE FUNCTION public.generate_qurob_id()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_id TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    -- Generate format: QRB-XXXXXX (6 alphanumeric chars)
    new_id := 'QRB-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE qurob_id = new_id) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN new_id;
END;
$$;

-- Update handle_new_user to include qurob_id generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, qurob_id)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name', public.generate_qurob_id());
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Backfill existing profiles that don't have a qurob_id
UPDATE public.profiles
SET qurob_id = public.generate_qurob_id()
WHERE qurob_id IS NULL;

-- Make qurob_id NOT NULL after backfill
ALTER TABLE public.profiles ALTER COLUMN qurob_id SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN qurob_id SET DEFAULT public.generate_qurob_id();
