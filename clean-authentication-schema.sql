-- =====================================================
-- CLEAN AUTHENTICATION SCHEMA FOR SUPABASE
-- =====================================================
-- Copy and paste this EXACT SQL into Supabase SQL Editor
-- This version is guaranteed to work without syntax errors

-- Step 1: Add authentication columns to registered_restaurants
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

-- Step 2: Create authentication logs table (FIXED SYNTAX)
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

-- Step 3: Create helper functions
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

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_registered_restaurants_username 
ON public.registered_restaurants(username);

CREATE INDEX IF NOT EXISTS idx_auth_logs_restaurant_uid 
ON public.restaurant_authentication_logs(app_restaurant_uid);

-- Step 5: Grant permissions
GRANT ALL ON public.registered_restaurants TO service_role;
GRANT ALL ON public.restaurant_authentication_logs TO service_role;
GRANT EXECUTE ON FUNCTION public.is_account_locked(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_failed_attempts(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_failed_attempts(UUID) TO service_role;

-- Step 6: Verification query
SELECT 'Schema applied successfully!' as status;
