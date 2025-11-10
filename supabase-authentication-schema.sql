-- =====================================================
-- SUPABASE RESTAURANT AUTHENTICATION SCHEMA
-- =====================================================
-- This file adds authentication columns and functions to the existing
-- registered_restaurants table for username/password authentication

-- 1. ADD AUTHENTICATION COLUMNS TO REGISTERED_RESTAURANTS TABLE
-- =====================================================

-- Add username column (unique identifier for restaurant login)
ALTER TABLE public.registered_restaurants
ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- Add password hash column (SHA-256 hashed password)
ALTER TABLE public.registered_restaurants
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(64);

-- Add failed login attempts counter
ALTER TABLE public.registered_restaurants
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;

-- Add account lockout timestamp
ALTER TABLE public.registered_restaurants
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMPTZ;

-- Add last successful login timestamp
ALTER TABLE public.registered_restaurants
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Add password change timestamp
ALTER TABLE public.registered_restaurants
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- Add unique constraint for username (separate from column creation)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'registered_restaurants_username_key'
        AND table_name = 'registered_restaurants'
    ) THEN
        ALTER TABLE public.registered_restaurants
        ADD CONSTRAINT registered_restaurants_username_key UNIQUE (username);
    END IF;
END $$;

-- 2. CREATE AUTHENTICATION LOGS TABLE
-- =====================================================

-- Create table for authentication audit logs
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

-- Add foreign key constraint separately (safer approach)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'restaurant_authentication_logs_app_restaurant_uid_fkey'
        AND table_name = 'restaurant_authentication_logs'
    ) THEN
        ALTER TABLE public.restaurant_authentication_logs
        ADD CONSTRAINT restaurant_authentication_logs_app_restaurant_uid_fkey
        FOREIGN KEY (app_restaurant_uid) REFERENCES public.registered_restaurants(app_restaurant_uid);
    END IF;
END $$;

-- 3. CREATE AUTHENTICATION HELPER FUNCTIONS
-- =====================================================

-- Function to check if account is locked
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

-- Function to lock account after failed attempts
CREATE OR REPLACE FUNCTION public.lock_account_if_needed(restaurant_uid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.registered_restaurants 
    SET account_locked_until = NOW() + INTERVAL '15 minutes'
    WHERE app_restaurant_uid = restaurant_uid 
    AND failed_login_attempts >= 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset failed attempts on successful login
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

-- Function to increment failed attempts
CREATE OR REPLACE FUNCTION public.increment_failed_attempts(restaurant_uid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.registered_restaurants 
    SET failed_login_attempts = failed_login_attempts + 1
    WHERE app_restaurant_uid = restaurant_uid;
    
    -- Lock account if needed
    PERFORM public.lock_account_if_needed(restaurant_uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on authentication logs
ALTER TABLE public.restaurant_authentication_logs ENABLE ROW LEVEL SECURITY;

-- 5. CREATE SECURITY POLICIES
-- =====================================================

-- Create security policies (with error handling)
DO $$
BEGIN
    -- Drop existing policies if they exist
    BEGIN
        DROP POLICY IF EXISTS "Allow service role full access on auth_logs" ON public.restaurant_authentication_logs;
    EXCEPTION WHEN OTHERS THEN
        -- Policy doesn't exist, continue
        NULL;
    END;

    BEGIN
        DROP POLICY IF EXISTS "Users can view own auth logs" ON public.restaurant_authentication_logs;
    EXCEPTION WHEN OTHERS THEN
        -- Policy doesn't exist, continue
        NULL;
    END;

    -- Create service role policy
    BEGIN
        EXECUTE 'CREATE POLICY "Allow service role full access on auth_logs"
                 ON public.restaurant_authentication_logs
                 FOR ALL
                 TO service_role
                 USING (true)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create service role policy: %', SQLERRM;
    END;

    -- Create authenticated user policy
    BEGIN
        EXECUTE 'CREATE POLICY "Users can view own auth logs"
                 ON public.restaurant_authentication_logs
                 FOR SELECT
                 TO authenticated
                 USING (app_restaurant_uid IN (
                     SELECT app_restaurant_uid FROM public.registered_restaurants
                     WHERE auth.uid()::text = app_restaurant_uid::text
                 ))';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create authenticated user policy: %', SQLERRM;
    END;
END $$;

-- 6. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index on username for fast lookups
CREATE INDEX IF NOT EXISTS idx_registered_restaurants_username 
ON public.registered_restaurants(username);

-- Index on authentication logs for performance
CREATE INDEX IF NOT EXISTS idx_auth_logs_restaurant_uid 
ON public.restaurant_authentication_logs(app_restaurant_uid);

CREATE INDEX IF NOT EXISTS idx_auth_logs_timestamp 
ON public.restaurant_authentication_logs(login_attempt_time);

-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to service role
GRANT ALL ON public.registered_restaurants TO service_role;
GRANT ALL ON public.restaurant_authentication_logs TO service_role;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.is_account_locked(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.lock_account_if_needed(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_failed_attempts(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_failed_attempts(UUID) TO service_role;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify the schema was applied correctly
-- You can run these queries after applying the schema to verify everything is working

-- Check if authentication columns exist
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'registered_restaurants' 
-- AND column_name IN ('username', 'password_hash', 'failed_login_attempts', 'account_locked_until', 'last_login_at', 'password_changed_at');

-- Check if authentication logs table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'restaurant_authentication_logs';

-- Check if helper functions exist
-- SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('is_account_locked', 'lock_account_if_needed', 'reset_failed_attempts', 'increment_failed_attempts');

-- =====================================================
-- SCHEMA APPLICATION COMPLETE
-- =====================================================

-- This schema adds complete authentication support to the GBC Kitchen App:
-- ✅ Username/password authentication for restaurants
-- ✅ Secure password hashing (SHA-256)
-- ✅ Account lockout protection (5 failed attempts = 15 min lockout)
-- ✅ Authentication audit logging
-- ✅ Helper functions for account management
-- ✅ Row Level Security policies
-- ✅ Performance indexes
-- ✅ Proper permissions for Edge Functions

-- After applying this schema, restaurants can:
-- 1. Register with username and password via the cloud-register-restaurant Edge Function
-- 2. Login with username and password via the restaurant-login Edge Function
-- 3. Have their authentication attempts logged for security monitoring
-- 4. Be protected from brute force attacks with account lockout

-- The mobile app can then use the restaurant authentication system to allow
-- restaurants to login with the same credentials they used during registration.
