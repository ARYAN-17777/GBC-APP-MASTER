-- Cloud-Based Dynamic Handshake System Schema
-- Run this in your Supabase SQL Editor to enable cloud-based handshake

-- =====================================================
-- RESTAURANT REGISTRATION TABLE
-- =====================================================

-- Create restaurant_registrations table for automatic device registration
CREATE TABLE IF NOT EXISTS public.restaurant_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_uid UUID NOT NULL UNIQUE, -- App's internal restaurant UID
  device_label TEXT NOT NULL,
  app_version TEXT NOT NULL,
  platform TEXT NOT NULL,
  capabilities JSONB NOT NULL DEFAULT '[]',
  device_info JSONB NOT NULL DEFAULT '{}',
  network_info JSONB NOT NULL DEFAULT '{}',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- HANDSHAKE REQUESTS TABLE
-- =====================================================

-- Create handshake_requests table for cloud-based handshake communication
CREATE TABLE IF NOT EXISTS public.handshake_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_restaurant_id TEXT NOT NULL,
  callback_url TEXT NOT NULL,
  request_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  target_restaurant_uid UUID REFERENCES public.restaurant_registrations(restaurant_uid),
  requester_ip TEXT,
  requester_user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- HANDSHAKE RESPONSES TABLE
-- =====================================================

-- Create handshake_responses table for storing handshake responses
CREATE TABLE IF NOT EXISTS public.handshake_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  handshake_request_id UUID REFERENCES public.handshake_requests(id) ON DELETE CASCADE NOT NULL,
  restaurant_uid UUID REFERENCES public.restaurant_registrations(restaurant_uid) NOT NULL,
  device_label TEXT NOT NULL,
  app_version TEXT NOT NULL,
  platform TEXT NOT NULL,
  capabilities JSONB NOT NULL DEFAULT '[]',
  response_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- WEBSITE RESTAURANT MAPPINGS TABLE
-- =====================================================

-- Create website_restaurant_mappings table for storing website-to-app mappings
CREATE TABLE IF NOT EXISTS public.website_restaurant_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_restaurant_id TEXT NOT NULL,
  app_restaurant_uid UUID REFERENCES public.restaurant_registrations(restaurant_uid) NOT NULL,
  website_domain TEXT,
  callback_url TEXT NOT NULL,
  handshake_request_id UUID REFERENCES public.handshake_requests(id),
  is_active BOOLEAN DEFAULT true,
  last_handshake TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(website_restaurant_id, app_restaurant_uid)
);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.restaurant_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handshake_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handshake_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_restaurant_mappings ENABLE ROW LEVEL SECURITY;

-- Restaurant Registrations Policies
CREATE POLICY "Users can view own restaurant registrations" ON public.restaurant_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own restaurant registrations" ON public.restaurant_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own restaurant registrations" ON public.restaurant_registrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can view all restaurant registrations" ON public.restaurant_registrations
  FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

-- Handshake Requests Policies (allow public read for website integration)
CREATE POLICY "Public can insert handshake requests" ON public.handshake_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view handshake requests" ON public.handshake_requests
  FOR SELECT USING (true);

CREATE POLICY "Service role can update handshake requests" ON public.handshake_requests
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

-- Handshake Responses Policies
CREATE POLICY "Users can insert handshake responses for own restaurants" ON public.handshake_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurant_registrations 
      WHERE restaurant_uid = handshake_responses.restaurant_uid 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view handshake responses" ON public.handshake_responses
  FOR SELECT USING (true);

-- Website Restaurant Mappings Policies
CREATE POLICY "Public can view website restaurant mappings" ON public.website_restaurant_mappings
  FOR SELECT USING (true);

CREATE POLICY "Public can insert website restaurant mappings" ON public.website_restaurant_mappings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update website restaurant mappings" ON public.website_restaurant_mappings
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Restaurant Registrations Indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_registrations_user_id ON public.restaurant_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_registrations_restaurant_uid ON public.restaurant_registrations(restaurant_uid);
CREATE INDEX IF NOT EXISTS idx_restaurant_registrations_last_seen ON public.restaurant_registrations(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_restaurant_registrations_is_online ON public.restaurant_registrations(is_online);

-- Handshake Requests Indexes
CREATE INDEX IF NOT EXISTS idx_handshake_requests_status ON public.handshake_requests(status);
CREATE INDEX IF NOT EXISTS idx_handshake_requests_website_restaurant_id ON public.handshake_requests(website_restaurant_id);
CREATE INDEX IF NOT EXISTS idx_handshake_requests_target_restaurant_uid ON public.handshake_requests(target_restaurant_uid);
CREATE INDEX IF NOT EXISTS idx_handshake_requests_expires_at ON public.handshake_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_handshake_requests_created_at ON public.handshake_requests(created_at DESC);

-- Handshake Responses Indexes
CREATE INDEX IF NOT EXISTS idx_handshake_responses_handshake_request_id ON public.handshake_responses(handshake_request_id);
CREATE INDEX IF NOT EXISTS idx_handshake_responses_restaurant_uid ON public.handshake_responses(restaurant_uid);

-- Website Restaurant Mappings Indexes
CREATE INDEX IF NOT EXISTS idx_website_restaurant_mappings_website_restaurant_id ON public.website_restaurant_mappings(website_restaurant_id);
CREATE INDEX IF NOT EXISTS idx_website_restaurant_mappings_app_restaurant_uid ON public.website_restaurant_mappings(app_restaurant_uid);
CREATE INDEX IF NOT EXISTS idx_website_restaurant_mappings_is_active ON public.website_restaurant_mappings(is_active);

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_restaurant_registrations_updated_at
  BEFORE UPDATE ON public.restaurant_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_handshake_requests_updated_at
  BEFORE UPDATE ON public.handshake_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_website_restaurant_mappings_updated_at
  BEFORE UPDATE ON public.website_restaurant_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically expire old handshake requests
CREATE OR REPLACE FUNCTION public.expire_old_handshake_requests()
RETURNS void AS $$
BEGIN
  UPDATE public.handshake_requests 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' 
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update restaurant last_seen timestamp
CREATE OR REPLACE FUNCTION public.update_restaurant_last_seen(restaurant_uid_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.restaurant_registrations 
  SET last_seen = NOW(), is_online = true, updated_at = NOW()
  WHERE restaurant_uid = restaurant_uid_param;
END;
$$ LANGUAGE plpgsql;

-- Function to mark restaurant as offline
CREATE OR REPLACE FUNCTION public.mark_restaurant_offline(restaurant_uid_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.restaurant_registrations 
  SET is_online = false, updated_at = NOW()
  WHERE restaurant_uid = restaurant_uid_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable realtime for handshake tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.handshake_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.handshake_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.website_restaurant_mappings;
