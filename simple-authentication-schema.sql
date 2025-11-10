-- =====================================================
-- SIMPLE RESTAURANT AUTHENTICATION SCHEMA
-- =====================================================
-- This is a simplified, error-free version that adds authentication
-- to the existing registered_restaurants table

-- Step 1: Add authentication columns to registered_restaurants table
ALTER TABLE public.registered_restaurants 
ADD COLUMN IF NOT EXISTS username VARCHAR(50);

ALTER TABLE public.registered_restaurants 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(64);

ALTER TABLE public.registered_restaurants 
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;

ALTER TABLE public.registered_restaurants 
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMPTZ;

ALTER TABLE public.registered_restaurants 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

ALTER TABLE public.registered_restaurants 
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- Step 2: Create authentication logs table
CREATE TABLE IF NOT EXISTS public.restaurant_authentication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_restaurant_uid UUID,
    username VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    login_attempt_time TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create helper functions for authentication
CREATE OR REPLACE FUNCTION public.is_account_locked(restaurant_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.registered_restaurants 
        WHERE app_restaurant_uid = restaurant_uid 
        AND account_locked_until IS NOT NULL 
        AND account_locked_until > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.lock_account_if_needed(restaurant_uid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.registered_restaurants 
    SET account_locked_until = NOW() + INTERVAL '15 minutes'
    WHERE app_restaurant_uid = restaurant_uid 
    AND failed_login_attempts >= 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.reset_failed_attempts(restaurant_uid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.registered_restaurants 
    SET failed_login_attempts = 0,
        account_locked_until = NULL,
        last_login_at = NOW()
    WHERE app_restaurant_uid = restaurant_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_failed_attempts(restaurant_uid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.registered_restaurants 
    SET failed_login_attempts = failed_login_attempts + 1
    WHERE app_restaurant_uid = restaurant_uid;
    
    PERFORM public.lock_account_if_needed(restaurant_uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_registered_restaurants_username 
ON public.registered_restaurants(username);

CREATE INDEX IF NOT EXISTS idx_auth_logs_restaurant_uid 
ON public.restaurant_authentication_logs(app_restaurant_uid);

CREATE INDEX IF NOT EXISTS idx_auth_logs_timestamp 
ON public.restaurant_authentication_logs(login_attempt_time);

-- Step 5: Enable Row Level Security
ALTER TABLE public.restaurant_authentication_logs ENABLE ROW LEVEL SECURITY;

-- Step 6: Grant permissions
GRANT ALL ON public.registered_restaurants TO service_role;
GRANT ALL ON public.restaurant_authentication_logs TO service_role;
GRANT EXECUTE ON FUNCTION public.is_account_locked(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.lock_account_if_needed(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_failed_attempts(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_failed_attempts(UUID) TO service_role;

-- =====================================================
-- VERIFICATION QUERIES (Run these after applying schema)
-- =====================================================

-- Check if authentication columns exist
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'registered_restaurants' 
-- AND column_name IN ('username', 'password_hash', 'failed_login_attempts');

-- Check if authentication logs table exists
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name = 'restaurant_authentication_logs';

-- Check if helper functions exist
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_name IN ('is_account_locked', 'reset_failed_attempts');

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
-- This schema provides:
-- ✅ Username/password authentication columns
-- ✅ Account lockout protection (5 attempts = 15 min)
-- ✅ Authentication audit logging
-- ✅ Helper functions for account management
-- ✅ Performance indexes
-- ✅ Proper permissions for Edge Functions
