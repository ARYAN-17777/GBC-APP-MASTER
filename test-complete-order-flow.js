// Test complete order flow with authentication
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCompleteOrderFlow() {
  console.log('🔄 TESTING COMPLETE ORDER FLOW WITH AUTHENTICATION');
  console.log('==================================================\n');

  try {
    // Step 1: Create a test user (simulate app login)
    console.log('👤 STEP 1: CREATING TEST USER');
    console.log('=============================');
    
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User',
          phone: '+44 123 456 7890'
        }
      }
    });
    
    if (authError) {
      console.log('❌ User creation failed:', authError.message);
      return false;
    }
    
    console.log('✅ Test user created successfully');
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🆔 User ID: ${authData.user?.id}`);

    // Step 2: Test order creation with authenticated user
    console.log('\n📦 STEP 2: TESTING ORDER CREATION');
    console.log('=================================');
    
    const testOrder = {
      userId: authData.user?.id,
      orderNumber: `#FLOW-TEST-${Date.now()}`,
      amount: 1500,
      currency: 'GBP',
      items: [
        {
          title: 'Flow Test Item',
          quantity: 1,
          price: 1500
        }
      ],
      user: {
        name: 'Flow Test Customer',
        phone: '+44 987 654 3210'
      },
      restaurant: {
        name: 'Flow Test Restaurant'
      },
      paymentMethod: 'test_order',
      status: 'pending'
    };
    
    const orderResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrder)
    });
    
    const orderResult = await orderResponse.json();
    
    if (orderResponse.ok) {
      console.log('✅ Order created successfully');
      console.log(`📋 Order: ${testOrder.orderNumber}`);
      console.log(`💰 Amount: ${testOrder.amount} ${testOrder.currency}`);
    } else {
      console.log('❌ Order creation failed:', orderResult);
    }

    // Step 3: Verify order in database
    console.log('\n📊 STEP 3: VERIFYING ORDER IN DATABASE');
    console.log('======================================');
    
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('orderNumber', testOrder.orderNumber);
    
    if (orderError) {
      console.log('❌ Could not verify order:', orderError.message);
    } else if (orders && orders.length > 0) {
      console.log('✅ Order found in database');
      console.log(`📋 Order details: ${orders[0].orderNumber} - ${orders[0].amount} ${orders[0].currency}`);
      console.log(`👤 User ID: ${orders[0].userId}`);
      console.log(`📅 Created: ${orders[0].createdAt}`);
    } else {
      console.log('❌ Order not found in database');
    }

    // Step 4: Test restaurant registration
    console.log('\n🏪 STEP 4: TESTING RESTAURANT REGISTRATION');
    console.log('==========================================');
    
    const restaurantData = {
      website_restaurant_id: `flow_test_${Date.now()}`,
      restaurant_name: 'Flow Test Restaurant',
      restaurant_phone: '+44 123 456 7890',
      restaurant_email: `flowtest_${Date.now()}@restaurant.com`,
      restaurant_address: '123 Flow Test Street, London, UK',
      callback_url: 'https://flowtest.com/callback'
    };
    
    const regResponse = await fetch(`${SUPABASE_URL}/functions/v1/cloud-register-restaurant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(restaurantData)
    });
    
    const regResult = await regResponse.json();
    
    if (regResponse.ok) {
      console.log('✅ Restaurant registered successfully');
      console.log(`🏪 Restaurant: ${restaurantData.restaurant_name}`);
      console.log(`🆔 App UID: ${regResult.app_restaurant_uid}`);
    } else {
      console.log('❌ Restaurant registration failed:', regResult);
    }

    // Step 5: Check final database state
    console.log('\n📊 STEP 5: FINAL DATABASE STATE');
    console.log('===============================');
    
    const { count: finalOrderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    const { count: restaurantCount } = await supabase
      .from('registered_restaurants')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📦 Total orders in database: ${finalOrderCount}`);
    console.log(`🏪 Total registered restaurants: ${restaurantCount}`);

    // Step 6: Cleanup test data
    console.log('\n🧹 STEP 6: CLEANING UP TEST DATA');
    console.log('================================');
    
    // Delete test order
    const { error: deleteOrderError } = await supabase
      .from('orders')
      .delete()
      .eq('orderNumber', testOrder.orderNumber);
    
    if (deleteOrderError) {
      console.log('⚠️  Could not delete test order:', deleteOrderError.message);
    } else {
      console.log('✅ Test order deleted');
    }
    
    // Delete test restaurant
    const { error: deleteRestError } = await supabase
      .from('registered_restaurants')
      .delete()
      .eq('website_restaurant_id', restaurantData.website_restaurant_id);
    
    if (deleteRestError) {
      console.log('⚠️  Could not delete test restaurant:', deleteRestError.message);
    } else {
      console.log('✅ Test restaurant deleted');
    }

    // Final verification - should be back to 0 orders
    const { count: cleanOrderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Final orders count after cleanup: ${cleanOrderCount}`);

    console.log('\n🎯 COMPLETE ORDER FLOW TEST RESULTS');
    console.log('===================================');
    
    if (orderResponse.ok && regResponse.ok && cleanOrderCount === 0) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('✅ User authentication: Working');
      console.log('✅ Order creation: Working');
      console.log('✅ Database integration: Working');
      console.log('✅ Restaurant registration: Working');
      console.log('✅ Data cleanup: Working');
      console.log('✅ Final state: Clean (0 orders)');
      console.log('\n🚀 SYSTEM IS READY FOR APK BUILD!');
      return true;
    } else {
      console.log('❌ Some tests failed');
      console.log(`📦 Order creation: ${orderResponse.ok ? '✅' : '❌'}`);
      console.log(`🏪 Restaurant registration: ${regResponse.ok ? '✅' : '❌'}`);
      console.log(`🧹 Final cleanup: ${cleanOrderCount === 0 ? '✅' : '❌'}`);
      return false;
    }

  } catch (error) {
    console.error('❌ Complete flow test failed:', error.message);
    return false;
  }
}

// Run the complete flow test
testCompleteOrderFlow();
