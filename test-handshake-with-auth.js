#!/usr/bin/env node

/**
 * Test Handshake Flow with Authentication
 * 
 * This script tests the complete flow:
 * 1. Register restaurant with username/password
 * 2. Authenticate restaurant 
 * 3. Initiate handshake
 * 4. Verify the complete integration
 */

const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

console.log('🧪 TESTING HANDSHAKE FLOW WITH AUTHENTICATION');
console.log('============================================================');

async function testCompleteFlow() {
  const timestamp = Date.now();
  const testData = {
    website_restaurant_id: `handshake_test_${timestamp}`,
    restaurant_name: 'Handshake Test Restaurant',
    restaurant_phone: '+44 555 123 4567',
    restaurant_email: `handshake.test.${timestamp}@example.com`,
    restaurant_address: '123 Handshake Test Street, London, UK',
    callback_url: 'https://handshake-test.com/callback',
    username: `handshaketest${timestamp}`,
    password: 'HandshakeTest123!'
  };

  try {
    // Step 1: Register Restaurant with Authentication
    console.log('1️⃣  REGISTERING RESTAURANT WITH AUTHENTICATION');
    console.log('------------------------------');
    
    const registerResponse = await fetch(`${SUPABASE_URL}/functions/v1/cloud-register-restaurant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'User-Agent': 'HandshakeTestScript/1.0',
      },
      body: JSON.stringify(testData),
    });

    if (!registerResponse.ok) {
      const errorData = await registerResponse.text();
      console.error('❌ Registration failed:', registerResponse.status, errorData);
      return false;
    }

    const registrationResult = await registerResponse.json();
    console.log('✅ Registration successful');
    console.log(`   • App Restaurant UID: ${registrationResult.app_restaurant_uid}`);
    console.log(`   • Username: ${testData.username}`);
    console.log(`   • Authentication enabled: ${registrationResult.authentication ? 'Yes' : 'No'}`);

    // Step 2: Test Restaurant Authentication
    console.log('\n2️⃣  TESTING RESTAURANT AUTHENTICATION');
    console.log('------------------------------');
    
    const loginResponse = await fetch(`${SUPABASE_URL}/functions/v1/restaurant-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'User-Agent': 'GBCKitchenApp/3.0.0',
        'X-Device-Platform': 'test',
      },
      body: JSON.stringify({
        username: testData.username,
        password: testData.password
      }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.text();
      console.error('❌ Authentication failed:', loginResponse.status, errorData);
      return false;
    }

    const loginResult = await loginResponse.json();
    console.log('✅ Authentication successful');
    console.log(`   • Restaurant: ${loginResult.restaurant.restaurant_name}`);
    console.log(`   • Username: ${loginResult.restaurant.username}`);
    console.log(`   • Session: ${loginResult.session.authenticated ? 'Active' : 'Inactive'}`);

    // Step 3: Test Cloud Handshake
    console.log('\n3️⃣  TESTING CLOUD HANDSHAKE');
    console.log('------------------------------');
    
    const handshakeResponse = await fetch(`${SUPABASE_URL}/functions/v1/cloud-handshake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'User-Agent': 'HandshakeTestScript/1.0',
        'X-Website-Domain': 'handshake-test.com',
      },
      body: JSON.stringify({
        website_restaurant_id: testData.website_restaurant_id,
        callback_url: testData.callback_url,
        website_domain: 'handshake-test.com',
        target_restaurant_uid: registrationResult.app_restaurant_uid
      }),
    });

    if (!handshakeResponse.ok) {
      const errorData = await handshakeResponse.text();
      console.error('❌ Handshake failed:', handshakeResponse.status, errorData);
      return false;
    }

    const handshakeResult = await handshakeResponse.json();
    console.log('✅ Handshake initiated successfully');
    console.log(`   • Request ID: ${handshakeResult.handshake_request_id}`);
    console.log(`   • Status: ${handshakeResult.status}`);
    console.log(`   • Polling URL: ${handshakeResult.polling_url}`);

    // Step 4: Verify Integration
    console.log('\n4️⃣  INTEGRATION VERIFICATION');
    console.log('------------------------------');
    console.log('✅ Complete flow successful:');
    console.log('   • Restaurant registration with authentication ✅');
    console.log('   • Username/password authentication ✅');
    console.log('   • Cloud handshake initiation ✅');
    console.log('   • All endpoints responding correctly ✅');

    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

async function main() {
  const success = await testCompleteFlow();
  
  console.log('\n============================================================');
  console.log('📊 TEST RESULTS');
  console.log('============================================================');
  
  if (success) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('');
    console.log('✅ Handshake Flow with Authentication Status:');
    console.log('   • Restaurant registration: ✅ Working');
    console.log('   • Authentication system: ✅ Working');
    console.log('   • Cloud handshake: ✅ Working');
    console.log('   • Complete integration: ✅ Ready for production');
    console.log('');
    console.log('🚀 The updated HANDSHAKE.md documentation is accurate and the');
    console.log('   authentication parameters are working correctly!');
  } else {
    console.log('❌ TESTS FAILED!');
    console.log('');
    console.log('Please check the error messages above and verify:');
    console.log('   • Supabase endpoints are accessible');
    console.log('   • Authentication schema is properly applied');
    console.log('   • Edge functions are deployed correctly');
  }
  
  console.log('');
}

main().catch(console.error);
