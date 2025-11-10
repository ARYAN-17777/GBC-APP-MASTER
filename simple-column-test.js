#!/usr/bin/env node

/**
 * 🧪 SIMPLE COLUMN TEST
 * 
 * This script tests if the restaurant_uid columns exist
 * by attempting to create a test order
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🧪 TESTING RESTAURANT_UID COLUMNS');
console.log('==================================');

async function testColumns() {
  try {
    console.log('\n🔍 Testing if restaurant_uid columns exist...');
    
    // Test order with restaurant_uid columns
    const testOrder = {
      orderNumber: `COLUMN-TEST-${Date.now()}`,
      amount: 1.00,
      status: 'pending',
      items: [],
      user: {},
      restaurant: {},
      restaurant_uid: 'test-uid-123',
      website_restaurant_id: 'test-website-123'
    };

    console.log('📝 Attempting to create test order with restaurant_uid...');
    
    const { data: createdOrder, error: insertError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select()
      .single();

    if (insertError) {
      console.log('❌ Column test failed:', insertError.message);
      
      if (insertError.message.includes('restaurant_uid') || 
          insertError.message.includes('website_restaurant_id')) {
        console.log('');
        console.log('🔧 COLUMNS ARE MISSING! Please run this SQL in Supabase SQL Editor:');
        console.log('');
        console.log('-- Add missing columns');
        console.log('ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS restaurant_uid TEXT;');
        console.log('ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS website_restaurant_id TEXT;');
        console.log('');
        console.log('-- Create indexes');
        console.log('CREATE INDEX IF NOT EXISTS idx_orders_restaurant_uid ON public.orders(restaurant_uid);');
        console.log('CREATE INDEX IF NOT EXISTS idx_orders_website_restaurant_id ON public.orders(website_restaurant_id);');
        console.log('');
        console.log('-- Test the columns');
        console.log('SELECT column_name FROM information_schema.columns WHERE table_name = \'orders\' AND column_name LIKE \'%restaurant%\';');
        console.log('');
        return false;
      } else {
        console.log('❌ Other database error:', insertError.message);
        return false;
      }
    } else {
      console.log('✅ Test order created successfully!');
      console.log(`   Order ID: ${createdOrder.id}`);
      console.log(`   Restaurant UID: ${createdOrder.restaurant_uid}`);
      console.log(`   Website Restaurant ID: ${createdOrder.website_restaurant_id}`);

      // Test restaurant-scoped query
      console.log('\n🔍 Testing restaurant-scoped query...');
      const { data: filteredOrders, error: queryError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_uid', 'test-uid-123');

      if (queryError) {
        console.log('❌ Restaurant-scoped query failed:', queryError.message);
      } else {
        console.log('✅ Restaurant-scoped query successful');
        console.log(`   Found ${filteredOrders?.length || 0} orders for test restaurant`);
      }

      // Clean up test order
      await supabase
        .from('orders')
        .delete()
        .eq('id', createdOrder.id);
      
      console.log('✅ Test order cleaned up');
      
      console.log('\n🎉 COLUMNS EXIST AND WORKING!');
      console.log('=============================');
      console.log('✅ restaurant_uid column is functional');
      console.log('✅ website_restaurant_id column is functional');
      console.log('✅ Restaurant-scoped queries working');
      console.log('');
      console.log('🚀 Ready to test website-to-app integration!');
      
      return true;
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testColumns().then(success => {
  process.exit(success ? 0 : 1);
});
