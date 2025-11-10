-- Add New Payload Format Columns to Orders Table
-- Run this in your Supabase SQL Editor to support the new payload format

-- Add columns for new payload format support
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS totals JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS amountDisplay TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS paymentMethod TEXT DEFAULT 'app_order',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GBP',
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the existing updatedAt column name to match camelCase if it exists
-- (This handles both camelCase and snake_case naming)
DO $$ 
BEGIN
    -- Check if updatedAt column exists and rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' 
               AND column_name = 'updatedAt' 
               AND table_schema = 'public') THEN
        ALTER TABLE public.orders RENAME COLUMN "updatedAt" TO updated_at;
    END IF;
    
    -- Check if createdAt column exists and rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' 
               AND column_name = 'createdAt' 
               AND table_schema = 'public') THEN
        ALTER TABLE public.orders RENAME COLUMN "createdAt" TO created_at;
    END IF;
END $$;

-- Ensure created_at column exists
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS handle_orders_updated_at ON public.orders;
CREATE TRIGGER handle_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_orders_totals ON public.orders USING GIN (totals);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(paymentMethod);
CREATE INDEX IF NOT EXISTS idx_orders_currency ON public.orders(currency);
CREATE INDEX IF NOT EXISTS idx_orders_dispatched_at ON public.orders(dispatched_at);

-- Add a comment to document the new payload format
COMMENT ON COLUMN public.orders.totals IS 'JSONB object containing subtotal, discount, delivery, vat, total for new payload format';
COMMENT ON COLUMN public.orders.amountDisplay IS 'Formatted amount string with currency symbol (e.g., "£25.50") for new payload format';
COMMENT ON COLUMN public.orders.paymentMethod IS 'Payment method: app_order, website_order, etc.';
COMMENT ON COLUMN public.orders.currency IS 'Currency code: GBP, USD, EUR, etc.';

-- Verify the schema changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;
