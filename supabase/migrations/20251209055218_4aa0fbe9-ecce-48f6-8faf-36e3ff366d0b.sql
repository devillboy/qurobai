-- Add Q-06 Code Specialist plan at ₹320/month
INSERT INTO subscription_plans (id, name, model_name, price_inr, duration_days, features)
VALUES (
  gen_random_uuid(),
  'Code Specialist',
  'Q-06',
  320,
  30,
  '["Q-06 Code AI", "Expert coding assistance", "All programming languages", "Architecture guidance", "Code review", "Debugging help", "Best practices"]'::jsonb
);