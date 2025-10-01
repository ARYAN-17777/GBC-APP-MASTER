-- Force refresh schema cache by reloading PostgREST
-- This should be run in Supabase SQL Editor

-- Method 1: Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Method 2: Check if the table exists and has the right columns
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'orders'
ORDER BY ordinal_position;

-- Method 3: Test direct insert to verify schema
INSERT INTO public.orders (
  userId, 
  orderNumber, 
  amount, 
  status, 
  items, 
  user, 
  restaurant, 
  paymentMethod, 
  currency
) VALUES (
  '36730b7c-18dc-40f4-8ced-ce9887032fb3'::UUID,
  'DIRECT-TEST-001',
  29.99,
  'pending',
  '[{"title": "Direct Test Item", "quantity": 1, "price": 29.99}]'::JSONB,
  '{"customer_name": "Direct Test Customer", "customer_phone": "1234567890"}'::JSONB,
  '{"name": "GBC Restaurant"}'::JSONB,
  'app_order',
  'INR'
) ON CONFLICT (orderNumber) DO UPDATE SET
  amount = EXCLUDED.amount,
  updatedAt = NOW();

-- Verify the insert worked
SELECT * FROM public.orders WHERE orderNumber = 'DIRECT-TEST-001';
