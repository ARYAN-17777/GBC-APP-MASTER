-- =====================================================
-- FIX RESTAURANT REGISTRATIONS TABLE
-- =====================================================
-- This script creates the missing restaurant_registrations table
-- and populates it with data from registered_restaurants table
-- to ensure compatibility with the handshake system.

-- =====================================================
-- 1. CREATE RESTAURANT_REGISTRATIONS TABLE
-- =====================================================

-- Create restaurant_registrations table (if not exists)
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
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_restaurant_registrations_user_id ON public.restaurant_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_registrations_restaurant_uid ON public.restaurant_registrations(restaurant_uid);
CREATE INDEX IF NOT EXISTS idx_restaurant_registrations_online ON public.restaurant_registrations(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_restaurant_registrations_last_seen ON public.restaurant_registrations(last_seen);

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on restaurant registrations
ALTER TABLE public.restaurant_registrations ENABLE ROW LEVEL SECURITY;

-- Allow service role full access for Edge Functions
CREATE POLICY IF NOT EXISTS "Allow service role full access on restaurant_registrations" ON public.restaurant_registrations
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read their own registrations
CREATE POLICY IF NOT EXISTS "Users can read own registrations" ON public.restaurant_registrations
  FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to update their own registrations
CREATE POLICY IF NOT EXISTS "Users can update own registrations" ON public.restaurant_registrations
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 4. REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable Realtime for restaurant registrations
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_registrations;

-- =====================================================
-- 5. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_restaurant_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on restaurant_registrations
DROP TRIGGER IF EXISTS update_restaurant_registrations_updated_at ON public.restaurant_registrations;
CREATE TRIGGER update_restaurant_registrations_updated_at
    BEFORE UPDATE ON public.restaurant_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_restaurant_registrations_updated_at();

-- =====================================================
-- 6. POPULATE WITH EXISTING DATA
-- =====================================================

-- Insert data from registered_restaurants into restaurant_registrations
-- This creates a bridge between manually added restaurants and the handshake system
INSERT INTO public.restaurant_registrations (
  user_id,
  restaurant_uid,
  device_label,
  app_version,
  platform,
  capabilities,
  device_info,
  network_info,
  last_seen,
  is_online,
  created_at,
  updated_at
)
SELECT 
  rr.id as user_id, -- Use the restaurant's ID as user_id for manually added restaurants
  rr.app_restaurant_uid as restaurant_uid,
  COALESCE(rr.restaurant_name, 'Manual Registration') as device_label,
  '3.0.0' as app_version, -- Default app version
  'manual' as platform, -- Indicate this was manually added
  '["order_receive", "status_update", "print_receipt"]'::jsonb as capabilities,
  jsonb_build_object(
    'restaurant_name', rr.restaurant_name,
    'restaurant_phone', rr.restaurant_phone,
    'restaurant_email', rr.restaurant_email,
    'registration_type', 'manual'
  ) as device_info,
  jsonb_build_object(
    'source', 'manual_registration',
    'callback_url', rr.callback_url
  ) as network_info,
  rr.created_at as last_seen,
  rr.is_active as is_online,
  rr.created_at,
  rr.updated_at
FROM public.registered_restaurants rr
WHERE rr.is_active = true
  AND NOT EXISTS (
    -- Only insert if not already exists
    SELECT 1 FROM public.restaurant_registrations reg 
    WHERE reg.restaurant_uid = rr.app_restaurant_uid
  );

-- =====================================================
-- 7. VERIFICATION
-- =====================================================

-- Verify the table was created and populated successfully
DO $$
DECLARE
    table_count INTEGER;
    registration_count INTEGER;
    restaurant_count INTEGER;
BEGIN
    -- Check if table exists
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name = 'restaurant_registrations' AND table_schema = 'public';
    
    IF table_count = 0 THEN
        RAISE EXCEPTION '❌ restaurant_registrations table was not created';
    END IF;
    
    -- Count registrations
    SELECT COUNT(*) INTO registration_count FROM public.restaurant_registrations;
    
    -- Count active restaurants
    SELECT COUNT(*) INTO restaurant_count FROM public.registered_restaurants WHERE is_active = true;
    
    RAISE NOTICE '✅ restaurant_registrations table created successfully';
    RAISE NOTICE '📊 Populated with % registrations from % restaurants', registration_count, restaurant_count;
    
    IF registration_count = restaurant_count THEN
        RAISE NOTICE '🎉 Perfect! All restaurants have corresponding registrations';
    ELSE
        RAISE NOTICE '⚠️  Registration count (%) does not match restaurant count (%)', registration_count, restaurant_count;
    END IF;
    
    RAISE NOTICE '🎯 restaurant_registrations table is now ready for handshake system!';
END $$;

-- =====================================================
-- SCHEMA FIX COMPLETE
-- =====================================================
-- This script provides:
-- ✅ Creates missing restaurant_registrations table
-- ✅ Proper indexes for performance
-- ✅ Row Level Security policies
-- ✅ Realtime subscriptions
-- ✅ Automatic timestamp updates
-- ✅ Populates with existing restaurant data
-- ✅ Maintains compatibility with handshake system
-- ✅ Verification of successful deployment
-- =====================================================
