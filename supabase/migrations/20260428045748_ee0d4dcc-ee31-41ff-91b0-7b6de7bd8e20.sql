ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS allowed_models text[] NOT NULL DEFAULT ARRAY['qurob-2','qurob-3.2','qurob-4','q-06']::text[],
  ADD COLUMN IF NOT EXISTS promo_expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days');

UPDATE public.api_keys
SET allowed_models = ARRAY['qurob-2','qurob-3.2','qurob-4','q-06']::text[],
    promo_expires_at = now() + interval '90 days'
WHERE allowed_models IS NULL OR array_length(allowed_models,1) IS NULL;