-- =====================================================
-- SIMPLE AUTHENTICATION SCHEMA UPDATE
-- =====================================================
-- Add username and password authentication to registered_restaurants table
-- Run this in Supabase SQL Editor

-- Add username column
ALTER TABLE public.registered_restaurants
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add password hash column
ALTER TABLE public.registered_restaurants
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add authentication metadata columns
ALTER TABLE public.registered_restaurants
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;

ALTER TABLE public.registered_restaurants
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMPTZ;

ALTER TABLE public.registered_restaurants
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Add constraints for username validation
ALTER TABLE public.registered_restaurants
ADD CONSTRAINT username_length_check 
CHECK (username IS NULL OR (length(username) >= 3 AND length(username) <= 50));

ALTER TABLE public.registered_restaurants
ADD CONSTRAINT username_format_check 
CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_]+$');

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_registered_restaurants_username_auth 
ON public.registered_restaurants(username) 
WHERE username IS NOT NULL;

-- Create authentication logs table
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

-- Enable RLS on authentication logs
ALTER TABLE public.restaurant_authentication_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access for Edge Functions
CREATE POLICY IF NOT EXISTS "Allow service role full access on auth_logs" 
ON public.restaurant_authentication_logs
FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for authentication logs
CREATE INDEX IF NOT EXISTS idx_auth_logs_restaurant_uid_auth 
ON public.restaurant_authentication_logs(restaurant_uid);

CREATE INDEX IF NOT EXISTS idx_auth_logs_username_auth 
ON public.restaurant_authentication_logs(username);

-- Enable Realtime for authentication logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_authentication_logs;

-- Verification query
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'registered_restaurants' 
  AND table_schema = 'public'
  AND column_name IN ('username', 'password_hash', 'failed_login_attempts', 'account_locked_until', 'last_login_at')
ORDER BY column_name;
