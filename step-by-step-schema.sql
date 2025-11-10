-- =====================================================
-- STEP-BY-STEP AUTHENTICATION SCHEMA
-- =====================================================
-- Apply this schema one section at a time to avoid errors
-- Copy and run each section separately in Supabase SQL Editor

-- =====================================================
-- SECTION 1: ADD BASIC COLUMNS (Run this first)
-- =====================================================

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

-- =====================================================
-- SECTION 2: CREATE LOGS TABLE (Run this second)
-- =====================================================

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

-- =====================================================
-- SECTION 3: CREATE HELPER FUNCTIONS (Run this third)
-- =====================================================

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
    
    -- Lock account if 5 or more failed attempts
    IF (SELECT failed_login_attempts FROM public.registered_restaurants WHERE app_restaurant_uid = restaurant_uid) >= 5 THEN
        UPDATE public.registered_restaurants 
        SET account_locked_until = NOW() + INTERVAL '15 minutes'
        WHERE app_restaurant_uid = restaurant_uid;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 4: CREATE INDEXES (Run this fourth)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_registered_restaurants_username 
ON public.registered_restaurants(username);

CREATE INDEX IF NOT EXISTS idx_auth_logs_restaurant_uid 
ON public.restaurant_authentication_logs(app_restaurant_uid);

-- =====================================================
-- SECTION 5: GRANT PERMISSIONS (Run this last)
-- =====================================================

GRANT ALL ON public.registered_restaurants TO service_role;
GRANT ALL ON public.restaurant_authentication_logs TO service_role;
GRANT EXECUTE ON FUNCTION public.is_account_locked(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_failed_attempts(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_failed_attempts(UUID) TO service_role;

-- =====================================================
-- VERIFICATION (Run this to check if everything worked)
-- =====================================================

SELECT 'Authentication columns check:' as check_type;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'registered_restaurants' 
AND column_name IN ('username', 'password_hash', 'failed_login_attempts', 'account_locked_until', 'last_login_at', 'password_changed_at');

SELECT 'Authentication logs table check:' as check_type;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'restaurant_authentication_logs';

SELECT 'Helper functions check:' as check_type;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('is_account_locked', 'reset_failed_attempts', 'increment_failed_attempts')
AND routine_schema = 'public';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- If all verification queries return results, the schema is applied successfully!
-- You can now test the authentication system with:
-- node verify-authentication-schema.js
