// Comprehensive test suite for restaurant registration and handshake workflow
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompleteIntegration() {
  console.log('🧪 COMPREHENSIVE INTEGRATION TEST SUITE\n');
  console.log('Testing: Restaurant Registration & Handshake Workflow');
  console.log('='.repeat(60));
  
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  // Helper function to run a test
  async function runTest(testName, testFunction) {
    testResults.total++;
    console.log(`\n🧪 TEST ${testResults.total}: ${testName}`);
    console.log('-'.repeat(50));
    
    try {
      const result = await testFunction();
      if (result.success) {
        console.log('✅ PASSED');
        testResults.passed++;
        testResults.tests.push({ name: testName, status: 'PASSED', details: result.details });
      } else {
        console.log('❌ FAILED');
        console.log('   Reason:', result.reason);
        testResults.failed++;
        testResults.tests.push({ name: testName, status: 'FAILED', reason: result.reason });
      }
    } catch (error) {
      console.log('❌ FAILED');
      console.log('   Error:', error.message);
      testResults.failed++;
      testResults.tests.push({ name: testName, status: 'FAILED', reason: error.message });
    }
  }

  // TEST 1: Verify all restaurants have mappings
  await runTest('All Restaurants Have Mappings', async () => {
    const { data: restaurants, error: restError } = await supabase
      .from('registered_restaurants')
      .select('app_restaurant_uid, website_restaurant_id, restaurant_name')
      .eq('is_active', true);

    if (restError) {
      return { success: false, reason: `Error fetching restaurants: ${restError.message}` };
    }

    const { data: mappings, error: mappingError } = await supabase
      .from('website_restaurant_mappings')
      .select('app_restaurant_uid, website_restaurant_id')
      .eq('is_active', true);

    if (mappingError) {
      return { success: false, reason: `Error fetching mappings: ${mappingError.message}` };
    }

    const restaurantsWithoutMappings = restaurants.filter(restaurant => {
      return !mappings.some(mapping => 
        mapping.app_restaurant_uid === restaurant.app_restaurant_uid && 
        mapping.website_restaurant_id === restaurant.website_restaurant_id
      );
    });

    if (restaurantsWithoutMappings.length > 0) {
      return { 
        success: false, 
        reason: `${restaurantsWithoutMappings.length} restaurants without mappings: ${restaurantsWithoutMappings.map(r => r.restaurant_name).join(', ')}` 
      };
    }

    return { 
      success: true, 
      details: `All ${restaurants.length} restaurants have active mappings` 
    };
  });

  // TEST 2: Test order creation for restaurant with existing mapping
  await runTest('Order Creation - Existing Mapping', async () => {
    const testPayload = {
      website_restaurant_id: '165',
      app_restaurant_uid: '6e8fadce-f46b-48b2-b69c-86f5746cddaa',
      orderNumber: '#TEST-EXISTING-' + Date.now(),
      amount: 25.99,
      currency: 'GBP',
      status: 'pending',
      items: [{ title: 'Test Item', quantity: 1, unitPrice: '25.99', customizations: [] }],
      user: { name: 'Test User', phone: '+447769906123' },
      restaurant: { name: 'Test Restaurant' },
      time: new Date().toISOString(),
      notes: 'Test order with existing mapping',
      paymentMethod: 'website_order',
      callback_url: 'https://gbcanteen-com.stackstaging.com/api/orders/callback',
      idempotency_key: 'test-existing-' + Date.now()
    };

    const response = await fetch('https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-order-receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify(testPayload)
    });

    const responseData = await response.text();
    
    if (response.status !== 200) {
      return { success: false, reason: `HTTP ${response.status}: ${responseData}` };
    }

    // Verify order was created with correct restaurant_uid
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('restaurant_uid, website_restaurant_id')
      .eq('orderNumber', testPayload.orderNumber)
      .single();

    if (orderError) {
      return { success: false, reason: `Order not found in database: ${orderError.message}` };
    }

    if (order.restaurant_uid !== testPayload.app_restaurant_uid) {
      return { success: false, reason: `Wrong restaurant_uid: expected ${testPayload.app_restaurant_uid}, got ${order.restaurant_uid}` };
    }

    // Clean up
    await supabase.from('orders').delete().eq('orderNumber', testPayload.orderNumber);

    return { success: true, details: 'Order created successfully with correct restaurant_uid' };
  });

  // TEST 3: Test order creation for restaurant without mapping (auto-creation)
  await runTest('Order Creation - Auto Mapping Creation', async () => {
    // Find a restaurant without mapping (if any)
    const { data: restaurants } = await supabase
      .from('registered_restaurants')
      .select('app_restaurant_uid, website_restaurant_id, restaurant_name')
      .eq('is_active', true)
      .limit(1);

    if (!restaurants || restaurants.length === 0) {
      return { success: false, reason: 'No restaurants found for testing' };
    }

    const testRestaurant = restaurants[0];
    
    // Temporarily delete mapping to test auto-creation
    await supabase
      .from('website_restaurant_mappings')
      .delete()
      .eq('app_restaurant_uid', testRestaurant.app_restaurant_uid)
      .eq('website_restaurant_id', testRestaurant.website_restaurant_id);

    const testPayload = {
      website_restaurant_id: testRestaurant.website_restaurant_id,
      app_restaurant_uid: testRestaurant.app_restaurant_uid,
      orderNumber: '#TEST-AUTO-' + Date.now(),
      amount: 35.50,
      currency: 'GBP',
      status: 'pending',
      items: [{ title: 'Auto Test Item', quantity: 1, unitPrice: '35.50', customizations: [] }],
      user: { name: 'Auto Test User', phone: '+447769906123' },
      restaurant: { name: testRestaurant.restaurant_name },
      time: new Date().toISOString(),
      notes: 'Test order with auto mapping creation',
      paymentMethod: 'website_order',
      callback_url: 'https://gbcanteen-com.stackstaging.com/api/orders/callback',
      idempotency_key: 'test-auto-' + Date.now()
    };

    const response = await fetch('https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-order-receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify(testPayload)
    });

    const responseData = await response.text();
    
    if (response.status !== 200) {
      return { success: false, reason: `HTTP ${response.status}: ${responseData}` };
    }

    // Verify mapping was auto-created
    const { data: newMapping, error: mappingError } = await supabase
      .from('website_restaurant_mappings')
      .select('*')
      .eq('app_restaurant_uid', testRestaurant.app_restaurant_uid)
      .eq('website_restaurant_id', testRestaurant.website_restaurant_id)
      .single();

    if (mappingError) {
      return { success: false, reason: `Auto-created mapping not found: ${mappingError.message}` };
    }

    // Verify order was created
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('restaurant_uid')
      .eq('orderNumber', testPayload.orderNumber)
      .single();

    if (orderError) {
      return { success: false, reason: `Order not found: ${orderError.message}` };
    }

    // Clean up
    await supabase.from('orders').delete().eq('orderNumber', testPayload.orderNumber);

    return { success: true, details: 'Mapping auto-created and order processed successfully' };
  });

  // TEST 4: Test invalid restaurant (should fail)
  await runTest('Order Creation - Invalid Restaurant', async () => {
    const testPayload = {
      website_restaurant_id: 'invalid_restaurant_999',
      app_restaurant_uid: '00000000-0000-0000-0000-000000000000',
      orderNumber: '#TEST-INVALID-' + Date.now(),
      amount: 15.00,
      currency: 'GBP',
      status: 'pending',
      items: [{ title: 'Invalid Test', quantity: 1, unitPrice: '15.00', customizations: [] }],
      user: { name: 'Invalid Test', phone: '+447769906123' },
      restaurant: { name: 'Invalid Restaurant' },
      time: new Date().toISOString(),
      notes: 'Test with invalid restaurant',
      paymentMethod: 'website_order',
      callback_url: 'https://gbcanteen-com.stackstaging.com/api/orders/callback',
      idempotency_key: 'test-invalid-' + Date.now()
    };

    const response = await fetch('https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-order-receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify(testPayload)
    });

    if (response.status === 404) {
      return { success: true, details: 'Correctly rejected invalid restaurant with 404' };
    } else {
      const responseData = await response.text();
      return { success: false, reason: `Expected 404, got ${response.status}: ${responseData}` };
    }
  });

  // Print final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉');
    console.log('✅ Restaurant registration and handshake workflow is working perfectly');
    console.log('✅ Both manually added and handshake-registered restaurants are supported');
    console.log('✅ Auto-mapping creation is working correctly');
    console.log('✅ Invalid restaurants are properly rejected');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('Failed tests:');
    testResults.tests.filter(t => t.status === 'FAILED').forEach(test => {
      console.log(`   - ${test.name}: ${test.reason}`);
    });
  }

  console.log('\n📊 INTEGRATION TEST COMPLETE');
}

testCompleteIntegration();
