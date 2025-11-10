-- =====================================================
-- ADD HANDSHAKE TABLES TO COMPLETE THE SYSTEM
-- =====================================================
-- This script adds the missing handshake tables needed for the cloud handshake system
-- Run this in Supabase SQL Editor after applying the authentication schema

-- =====================================================
-- 1. HANDSHAKE REQUESTS TABLE
-- =====================================================

-- Create handshake_requests table for cloud-based handshake communication
CREATE TABLE IF NOT EXISTS public.handshake_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_restaurant_id TEXT NOT NULL,
  callback_url TEXT NOT NULL,
  website_domain TEXT,
  target_restaurant_uid UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  requester_ip TEXT,
  requester_user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. HANDSHAKE RESPONSES TABLE
-- =====================================================

-- Create handshake_responses table for storing handshake responses
CREATE TABLE IF NOT EXISTS public.handshake_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  handshake_request_id UUID REFERENCES public.handshake_requests(id) ON DELETE CASCADE NOT NULL,
  restaurant_uid UUID NOT NULL,
  device_label TEXT NOT NULL,
  app_version TEXT NOT NULL,
  platform TEXT NOT NULL,
  capabilities JSONB NOT NULL DEFAULT '[]',
  response_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. WEBSITE RESTAURANT MAPPINGS TABLE
-- =====================================================

-- Create website_restaurant_mappings table for storing website-to-app mappings
CREATE TABLE IF NOT EXISTS public.website_restaurant_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_restaurant_id TEXT NOT NULL,
  app_restaurant_uid UUID NOT NULL,
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
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Handshake Requests Indexes
CREATE INDEX IF NOT EXISTS idx_handshake_requests_website_restaurant_id ON public.handshake_requests(website_restaurant_id);
CREATE INDEX IF NOT EXISTS idx_handshake_requests_target_restaurant_uid ON public.handshake_requests(target_restaurant_uid);
CREATE INDEX IF NOT EXISTS idx_handshake_requests_status ON public.handshake_requests(status);
CREATE INDEX IF NOT EXISTS idx_handshake_requests_expires_at ON public.handshake_requests(expires_at);

-- Handshake Responses Indexes
CREATE INDEX IF NOT EXISTS idx_handshake_responses_handshake_request_id ON public.handshake_responses(handshake_request_id);
CREATE INDEX IF NOT EXISTS idx_handshake_responses_restaurant_uid ON public.handshake_responses(restaurant_uid);

-- Website Restaurant Mappings Indexes
CREATE INDEX IF NOT EXISTS idx_website_restaurant_mappings_website_restaurant_id ON public.website_restaurant_mappings(website_restaurant_id);
CREATE INDEX IF NOT EXISTS idx_website_restaurant_mappings_app_restaurant_uid ON public.website_restaurant_mappings(app_restaurant_uid);
CREATE INDEX IF NOT EXISTS idx_website_restaurant_mappings_is_active ON public.website_restaurant_mappings(is_active);

-- =====================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.handshake_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handshake_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_restaurant_mappings ENABLE ROW LEVEL SECURITY;

-- Handshake Requests Policies (allow public read for website integration)
CREATE POLICY "Public can insert handshake requests" ON public.handshake_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view handshake requests" ON public.handshake_requests
  FOR SELECT USING (true);

CREATE POLICY "Service role can update handshake requests" ON public.handshake_requests
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

-- Handshake Responses Policies
CREATE POLICY "Public can insert handshake responses" ON public.handshake_responses
  FOR INSERT WITH CHECK (true);

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
-- 6. ENABLE REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable realtime for handshake tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.handshake_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.handshake_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.website_restaurant_mappings;

-- =====================================================
-- 7. VERIFICATION QUERY
-- =====================================================

-- Verify all tables exist
SELECT 
  'handshake_requests' as table_name,
  COUNT(*) as row_count
FROM public.handshake_requests
UNION ALL
SELECT 
  'handshake_responses' as table_name,
  COUNT(*) as row_count
FROM public.handshake_responses
UNION ALL
SELECT 
  'website_restaurant_mappings' as table_name,
  COUNT(*) as row_count
FROM public.website_restaurant_mappings;

-- Success message
SELECT 'Handshake tables created successfully! Cloud handshake system is now ready.' as status;
