-- Add missing columns to existing orders table
-- This is a safer approach that doesn't drop existing data

-- First, let's see what columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'amount' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN amount DECIMAL(10,2);
        UPDATE public.orders SET amount = 0 WHERE amount IS NULL;
        ALTER TABLE public.orders ALTER COLUMN amount SET NOT NULL;
    END IF;

    -- Add paymentMethod column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'paymentMethod' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN paymentMethod TEXT DEFAULT 'app_order';
    END IF;

    -- Add currency column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'currency' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN currency TEXT DEFAULT 'INR';
    END IF;

    -- Add notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'notes' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN notes TEXT;
    END IF;

    -- Add time column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'time' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN time TEXT;
    END IF;
END $$;

-- Verify the updated schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;
