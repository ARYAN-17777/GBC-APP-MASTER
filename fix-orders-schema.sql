-- Fix Orders Schema for Real Database Persistence
-- This script ensures the orders table matches the Edge Function expectations

-- Drop existing orders table if it exists (be careful in production!)
DROP TABLE IF EXISTS public.orders CASCADE;

-- Create orders table with correct schema matching Edge Function payload
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  orderNumber TEXT NOT NULL UNIQUE,
  stripeId TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  items JSONB NOT NULL DEFAULT '[]',
  user JSONB NOT NULL DEFAULT '{}',
  restaurant JSONB NOT NULL DEFAULT '{}',
  time TEXT,
  notes TEXT,
  paymentMethod TEXT DEFAULT 'app_order',
  currency TEXT DEFAULT 'INR',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table for detailed item tracking (optional but useful)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders - users can only see their own orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = userId);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = userId);

-- RLS Policies for order_items
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.userId = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.userId = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_userId ON public.orders(userId);
CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON public.orders(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_orderNumber ON public.orders(orderNumber);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER handle_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert a test order to verify schema works
INSERT INTO public.orders (
  userId, orderNumber, amount, status, items, user, restaurant, paymentMethod, currency
) VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'SCHEMA-TEST-001',
  25.99,
  'pending',
  '[{"title": "Test Item", "quantity": 1, "price": 25.99}]'::JSONB,
  '{"name": "Schema Test User", "phone": "1234567890"}'::JSONB,
  '{"name": "GBC Restaurant"}'::JSONB,
  'app_order',
  'INR'
) ON CONFLICT (orderNumber) DO NOTHING;

-- Verify the schema
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
