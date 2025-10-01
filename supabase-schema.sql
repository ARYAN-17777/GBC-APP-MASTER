-- Supabase Database Schema for GBC App
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  firstName TEXT,
  lastName TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  orderNumber TEXT NOT NULL,
  stripeId TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  items JSONB NOT NULL DEFAULT '[]',
  user JSONB NOT NULL DEFAULT '{}',
  restaurant JSONB NOT NULL DEFAULT '{}',
  time TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Orders RLS Policies
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = userId);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = userId);

CREATE POLICY "Users can delete own orders" ON public.orders
  FOR DELETE USING (auth.uid() = userId);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_orders_userId ON public.orders(userId);
CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON public.orders(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_orderNumber ON public.orders(orderNumber);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample data (optional)
-- Note: This will only work if you have users in auth.users table
/*
INSERT INTO public.profiles (id, username, firstName, lastName, phone, address)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'demo', 'Demo', 'User', '+44 123 456 7890', '123 Demo Street, London, UK')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.orders (userId, orderNumber, amount, status, items, user, restaurant)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'GBC-001',
    25.50,
    'completed',
    '[{"title": "Chicken Curry", "quantity": 1, "price": 15.50}, {"title": "Rice", "quantity": 1, "price": 10.00}]',
    '{"name": "Demo User", "phone": "+44 123 456 7890", "email": "demo@gbc.com"}',
    '{"name": "Bilimoria''s Canteen"}'
  )
ON CONFLICT DO NOTHING;
*/
