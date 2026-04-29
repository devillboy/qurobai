-- Grant lifetime subscriptions for ALL plans to admin user (sohamghosh679@gmail.com)
-- This implements "belt + suspenders": code bypass + DB lifetime sub
DO $$
DECLARE
  admin_uid uuid;
  plan_rec RECORD;
BEGIN
  -- Find the admin user via user_roles + auth.users email
  SELECT ur.user_id INTO admin_uid
  FROM public.user_roles ur
  JOIN auth.users u ON u.id = ur.user_id
  WHERE ur.role = 'admin' AND u.email = 'sohamghosh679@gmail.com'
  LIMIT 1;

  IF admin_uid IS NOT NULL THEN
    FOR plan_rec IN SELECT id FROM public.subscription_plans LOOP
      INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, expires_at)
      VALUES (admin_uid, plan_rec.id, 'active', now(), now() + interval '100 years')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- Update get_user_model: prefer Qurob 5 > Q-06 > Qurob 4 > others for admin (gets highest tier)
-- and keep behavior for normal users (latest active sub by expiry)
CREATE OR REPLACE FUNCTION public.get_user_model(user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    -- Admin: always return highest available tier (Qurob 5)
    (SELECT 'Qurob 5' WHERE EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_roles.user_id = $1 AND role = 'admin'
    )),
    (SELECT sp.model_name 
     FROM public.user_subscriptions us
     JOIN public.subscription_plans sp ON us.plan_id = sp.id
     WHERE us.user_id = $1 
       AND us.status = 'active' 
       AND us.expires_at > now()
     ORDER BY 
       CASE sp.model_name
         WHEN 'Qurob 5' THEN 1
         WHEN 'Q-06'    THEN 2
         WHEN 'Qurob 4' THEN 3
         ELSE 4
       END,
       us.expires_at DESC
     LIMIT 1),
    'Qurob 3.2'
  )
$function$;