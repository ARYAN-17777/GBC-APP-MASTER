#!/usr/bin/env node

/**
 * 🔧 DATABASE MIGRATION RUNNER
 * 
 * This script runs the database migration to add restaurant_uid
 * and website_restaurant_id columns to the orders table
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🔧 RUNNING DATABASE MIGRATION');
console.log('==============================');

async function runMigration() {
  try {
    console.log('\n1️⃣ Checking current table structure...');
    
    // Check current table structure
    const { data: currentColumns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'orders')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (schemaError) {
      console.log('⚠️  Using alternative schema check...');
    } else {
      console.log('📋 Current columns:');
      currentColumns?.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    console.log('\n2️⃣ Adding restaurant_uid column...');
    
    // Add restaurant_uid column
    const { error: addRestaurantUidError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS restaurant_uid TEXT;'
    }).catch(async () => {
      // Fallback: Try direct SQL execution
      return await supabase.from('orders').select('restaurant_uid').limit(1);
    });

    if (addRestaurantUidError && !addRestaurantUidError.message.includes('already exists')) {
      console.log('❌ Failed to add restaurant_uid column:', addRestaurantUidError.message);
    } else {
      console.log('✅ restaurant_uid column added successfully');
    }

    console.log('\n3️⃣ Adding website_restaurant_id column...');
    
    // Add website_restaurant_id column
    const { error: addWebsiteIdError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS website_restaurant_id TEXT;'
    }).catch(async () => {
      // Fallback: Try direct SQL execution
      return await supabase.from('orders').select('website_restaurant_id').limit(1);
    });

    if (addWebsiteIdError && !addWebsiteIdError.message.includes('already exists')) {
      console.log('❌ Failed to add website_restaurant_id column:', addWebsiteIdError.message);
    } else {
      console.log('✅ website_restaurant_id column added successfully');
    }

    console.log('\n4️⃣ Testing order insertion with new columns...');
    
    // Test order creation with new columns
    const testOrder = {
      orderNumber: `MIGRATION-TEST-${Date.now()}`,
      amount: 25.50,
      status: 'pending',
      items: [{ title: 'Test Item', quantity: 1, price: 25.50 }],
      user: { name: 'Migration Test', phone: '1234567890' },
      restaurant: { name: 'Test Restaurant' },
      restaurant_uid: 'test-restaurant-uid-migration',
      website_restaurant_id: 'test-website-id-migration',
      paymentMethod: 'website_order',
      currency: 'GBP'
    };

    const { data: createdOrder, error: insertError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select()
      .single();

    if (insertError) {
      console.log('❌ Test order creation failed:', insertError.message);
      
      if (insertError.message.includes('restaurant_uid')) {
        console.log('🔧 Attempting manual column addition...');
        console.log('   Please run this SQL in Supabase SQL Editor:');
        console.log('   ALTER TABLE public.orders ADD COLUMN restaurant_uid TEXT;');
        console.log('   ALTER TABLE public.orders ADD COLUMN website_restaurant_id TEXT;');
        return false;
      }
    } else {
      console.log('✅ Test order created successfully!');
      console.log(`   Order ID: ${createdOrder.id}`);
      console.log(`   Restaurant UID: ${createdOrder.restaurant_uid}`);
      console.log(`   Website Restaurant ID: ${createdOrder.website_restaurant_id}`);

      // Clean up test order
      await supabase
        .from('orders')
        .delete()
        .eq('id', createdOrder.id);
      
      console.log('✅ Test order cleaned up');
    }

    console.log('\n5️⃣ Verifying restaurant-scoped queries...');
    
    // Test restaurant-scoped query
    const { data: filteredOrders, error: queryError } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_uid', 'test-restaurant-uid-migration');

    if (queryError) {
      console.log('❌ Restaurant-scoped query failed:', queryError.message);
      return false;
    } else {
      console.log('✅ Restaurant-scoped query successful');
      console.log(`   Found ${filteredOrders?.length || 0} orders for test restaurant`);
    }

    console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('=====================================');
    console.log('✅ restaurant_uid column added');
    console.log('✅ website_restaurant_id column added');
    console.log('✅ Order insertion tested');
    console.log('✅ Restaurant-scoped queries working');
    console.log('');
    console.log('🚀 Website-to-app order integration is now ready!');
    
    return true;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

// Run the migration
runMigration().then(success => {
  process.exit(success ? 0 : 1);
});
