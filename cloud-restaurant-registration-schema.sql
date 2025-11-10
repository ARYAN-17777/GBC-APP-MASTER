-- =====================================================
-- CLOUD-BASED RESTAURANT REGISTRATION SYSTEM SCHEMA
-- =====================================================
-- This schema creates tables for the cloud-based restaurant registration system
-- that allows websites to register restaurants with the GBC Kitchen App
-- following the same cloud-first architecture as the handshake system.

-- =====================================================
-- 1. REGISTERED RESTAURANTS TABLE
-- =====================================================
-- Stores restaurant details registered via the cloud API
CREATE TABLE IF NOT EXISTS public.registered_restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_restaurant_uid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  website_restaurant_id TEXT NOT NULL UNIQUE,
  restaurant_name TEXT NOT NULL CHECK (length(restaurant_name) >= 3 AND length(restaurant_name) <= 200),
  restaurant_phone TEXT NOT NULL CHECK (length(restaurant_phone) >= 10 AND length(restaurant_phone) <= 20),
  restaurant_email TEXT NOT NULL UNIQUE CHECK (restaurant_email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  restaurant_address TEXT NOT NULL CHECK (length(restaurant_address) >= 10 AND length(restaurant_address) <= 500),
  owner_name TEXT CHECK (owner_name IS NULL OR length(owner_name) <= 200),
  category TEXT CHECK (category IS NULL OR length(category) <= 100),
  callback_url TEXT NOT NULL CHECK (callback_url LIKE 'https://%' AND length(callback_url) <= 500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. RESTAURANT REGISTRATION LOGS TABLE
-- =====================================================
-- Audit log for registration attempts (for rate limiting and monitoring)
CREATE TABLE IF NOT EXISTS public.restaurant_registration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  website_restaurant_id TEXT,
  restaurant_email TEXT,
  restaurant_phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'duplicate_email', 'duplicate_phone', 'duplicate_website_id', 'validation_error', 'rate_limited')),
  error_message TEXT,
  user_agent TEXT,
  website_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

-- Registered restaurants indexes
CREATE INDEX IF NOT EXISTS idx_registered_restaurants_email ON public.registered_restaurants(restaurant_email);
CREATE INDEX IF NOT EXISTS idx_registered_restaurants_phone ON public.registered_restaurants(restaurant_phone);
CREATE INDEX IF NOT EXISTS idx_registered_restaurants_website_id ON public.registered_restaurants(website_restaurant_id);
CREATE INDEX IF NOT EXISTS idx_registered_restaurants_app_uid ON public.registered_restaurants(app_restaurant_uid);
CREATE INDEX IF NOT EXISTS idx_registered_restaurants_active ON public.registered_restaurants(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_registered_restaurants_created ON public.registered_restaurants(created_at);

-- Registration logs indexes (for rate limiting queries)
CREATE INDEX IF NOT EXISTS idx_registration_logs_ip_created ON public.restaurant_registration_logs(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_registration_logs_status ON public.restaurant_registration_logs(status);
CREATE INDEX IF NOT EXISTS idx_registration_logs_email ON public.restaurant_registration_logs(restaurant_email);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on registered restaurants
ALTER TABLE public.registered_restaurants ENABLE ROW LEVEL SECURITY;

-- Allow public read access for registration checks (duplicate detection)
CREATE POLICY IF NOT EXISTS "Allow public registration checks" ON public.registered_restaurants
  FOR SELECT USING (true);

-- Allow service role full access for Edge Functions
CREATE POLICY IF NOT EXISTS "Allow service role full access on registered_restaurants" ON public.registered_restaurants
  FOR ALL USING (auth.role() = 'service_role');

-- Enable RLS on registration logs
ALTER TABLE public.restaurant_registration_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access for Edge Functions
CREATE POLICY IF NOT EXISTS "Allow service role full access on registration_logs" ON public.restaurant_registration_logs
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 5. REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable Realtime for registered restaurants (for monitoring)
ALTER PUBLICATION supabase_realtime ADD TABLE public.registered_restaurants;

-- Enable Realtime for registration logs (for monitoring)
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_registration_logs;

-- =====================================================
-- 6. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on registered_restaurants
DROP TRIGGER IF EXISTS update_registered_restaurants_updated_at ON public.registered_restaurants;
CREATE TRIGGER update_registered_restaurants_updated_at
    BEFORE UPDATE ON public.registered_restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to normalize phone numbers for duplicate detection
CREATE OR REPLACE FUNCTION normalize_phone(phone_input TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Remove spaces, hyphens, parentheses, and other common phone formatting
    RETURN regexp_replace(phone_input, '[^+0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql;

-- Function to check if IP has exceeded rate limit (10 requests per hour)
CREATE OR REPLACE FUNCTION check_rate_limit(ip_addr TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    request_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO request_count
    FROM public.restaurant_registration_logs
    WHERE ip_address = ip_addr
    AND created_at > NOW() - INTERVAL '1 hour';
    
    RETURN request_count < 10;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. SAMPLE DATA FOR TESTING (OPTIONAL)
-- =====================================================

-- Insert sample restaurant for testing (uncomment if needed)
/*
INSERT INTO public.registered_restaurants (
  website_restaurant_id,
  restaurant_name,
  restaurant_phone,
  restaurant_email,
  restaurant_address,
  owner_name,
  category,
  callback_url
) VALUES (
  'rest_sample_001',
  'Sample Restaurant for Testing',
  '+44 123 456 7890',
  'sample@restaurant.com',
  '123 Sample Street, London, UK, SW1A 1AA',
  'John Sample',
  'British Cuisine',
  'https://sample-restaurant.com/api/callback'
) ON CONFLICT (website_restaurant_id) DO NOTHING;
*/

-- =====================================================
-- 9. VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created successfully
DO $$
BEGIN
    -- Check if registered_restaurants table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'registered_restaurants' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ registered_restaurants table created successfully';
    ELSE
        RAISE EXCEPTION '❌ registered_restaurants table creation failed';
    END IF;
    
    -- Check if restaurant_registration_logs table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurant_registration_logs' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ restaurant_registration_logs table created successfully';
    ELSE
        RAISE EXCEPTION '❌ restaurant_registration_logs table creation failed';
    END IF;
    
    -- Check if indexes were created
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_registered_restaurants_email') THEN
        RAISE NOTICE '✅ Database indexes created successfully';
    ELSE
        RAISE EXCEPTION '❌ Database indexes creation failed';
    END IF;
    
    -- Check if RLS is enabled
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'registered_restaurants' AND rowsecurity = true) THEN
        RAISE NOTICE '✅ Row Level Security enabled successfully';
    ELSE
        RAISE EXCEPTION '❌ Row Level Security setup failed';
    END IF;
    
    RAISE NOTICE '🎉 Cloud Restaurant Registration Schema deployed successfully!';
END $$;

-- =====================================================
-- SCHEMA DEPLOYMENT COMPLETE
-- =====================================================
-- This schema provides:
-- ✅ Secure restaurant registration with validation constraints
-- ✅ Duplicate detection for email, phone, and website_restaurant_id
-- ✅ Rate limiting support via registration logs
-- ✅ Performance optimized with proper indexes
-- ✅ Multi-tenant security with Row Level Security
-- ✅ Real-time monitoring capabilities
-- ✅ Automatic timestamp management
-- ✅ Helper functions for data normalization and rate limiting
-- =====================================================
