-- Supabase RLS Debug and Enhancement Script
-- Run this in your Supabase SQL Editor to debug and enhance RLS policies

-- 1. TEMPORARY DEBUG POLICY (Remove after testing)
-- This allows all authenticated users to see all orders temporarily
-- Use this to confirm if RLS is blocking the queries
CREATE POLICY "TEMP_DEBUG_view_all_orders" ON public.orders
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 2. SERVICE ROLE POLICY for Postman inserts
-- This allows service role to insert orders for any user
CREATE POLICY "Service role can insert orders" ON public.orders
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role' OR 
    auth.uid() = userId
  );

-- 3. ENHANCED SELECT POLICY with better debugging
-- Replace the existing "Users can view own orders" policy
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = userId OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

-- 4. ENHANCED INSERT POLICY with better debugging  
-- Replace the existing "Users can insert own orders" policy
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (
    auth.uid() = userId OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

-- 5. Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_userId_createdAt ON public.orders(userId, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_userId ON public.orders(status, userId);

-- 6. Create a debug view to help troubleshoot
CREATE OR REPLACE VIEW debug_orders_with_auth AS
SELECT 
  o.*,
  auth.uid() as current_auth_uid,
  auth.jwt() ->> 'role' as current_auth_role,
  (auth.uid() = o.userId) as is_owner,
  (auth.jwt() ->> 'role' = 'service_role') as is_service_role
FROM public.orders o;

-- 7. Grant access to the debug view
GRANT SELECT ON debug_orders_with_auth TO authenticated;
GRANT SELECT ON debug_orders_with_auth TO service_role;

-- 8. Function to help debug RLS issues
CREATE OR REPLACE FUNCTION debug_user_orders(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  user_id UUID,
  current_user UUID,
  can_see BOOLEAN,
  auth_role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.orderNumber,
    o.userId,
    auth.uid(),
    (auth.uid() = o.userId OR auth.jwt() ->> 'role' = 'service_role') as can_see,
    auth.jwt() ->> 'role'
  FROM public.orders o
  WHERE target_user_id IS NULL OR o.userId = target_user_id
  ORDER BY o.createdAt DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION debug_user_orders TO authenticated;
GRANT EXECUTE ON FUNCTION debug_user_orders TO service_role;

-- 9. Test data insertion function (for debugging)
CREATE OR REPLACE FUNCTION create_test_order(
  target_user_id UUID,
  order_num TEXT DEFAULT 'TEST-' || extract(epoch from now())::text
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order_id UUID;
BEGIN
  INSERT INTO public.orders (
    userId,
    orderNumber,
    amount,
    status,
    items,
    user,
    restaurant,
    createdAt
  ) VALUES (
    target_user_id,
    order_num,
    2500,
    'pending',
    '[{"title": "Test Item", "quantity": 1, "price": 2500}]'::jsonb,
    '{"name": "Test User", "phone": "+1234567890"}'::jsonb,
    '{"name": "GBC Restaurant"}'::jsonb,
    NOW()
  ) RETURNING id INTO new_order_id;
  
  RETURN new_order_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_test_order TO authenticated;
GRANT EXECUTE ON FUNCTION create_test_order TO service_role;

-- 10. Instructions for testing
/*
TESTING INSTRUCTIONS:

1. First, remove the temporary debug policy after testing:
   DROP POLICY "TEMP_DEBUG_view_all_orders" ON public.orders;

2. To test RLS with your app user:
   SELECT * FROM debug_user_orders();

3. To create a test order for a specific user:
   SELECT create_test_order('your-user-id-here');

4. To check if orders are visible:
   SELECT * FROM debug_orders_with_auth WHERE userId = 'your-user-id';

5. For Postman testing, use these headers:
   Authorization: Bearer [service_role_key]
   apikey: [service_role_key]
   Content-Type: application/json

6. Postman payload example:
   {
     "userId": "your-exact-user-id-from-app",
     "orderNumber": "POSTMAN-001",
     "amount": 2500,
     "status": "pending",
     "items": [{"title": "Test Item", "quantity": 1, "price": 2500}],
     "user": {"name": "Test User", "phone": "+1234567890"},
     "restaurant": {"name": "GBC Restaurant"}
   }
*/
