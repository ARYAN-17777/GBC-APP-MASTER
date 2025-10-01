-- Corrected SQL for creating orders table
-- Clear the editor and paste this entire script

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.orders CASCADE;

-- Create orders table with correct syntax
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" UUID,
  "orderNumber" TEXT NOT NULL UNIQUE,
  "stripeId" TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  items JSONB NOT NULL DEFAULT '[]',
  "user" JSONB NOT NULL DEFAULT '{}',
  restaurant JSONB NOT NULL DEFAULT '{}',
  time TEXT,
  notes TEXT,
  "paymentMethod" TEXT DEFAULT 'app_order',
  currency TEXT DEFAULT 'INR',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (allows all operations)
CREATE POLICY "Service role can do everything" ON public.orders
  FOR ALL USING (true) WITH CHECK (true);

-- Create policy for authenticated users to see their own orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid()::text = "userId"::text);

-- Create policy for authenticated users to insert their own orders
CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

-- Create indexes for performance
CREATE INDEX idx_orders_userId ON public.orders("userId");
CREATE INDEX idx_orders_createdAt ON public.orders("createdAt" DESC);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_orderNumber ON public.orders("orderNumber");

-- Insert a test record to verify everything works
INSERT INTO public.orders (
  "userId", 
  "orderNumber", 
  amount, 
  status, 
  items, 
  "user", 
  restaurant, 
  "paymentMethod", 
  currency
) VALUES (
  '36730b7c-18dc-40f4-8ced-ce9887032fb3',
  'SCHEMA-TEST-FINAL',
  25.99,
  'pending',
  '[{"title": "Test Item", "quantity": 1, "price": 25.99}]'::JSONB,
  '{"customer_name": "Schema Test User", "customer_phone": "1234567890"}'::JSONB,
  '{"name": "GBC Restaurant"}'::JSONB,
  'app_order',
  'INR'
) ON CONFLICT ("orderNumber") DO UPDATE SET
  amount = EXCLUDED.amount,
  "updatedAt" = NOW();

-- Verify the table was created correctly
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test that we can query the table
SELECT * FROM public.orders WHERE "orderNumber" = 'SCHEMA-TEST-FINAL';
