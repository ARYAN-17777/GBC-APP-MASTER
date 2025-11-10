-- =====================================================
-- ADD AUTHENTICATION TO RESTAURANT REGISTRATION SYSTEM
-- =====================================================
-- This script adds username and password authentication to the existing
-- cloud-based restaurant registration system

-- =====================================================
-- 1. ADD AUTHENTICATION COLUMNS TO REGISTERED RESTAURANTS
-- =====================================================

-- Add username column with validation
ALTER TABLE public.registered_restaurants
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE CHECK (
  length(username) >= 3 AND 
  length(username) <= 50 AND 
  username ~ '^[a-zA-Z0-9_]+$'
);

-- Add password hash column (never store plain text passwords)
ALTER TABLE public.registered_restaurants
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add authentication-related metadata
ALTER TABLE public.registered_restaurants
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- 2. CREATE INDEXES FOR AUTHENTICATION PERFORMANCE
-- =====================================================

-- Index for username lookups (login performance)
CREATE INDEX IF NOT EXISTS idx_registered_restaurants_username 
ON public.registered_restaurants(username) 
WHERE username IS NOT NULL;

-- Index for account lockout queries
CREATE INDEX IF NOT EXISTS idx_registered_restaurants_lockout 
ON public.registered_restaurants(account_locked_until) 
WHERE account_locked_until IS NOT NULL;

-- Index for failed login attempts
CREATE INDEX IF NOT EXISTS idx_registered_restaurants_failed_attempts 
ON public.registered_restaurants(failed_login_attempts) 
WHERE failed_login_attempts > 0;

-- =====================================================
-- 3. CREATE AUTHENTICATION LOGS TABLE
-- =====================================================

-- Table to track all authentication attempts for security monitoring
CREATE TABLE IF NOT EXISTS public.restaurant_authentication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_uid UUID REFERENCES public.registered_restaurants(app_restaurant_uid),
  username TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('login_success', 'login_failed', 'account_locked', 'password_reset')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for authentication logs
CREATE INDEX IF NOT EXISTS idx_auth_logs_restaurant_uid 
ON public.restaurant_authentication_logs(restaurant_uid);

CREATE INDEX IF NOT EXISTS idx_auth_logs_username 
ON public.restaurant_authentication_logs(username);

CREATE INDEX IF NOT EXISTS idx_auth_logs_ip_created 
ON public.restaurant_authentication_logs(ip_address, created_at);

CREATE INDEX IF NOT EXISTS idx_auth_logs_attempt_type 
ON public.restaurant_authentication_logs(attempt_type);

-- =====================================================
-- 4. UPDATE RLS POLICIES FOR AUTHENTICATION
-- =====================================================

-- Enable RLS on authentication logs
ALTER TABLE public.restaurant_authentication_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access for Edge Functions
-- Drop policy if it exists, then create it
DROP POLICY IF EXISTS "Allow service role full access on auth_logs" ON public.restaurant_authentication_logs;
CREATE POLICY "Allow service role full access on auth_logs"
ON public.restaurant_authentication_logs
FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 5. CREATE AUTHENTICATION HELPER FUNCTIONS
-- =====================================================

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(restaurant_uid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    locked_until TIMESTAMPTZ;
BEGIN
    SELECT account_locked_until INTO locked_until
    FROM public.registered_restaurants
    WHERE app_restaurant_uid = restaurant_uid;
    
    -- Account is locked if locked_until is in the future
    RETURN (locked_until IS NOT NULL AND locked_until > NOW());
END;
$$ LANGUAGE plpgsql;

-- Function to lock account after failed attempts
CREATE OR REPLACE FUNCTION lock_account_if_needed(restaurant_uid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    failed_attempts INTEGER;
    max_attempts INTEGER := 5;
    lockout_duration INTERVAL := '15 minutes';
BEGIN
    -- Get current failed attempts
    SELECT failed_login_attempts INTO failed_attempts
    FROM public.registered_restaurants
    WHERE app_restaurant_uid = restaurant_uid;
    
    -- Lock account if max attempts reached
    IF failed_attempts >= max_attempts THEN
        UPDATE public.registered_restaurants
        SET account_locked_until = NOW() + lockout_duration
        WHERE app_restaurant_uid = restaurant_uid;
        
        RETURN TRUE; -- Account was locked
    END IF;
    
    RETURN FALSE; -- Account not locked
END;
$$ LANGUAGE plpgsql;

-- Function to reset failed login attempts on successful login
CREATE OR REPLACE FUNCTION reset_failed_attempts(restaurant_uid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.registered_restaurants
    SET 
        failed_login_attempts = 0,
        account_locked_until = NULL,
        last_login_at = NOW()
    WHERE app_restaurant_uid = restaurant_uid;
END;
$$ LANGUAGE plpgsql;

-- Function to increment failed login attempts
CREATE OR REPLACE FUNCTION increment_failed_attempts(restaurant_uid UUID)
RETURNS INTEGER AS $$
DECLARE
    new_attempts INTEGER;
BEGIN
    UPDATE public.registered_restaurants
    SET failed_login_attempts = failed_login_attempts + 1
    WHERE app_restaurant_uid = restaurant_uid
    RETURNING failed_login_attempts INTO new_attempts;
    
    RETURN new_attempts;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. UPDATE REGISTRATION LOGS TO INCLUDE AUTH STATUS
-- =====================================================

-- Add authentication status to registration logs
ALTER TABLE public.restaurant_registration_logs
ADD COLUMN IF NOT EXISTS includes_auth BOOLEAN DEFAULT FALSE;

-- =====================================================
-- 7. REALTIME SUBSCRIPTIONS FOR AUTHENTICATION
-- =====================================================

-- Enable Realtime for authentication logs (for monitoring)
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_authentication_logs;

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================

-- Verify authentication columns were added successfully
DO $$
BEGIN
    -- Check if username column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registered_restaurants' 
        AND column_name = 'username' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ username column added successfully';
    ELSE
        RAISE EXCEPTION '❌ username column creation failed';
    END IF;
    
    -- Check if password_hash column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registered_restaurants' 
        AND column_name = 'password_hash' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ password_hash column added successfully';
    ELSE
        RAISE EXCEPTION '❌ password_hash column creation failed';
    END IF;
    
    -- Check if authentication logs table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'restaurant_authentication_logs' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ restaurant_authentication_logs table created successfully';
    ELSE
        RAISE EXCEPTION '❌ restaurant_authentication_logs table creation failed';
    END IF;
    
    -- Check if authentication functions exist
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'is_account_locked' 
        AND routine_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Authentication helper functions created successfully';
    ELSE
        RAISE EXCEPTION '❌ Authentication helper functions creation failed';
    END IF;
    
    RAISE NOTICE '🎉 Authentication schema enhancement completed successfully!';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '   1. Update Edge Function to handle username/password validation';
    RAISE NOTICE '   2. Update mobile app authentication service';
    RAISE NOTICE '   3. Test registration and login flows';
END $$;

-- =====================================================
-- AUTHENTICATION SCHEMA ENHANCEMENT COMPLETE
-- =====================================================
-- This schema enhancement provides:
-- ✅ Username and password authentication for restaurants
-- ✅ Secure password hashing (implementation in Edge Function)
-- ✅ Account lockout protection (5 failed attempts = 15 min lockout)
-- ✅ Comprehensive authentication logging for security monitoring
-- ✅ Performance optimized with proper indexes
-- ✅ Helper functions for authentication logic
-- ✅ Backward compatibility with existing registrations
-- =====================================================
