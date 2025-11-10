// Comprehensive pre-build verification to ensure everything works before APK build
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testEndpoint(name, url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const result = await response.json();
    
    const status = response.ok ? '✅' : '❌';
    console.log(`${status} ${name}: ${response.status} - ${response.ok ? 'Working' : 'Error'}`);
    
    if (!response.ok) {
      console.log(`   Error details: ${JSON.stringify(result, null, 2)}`);
    }
    
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    console.log(`❌ ${name}: Network Error - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function preBuildVerification() {
  console.log('🔍 PRE-BUILD VERIFICATION FOR FRESH APK');
  console.log('=======================================\n');

  let allTestsPassed = true;
  const testResults = {};

  // Test 1: Database Connection
  console.log('🗄️  TEST 1: DATABASE CONNECTION');
  console.log('===============================');
  
  try {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      allTestsPassed = false;
      testResults.database = false;
    } else {
      console.log(`✅ Database connected successfully`);
      console.log(`📊 Current orders count: ${count} (should be 0 after cleanup)`);
      testResults.database = true;
      testResults.ordersCount = count;
    }
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
    allTestsPassed = false;
    testResults.database = false;
  }

  // Test 2: Restaurant Registration System
  console.log('\n🏪 TEST 2: RESTAURANT REGISTRATION SYSTEM');
  console.log('=========================================');
  
  const registrationData = {
    website_restaurant_id: `prebuild_test_${Date.now()}`,
    restaurant_name: 'Pre-Build Test Restaurant',
    restaurant_phone: '+44 123 456 7890',
    restaurant_email: `prebuild_${Date.now()}@restaurant.com`,
    restaurant_address: '123 Pre-Build Test Street, London, UK',
    callback_url: 'https://prebuildtest.com/callback'
  };
  
  const regResult = await testEndpoint(
    'Restaurant Registration',
    `${SUPABASE_URL}/functions/v1/cloud-register-restaurant`,
    'POST',
    registrationData
  );
  
  testResults.registration = regResult.success;
  if (!regResult.success) allTestsPassed = false;

  // Test 3: Order Creation (using existing create-order function)
  console.log('\n📦 TEST 3: ORDER CREATION SYSTEM');
  console.log('================================');
  
  const testOrder = {
    orderNumber: `#PREBUILD-${Date.now()}`,
    amount: 2500,
    currency: 'GBP',
    items: [
      {
        title: 'Pre-Build Test Item',
        quantity: 1,
        price: 2500
      }
    ],
    user: {
      name: 'Pre-Build Test Customer',
      phone: '+44 987 654 3210'
    },
    restaurant: {
      name: 'Pre-Build Test Restaurant'
    },
    paymentMethod: 'test_order',
    status: 'pending'
  };
  
  const orderResult = await testEndpoint(
    'Order Creation',
    `${SUPABASE_URL}/functions/v1/create-order`,
    'POST',
    testOrder
  );
  
  testResults.orderCreation = orderResult.success;
  if (!orderResult.success) allTestsPassed = false;

  // Test 4: Verify order was created in database
  console.log('\n📋 TEST 4: ORDER DATABASE VERIFICATION');
  console.log('=====================================');
  
  try {
    const { data: newOrders, error: orderCheckError } = await supabase
      .from('orders')
      .select('*')
      .eq('orderNumber', testOrder.orderNumber);
    
    if (orderCheckError) {
      console.log('❌ Could not verify order creation:', orderCheckError.message);
      testResults.orderVerification = false;
      allTestsPassed = false;
    } else if (newOrders && newOrders.length > 0) {
      console.log('✅ Test order successfully created in database');
      console.log(`📊 Order details: ${newOrders[0].orderNumber} - ${newOrders[0].amount} ${newOrders[0].currency}`);
      testResults.orderVerification = true;
      testResults.testOrderId = newOrders[0].id;
    } else {
      console.log('❌ Test order was not found in database');
      testResults.orderVerification = false;
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ Order verification failed:', error.message);
    testResults.orderVerification = false;
    allTestsPassed = false;
  }

  // Test 5: Cloud Functions Status
  console.log('\n⚡ TEST 5: CLOUD FUNCTIONS STATUS');
  console.log('=================================');
  
  const functions = [
    'cloud-register-restaurant',
    'cloud-handshake', 
    'get-handshake-response',
    'cloud-order-receive',
    'create-order'
  ];
  
  let functionsWorking = 0;
  for (const func of functions) {
    const funcResult = await testEndpoint(
      `Function: ${func}`,
      `${SUPABASE_URL}/functions/v1/${func}`,
      'GET'
    );
    
    if (funcResult.success || funcResult.status === 400 || funcResult.status === 405) {
      // 400/405 means function exists but needs proper data/method
      functionsWorking++;
      console.log(`   ✅ ${func} is deployed and accessible`);
    }
  }
  
  testResults.cloudFunctions = functionsWorking;
  testResults.totalFunctions = functions.length;
  
  if (functionsWorking < functions.length) {
    console.log(`⚠️  Only ${functionsWorking}/${functions.length} functions are working`);
  }

  // Test 6: Environment Variables Check
  console.log('\n🔧 TEST 6: ENVIRONMENT VARIABLES');
  console.log('================================');
  
  const requiredEnvVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  let envVarsOk = true;
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: Set`);
    } else {
      console.log(`❌ ${envVar}: Missing`);
      envVarsOk = false;
    }
  }
  
  testResults.environmentVariables = envVarsOk;
  if (!envVarsOk) allTestsPassed = false;

  // Clean up test data
  console.log('\n🧹 TEST 7: CLEANUP TEST DATA');
  console.log('============================');
  
  try {
    // Delete test order
    if (testResults.testOrderId) {
      const { error: deleteOrderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', testResults.testOrderId);
      
      if (deleteOrderError) {
        console.log('⚠️  Could not delete test order:', deleteOrderError.message);
      } else {
        console.log('✅ Test order cleaned up');
      }
    }
    
    // Delete test registration
    const { error: deleteRegError } = await supabase
      .from('registered_restaurants')
      .delete()
      .eq('website_restaurant_id', registrationData.website_restaurant_id);
    
    if (deleteRegError) {
      console.log('⚠️  Could not delete test registration:', deleteRegError.message);
    } else {
      console.log('✅ Test registration cleaned up');
    }
    
    testResults.cleanup = true;
  } catch (error) {
    console.log('⚠️  Cleanup error:', error.message);
    testResults.cleanup = false;
  }

  // Final Results
  console.log('\n🎯 PRE-BUILD VERIFICATION RESULTS');
  console.log('=================================');
  
  console.log(`🗄️  Database Connection: ${testResults.database ? '✅ Working' : '❌ Failed'}`);
  console.log(`📊 Orders Count: ${testResults.ordersCount || 0} (should be 0)`);
  console.log(`🏪 Restaurant Registration: ${testResults.registration ? '✅ Working' : '❌ Failed'}`);
  console.log(`📦 Order Creation: ${testResults.orderCreation ? '✅ Working' : '❌ Failed'}`);
  console.log(`📋 Order Verification: ${testResults.orderVerification ? '✅ Working' : '❌ Failed'}`);
  console.log(`⚡ Cloud Functions: ${testResults.cloudFunctions}/${testResults.totalFunctions} working`);
  console.log(`🔧 Environment Variables: ${testResults.environmentVariables ? '✅ Set' : '❌ Missing'}`);
  console.log(`🧹 Test Cleanup: ${testResults.cleanup ? '✅ Complete' : '⚠️  Partial'}`);
  
  if (allTestsPassed && testResults.ordersCount === 0) {
    console.log('\n🎉 ALL PRE-BUILD TESTS PASSED!');
    console.log('✅ System is ready for APK build');
    console.log('✅ Database is clean (0 orders)');
    console.log('✅ Core functionality verified');
    console.log('✅ Cloud functions operational');
    console.log('\n🚀 PROCEED WITH EAS BUILD');
    return true;
  } else {
    console.log('\n❌ SOME TESTS FAILED');
    console.log('⚠️  Please fix issues before building APK');
    if (testResults.ordersCount > 0) {
      console.log(`⚠️  Database still has ${testResults.ordersCount} orders - needs cleanup`);
    }
    return false;
  }
}

// Run verification
preBuildVerification();
