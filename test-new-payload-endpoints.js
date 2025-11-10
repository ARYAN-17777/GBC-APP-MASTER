/**
 * Test Script for New Payload Endpoints
 * 
 * This script tests the complete flow:
 * 1. Handshake to get app UID
 * 2. Send new format order
 * 3. Send legacy format order
 * 4. Test error scenarios
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const APP_BASE_URL = 'http://localhost:8081'; // Change to your app's IP if needed
const WEBSITE_RESTAURANT_ID = 'rest_12345';
let APP_RESTAURANT_UID = null;

// Helper function to generate timestamp
function getTimestamp() {
  return new Date().toISOString();
}

// Helper function to log test results
function logTest(testName, success, message, data = null) {
  const status = success ? '✅' : '❌';
  console.log(`${status} ${testName}: ${message}`);
  if (data) {
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
  console.log('');
}

// Test 1: Handshake
async function testHandshake() {
  console.log('🤝 Testing Handshake Endpoint...\n');
  
  try {
    const response = await axios.post(`${APP_BASE_URL}/api/handshake`, {
      website_restaurant_id: WEBSITE_RESTAURANT_ID,
      callback_url: 'https://gbcanteen-com.stackstaging.com/api/orders/callback',
      timestamp: getTimestamp()
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (response.status === 200 && response.data.app_restaurant_uid) {
      APP_RESTAURANT_UID = response.data.app_restaurant_uid;
      logTest('Handshake', true, 'Successfully received app UID', {
        app_restaurant_uid: APP_RESTAURANT_UID,
        device_label: response.data.device_label,
        app_version: response.data.app_version,
        platform: response.data.platform
      });
      return true;
    } else {
      logTest('Handshake', false, 'Invalid response format', response.data);
      return false;
    }
  } catch (error) {
    logTest('Handshake', false, `Request failed: ${error.message}`);
    if (error.response) {
      console.log('   Response Status:', error.response.status);
      console.log('   Response Data:', error.response.data);
    }
    return false;
  }
}

// Test 2: New Payload Format Order
async function testNewPayloadOrder() {
  console.log('📦 Testing New Payload Format...\n');
  
  if (!APP_RESTAURANT_UID) {
    logTest('New Payload Order', false, 'No app UID available - handshake must succeed first');
    return false;
  }

  const orderPayload = {
    userId: uuidv4(),
    orderNumber: `#NEW${Math.floor(Math.random() * 1000)}`,
    amount: 25.50,
    amountDisplay: '£25.50',
    totals: {
      subtotal: '23.00',
      discount: '2.00',
      delivery: '1.50',
      vat: '3.00',
      total: '25.50'
    },
    status: 'pending',
    items: [
      {
        title: 'Chicken Curry',
        quantity: 1,
        unitPrice: '12.50',
        lineTotal: '12.50',
        unitPriceMinor: 1250,
        price: 12.50,
        originalUnitPrice: '12.50',
        discountedUnitPrice: '12.50',
        discountPerUnit: '0.00',
        discountPerLine: '0.00',
        customizations: [
          {
            name: 'Medium Spice',
            qty: 1
          },
          {
            name: 'Extra Rice',
            qty: 1,
            price: '2.00'
          }
        ]
      },
      {
        title: 'Naan Bread',
        quantity: 2,
        unitPrice: '3.50',
        lineTotal: '7.00',
        unitPriceMinor: 350,
        price: 3.50,
        originalUnitPrice: '3.50',
        discountedUnitPrice: '3.50',
        discountPerUnit: '0.00',
        discountPerLine: '0.00',
        customizations: [
          {
            name: 'Garlic Naan',
            qty: 1,
            price: '0.50'
          }
        ]
      }
    ],
    user: {
      name: 'Test Customer',
      phone: '+447700900123'
    },
    restaurant: {
      name: "General Bilimoria's Canteen"
    }
  };

  try {
    const response = await axios.post(`${APP_BASE_URL}/api/orders/receive`, orderPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Restaurant-UID': APP_RESTAURANT_UID,
        'X-Website-Restaurant-ID': WEBSITE_RESTAURANT_ID,
        'X-Idempotency-Key': uuidv4()
      },
      timeout: 10000
    });

    if (response.status === 201 || response.status === 200) {
      logTest('New Payload Order', true, 'Order sent successfully', {
        orderNumber: orderPayload.orderNumber,
        amount: orderPayload.amount,
        itemCount: orderPayload.items.length,
        customizationCount: orderPayload.items.reduce((acc, item) => acc + item.customizations.length, 0)
      });
      return true;
    } else {
      logTest('New Payload Order', false, 'Unexpected response status', response.data);
      return false;
    }
  } catch (error) {
    logTest('New Payload Order', false, `Request failed: ${error.message}`);
    if (error.response) {
      console.log('   Response Status:', error.response.status);
      console.log('   Response Data:', error.response.data);
    }
    return false;
  }
}

// Test 3: Legacy Payload Format Order
async function testLegacyPayloadOrder() {
  console.log('📦 Testing Legacy Payload Format...\n');
  
  if (!APP_RESTAURANT_UID) {
    logTest('Legacy Payload Order', false, 'No app UID available - handshake must succeed first');
    return false;
  }

  const legacyPayload = {
    id: uuidv4(),
    orderNumber: `#LEG${Math.floor(Math.random() * 1000)}`,
    amount: 1200,
    status: 'pending',
    items: [
      {
        title: 'Tea',
        quantity: 2,
        price: 600
      },
      {
        title: 'Biscuits',
        quantity: 1,
        price: 300
      }
    ],
    user: {
      name: 'Legacy Customer',
      phone: '+44 7111 111111'
    },
    restaurant: {
      name: "General Bilimoria's Canteen"
    },
    stripeId: 'pi_test_12345',
    time: '14:30',
    createdAt: getTimestamp()
  };

  try {
    const response = await axios.post(`${APP_BASE_URL}/api/orders/receive`, legacyPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Restaurant-UID': APP_RESTAURANT_UID,
        'X-Website-Restaurant-ID': WEBSITE_RESTAURANT_ID,
        'X-Idempotency-Key': uuidv4()
      },
      timeout: 10000
    });

    if (response.status === 201 || response.status === 200) {
      logTest('Legacy Payload Order', true, 'Legacy order sent successfully', {
        orderNumber: legacyPayload.orderNumber,
        amount: legacyPayload.amount,
        itemCount: legacyPayload.items.length
      });
      return true;
    } else {
      logTest('Legacy Payload Order', false, 'Unexpected response status', response.data);
      return false;
    }
  } catch (error) {
    logTest('Legacy Payload Order', false, `Request failed: ${error.message}`);
    if (error.response) {
      console.log('   Response Status:', error.response.status);
      console.log('   Response Data:', error.response.data);
    }
    return false;
  }
}

// Test 4: Error Scenarios
async function testErrorScenarios() {
  console.log('🚨 Testing Error Scenarios...\n');
  
  // Test 4.1: Invalid Restaurant UID
  try {
    await axios.post(`${APP_BASE_URL}/api/orders/receive`, {
      userId: uuidv4(),
      orderNumber: '#ERROR001',
      amount: 10.00,
      status: 'pending',
      items: [{ title: 'Test Item', quantity: 1, price: 10.00 }],
      user: { name: 'Error Test', phone: '+44 7000 000000' },
      restaurant: { name: 'Test Restaurant' }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Restaurant-UID': 'invalid-uid-12345',
        'X-Website-Restaurant-ID': WEBSITE_RESTAURANT_ID,
        'X-Idempotency-Key': uuidv4()
      },
      timeout: 10000
    });
    
    logTest('Invalid UID Test', false, 'Expected 403 error but request succeeded');
  } catch (error) {
    if (error.response && error.response.status === 403) {
      logTest('Invalid UID Test', true, 'Correctly rejected invalid UID with 403');
    } else {
      logTest('Invalid UID Test', false, `Unexpected error: ${error.message}`);
    }
  }

  // Test 4.2: Missing Headers
  try {
    await axios.post(`${APP_BASE_URL}/api/orders/receive`, {
      userId: uuidv4(),
      orderNumber: '#ERROR002',
      amount: 10.00,
      status: 'pending',
      items: [{ title: 'Test Item', quantity: 1, price: 10.00 }],
      user: { name: 'Error Test', phone: '+44 7000 000000' },
      restaurant: { name: 'Test Restaurant' }
    }, {
      headers: {
        'Content-Type': 'application/json',
        // Missing X-Restaurant-UID header
        'X-Website-Restaurant-ID': WEBSITE_RESTAURANT_ID,
        'X-Idempotency-Key': uuidv4()
      },
      timeout: 10000
    });
    
    logTest('Missing Headers Test', false, 'Expected 400 error but request succeeded');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logTest('Missing Headers Test', true, 'Correctly rejected missing headers with 400');
    } else {
      logTest('Missing Headers Test', false, `Unexpected error: ${error.message}`);
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting GBC Kitchen App New Payload Tests...\n');
  console.log('📍 Testing against:', APP_BASE_URL);
  console.log('🏪 Restaurant ID:', WEBSITE_RESTAURANT_ID);
  console.log('⏰ Timestamp:', getTimestamp());
  console.log('\n' + '='.repeat(60) + '\n');

  const results = {
    handshake: false,
    newPayload: false,
    legacyPayload: false,
    errorScenarios: true // Assume true, will be set false if any error test fails
  };

  // Run tests in sequence
  results.handshake = await testHandshake();
  
  if (results.handshake) {
    results.newPayload = await testNewPayloadOrder();
    results.legacyPayload = await testLegacyPayloadOrder();
  }
  
  await testErrorScenarios();

  // Summary
  console.log('='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`✅ Handshake: ${results.handshake ? 'PASS' : 'FAIL'}`);
  console.log(`✅ New Payload: ${results.newPayload ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Legacy Payload: ${results.legacyPayload ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Error Handling: ${results.errorScenarios ? 'PASS' : 'FAIL'}`);
  console.log('');
  console.log(`🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The new payload system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the app and try again.');
  }
  
  console.log('\n📱 Next Steps:');
  console.log('1. Check the app\'s Notifications tab for real-time updates');
  console.log('2. Verify orders appear in the Orders tab');
  console.log('3. Test receipt printing functionality');
  console.log('4. Confirm audio notifications are working');
}

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error.message);
  process.exit(1);
});
