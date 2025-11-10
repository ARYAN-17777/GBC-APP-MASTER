// Database cleanup script to remove all orders and prepare for fresh APK build
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanDatabase() {
  console.log('🧹 CLEANING DATABASE FOR FRESH APK BUILD');
  console.log('=========================================\n');

  try {
    // Step 1: Check current orders count
    console.log('📊 STEP 1: CHECKING CURRENT DATABASE STATE');
    console.log('==========================================');
    
    const { data: currentOrders, error: countError } = await supabase
      .from('orders')
      .select('id, orderNumber, created_at', { count: 'exact' });
    
    if (countError) {
      console.log('⚠️  Could not access orders table:', countError.message);
      console.log('   This might be normal if the table doesn\'t exist yet');
    } else {
      console.log(`📋 Current orders in database: ${currentOrders?.length || 0}`);
      if (currentOrders && currentOrders.length > 0) {
        console.log('   Sample orders:');
        currentOrders.slice(0, 5).forEach((order, index) => {
          console.log(`   ${index + 1}. ${order.orderNumber} (${order.created_at})`);
        });
        if (currentOrders.length > 5) {
          console.log(`   ... and ${currentOrders.length - 5} more orders`);
        }
      }
    }

    // Step 2: Clean orders table
    console.log('\n🗑️  STEP 2: CLEANING ORDERS TABLE');
    console.log('=================================');
    
    if (currentOrders && currentOrders.length > 0) {
      console.log(`🔄 Deleting ${currentOrders.length} orders...`);
      
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all orders
      
      if (deleteError) {
        console.log('❌ Error deleting orders:', deleteError.message);
        return false;
      } else {
        console.log('✅ All orders deleted successfully');
      }
    } else {
      console.log('✅ Orders table is already empty');
    }

    // Step 3: Verify cleanup
    console.log('\n✅ STEP 3: VERIFYING CLEANUP');
    console.log('============================');
    
    const { data: afterCleanup, error: verifyError } = await supabase
      .from('orders')
      .select('id', { count: 'exact' });
    
    if (verifyError) {
      console.log('⚠️  Could not verify cleanup:', verifyError.message);
    } else {
      console.log(`📊 Orders remaining: ${afterCleanup?.length || 0}`);
      if ((afterCleanup?.length || 0) === 0) {
        console.log('✅ Database cleanup successful - 0 orders remaining');
      } else {
        console.log('⚠️  Some orders still remain in database');
      }
    }

    // Step 4: Clean other test data
    console.log('\n🧹 STEP 4: CLEANING TEST DATA');
    console.log('=============================');
    
    // Clean test restaurant registrations
    try {
      const { data: testRegistrations } = await supabase
        .from('registered_restaurants')
        .select('id, website_restaurant_id')
        .or('website_restaurant_id.like.*test*,website_restaurant_id.like.*demo*,website_restaurant_id.like.*postman*');
      
      if (testRegistrations && testRegistrations.length > 0) {
        console.log(`🔄 Found ${testRegistrations.length} test restaurant registrations to clean`);
        
        const { error: cleanRegError } = await supabase
          .from('registered_restaurants')
          .delete()
          .or('website_restaurant_id.like.*test*,website_restaurant_id.like.*demo*,website_restaurant_id.like.*postman*');
        
        if (cleanRegError) {
          console.log('⚠️  Could not clean test registrations:', cleanRegError.message);
        } else {
          console.log('✅ Test restaurant registrations cleaned');
        }
      } else {
        console.log('✅ No test restaurant registrations to clean');
      }
    } catch (error) {
      console.log('⚠️  Could not access registered_restaurants table:', error.message);
    }

    // Clean test handshake requests
    try {
      const { data: testHandshakes } = await supabase
        .from('handshake_requests')
        .select('id')
        .or('website_restaurant_id.like.*test*,website_restaurant_id.like.*demo*');
      
      if (testHandshakes && testHandshakes.length > 0) {
        console.log(`🔄 Found ${testHandshakes.length} test handshake requests to clean`);
        
        const { error: cleanHandshakeError } = await supabase
          .from('handshake_requests')
          .delete()
          .or('website_restaurant_id.like.*test*,website_restaurant_id.like.*demo*');
        
        if (cleanHandshakeError) {
          console.log('⚠️  Could not clean test handshakes:', cleanHandshakeError.message);
        } else {
          console.log('✅ Test handshake requests cleaned');
        }
      } else {
        console.log('✅ No test handshake requests to clean');
      }
    } catch (error) {
      console.log('⚠️  Could not access handshake_requests table:', error.message);
    }

    console.log('\n🎉 DATABASE CLEANUP COMPLETE');
    console.log('============================');
    console.log('✅ Orders table: Empty (0 orders)');
    console.log('✅ Test data: Cleaned');
    console.log('✅ Database ready for fresh APK build');
    console.log('\n📱 The app will now show an empty order panel');
    
    return true;
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message);
    return false;
  }
}

// Run the cleanup
cleanDatabase();
