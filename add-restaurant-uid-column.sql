-- =====================================================
-- ADD RESTAURANT_UID COLUMN TO ORDERS TABLE
-- =====================================================
-- This migration adds the critical restaurant_uid column
-- that is required for restaurant-scoped order filtering
-- =====================================================

-- Add restaurant_uid column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS restaurant_uid TEXT;

-- Add website_restaurant_id column for integration metadata
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS website_restaurant_id TEXT;

-- Create index for restaurant_uid for performance
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_uid ON public.orders(restaurant_uid);

-- Create index for website_restaurant_id for integration queries
CREATE INDEX IF NOT EXISTS idx_orders_website_restaurant_id ON public.orders(website_restaurant_id);

-- Update RLS policies to include restaurant_uid filtering
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON public.orders;

-- Create new RLS policies that support both userId and restaurant_uid filtering
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = userId OR 
    restaurant_uid IS NOT NULL
  );

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (
    auth.uid() = userId OR 
    restaurant_uid IS NOT NULL
  );

CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE USING (
    auth.uid() = userId OR 
    restaurant_uid IS NOT NULL
  );

CREATE POLICY "Users can delete own orders" ON public.orders
  FOR DELETE USING (
    auth.uid() = userId OR 
    restaurant_uid IS NOT NULL
  );

-- Add comment to document the new columns
COMMENT ON COLUMN public.orders.restaurant_uid IS 'Restaurant UID for multi-tenant order filtering - matches app_restaurant_uid from restaurant authentication';
COMMENT ON COLUMN public.orders.website_restaurant_id IS 'Website restaurant ID for integration tracking - used for website-to-app order mapping';

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
  AND column_name IN ('restaurant_uid', 'website_restaurant_id')
ORDER BY column_name;

-- Show indexes
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'orders' 
  AND schemaname = 'public'
  AND indexname LIKE '%restaurant%';

-- Migration complete message
SELECT 'Migration completed successfully! restaurant_uid and website_restaurant_id columns added to orders table.' as migration_status;
