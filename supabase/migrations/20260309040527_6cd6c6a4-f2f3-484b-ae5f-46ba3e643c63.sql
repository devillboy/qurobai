-- =====================================
-- FRAUD DETECTION SYSTEM
-- =====================================

-- Table to track fraud attempts with progressive strikes
CREATE TABLE public.fraud_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  attempt_type TEXT NOT NULL, -- 'duplicate_utr', 'invalid_screenshot', 'tampered_image', 'fake_transaction'
  details JSONB DEFAULT '{}',
  payment_id UUID REFERENCES public.payment_screenshots(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User ban status table
CREATE TABLE public.user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  ban_level INTEGER DEFAULT 0, -- 0=none, 1=warning, 2=temp_block, 3=permanent
  warning_count INTEGER DEFAULT 0,
  temp_blocked_until TIMESTAMP WITH TIME ZONE,
  permanent_ban BOOLEAN DEFAULT false,
  ban_reason TEXT,
  last_offense_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================
-- SESSION MANAGEMENT & LOGIN ALERTS
-- =====================================

-- Table to track user login sessions
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_info TEXT, -- Browser/OS info
  ip_address TEXT,
  location TEXT, -- City, Country
  login_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_current BOOLEAN DEFAULT true,
  session_token TEXT UNIQUE -- To identify and revoke sessions
);

-- Table for login alerts
CREATE TABLE public.login_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  location TEXT,
  is_new_device BOOLEAN DEFAULT false,
  is_new_location BOOLEAN DEFAULT false,
  alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fraud_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_alerts ENABLE ROW LEVEL SECURITY;

-- Fraud attempts: Admins manage, service role inserts
CREATE POLICY "Admins can view fraud attempts" ON public.fraud_attempts FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert fraud" ON public.fraud_attempts FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- User bans: Admins manage, users can view own ban status
CREATE POLICY "Admins can manage bans" ON public.user_bans FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own ban status" ON public.user_bans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage bans" ON public.user_bans FOR ALL USING (auth.role() = 'service_role');

-- Sessions: Users manage their own
CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.user_sessions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage sessions" ON public.user_sessions FOR ALL USING (auth.role() = 'service_role');

-- Login alerts: Users view own, service inserts
CREATE POLICY "Users can view own login alerts" ON public.login_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert alerts" ON public.login_alerts FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update alerts" ON public.login_alerts FOR UPDATE USING (auth.role() = 'service_role');

-- Index for faster queries
CREATE INDEX idx_fraud_attempts_user ON public.fraud_attempts(user_id);
CREATE INDEX idx_user_bans_user ON public.user_bans(user_id);
CREATE INDEX idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX idx_login_alerts_user ON public.login_alerts(user_id);