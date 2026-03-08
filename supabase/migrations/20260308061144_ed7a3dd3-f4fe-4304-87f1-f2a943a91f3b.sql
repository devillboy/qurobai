-- Update get_user_model to return 'Qurob 3.2' instead of 'Qurob 2' for free users
CREATE OR REPLACE FUNCTION public.get_user_model(user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT sp.model_name 
     FROM user_subscriptions us
     JOIN subscription_plans sp ON us.plan_id = sp.id
     WHERE us.user_id = $1 
       AND us.status = 'active' 
       AND us.expires_at > now()
     ORDER BY us.expires_at DESC
     LIMIT 1),
    'Qurob 3.2'
  )
$$;