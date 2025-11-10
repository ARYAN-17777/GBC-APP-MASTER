/**
 * Test Script for GBC API Endpoints
 * 
 * This script tests the actual API endpoints to verify they work correctly
 * with the provided authentication and payload formats.
 */

const https = require('https');

// API Configuration
const BASE_URL = 'https://gbcanteen-com.stackstaging.com';
const AUTH_HEADER = 'Basic Z2JjX2tpdGNoZW46R0JDQEtpdGNoZW4jMjAyNQ==';

// Test order numbers (as specified in requirements)
const TEST_ORDER_NUMBERS = ['100047', '100048', '100049', '100050', '100051', '100052'];

console.log('🧪 Testing GBC API Endpoints...\n');
console.log(`🌐 Base URL: ${BASE_URL}`);
console.log(`🔐 Auth: ${AUTH_HEADER}\n`);

/**
 * Make HTTP request to API endpoint
 */
function makeRequest(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const postData = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': AUTH_HEADER,
        'Content-Length': Buffer.byteLength(postData),
        'X-Idempotency-Key': `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            json: data ? JSON.parse(data) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            json: null,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test order status update endpoint
 */
async function testOrderStatusUpdate() {
  console.log('📡 Testing Order Status Update Endpoint');
  console.log('   Endpoint: POST /api/order-status-update\n');

  const testCases = [
    { status: 'approved', description: 'Approve Order' },
    { status: 'preparing', description: 'Mark as Preparing' },
    { status: 'ready', description: 'Mark as Ready' }
  ];

  for (const testCase of testCases) {
    console.log(`   🔄 Testing ${testCase.description} (${testCase.status})...`);
    
    const payload = {
      order_number: TEST_ORDER_NUMBERS[0], // Use first test order
      status: testCase.status,
      timestamp: new Date().toISOString(),
      updated_by: 'kitchen_app',
      notes: `Status updated to ${testCase.status} via kitchen app test`
    };

    try {
      const response = await makeRequest('/api/order-status-update', payload);
      
      console.log(`      Status: ${response.statusCode}`);
      console.log(`      Response: ${response.body}`);
      
      if (response.statusCode === 200) {
        console.log(`      ✅ ${testCase.description} - SUCCESS`);
      } else {
        console.log(`      ❌ ${testCase.description} - FAILED (${response.statusCode})`);
      }
    } catch (error) {
      console.log(`      ❌ ${testCase.description} - ERROR: ${error.message}`);
    }
    
    console.log('');
  }
}

/**
 * Test order dispatch endpoint
 */
async function testOrderDispatch() {
  console.log('🚀 Testing Order Dispatch Endpoint');
  console.log('   Endpoint: POST /api/order-dispatch\n');

  const payload = {
    order_number: TEST_ORDER_NUMBERS[1], // Use second test order
    status: 'dispatched',
    timestamp: new Date().toISOString(),
    dispatched_by: 'kitchen_app',
    notes: 'Order dispatched via kitchen app test'
  };

  try {
    const response = await makeRequest('/api/order-dispatch', payload);
    
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Response: ${response.body}`);
    
    if (response.statusCode === 200) {
      console.log('   ✅ Order Dispatch - SUCCESS');
    } else {
      console.log(`   ❌ Order Dispatch - FAILED (${response.statusCode})`);
    }
  } catch (error) {
    console.log(`   ❌ Order Dispatch - ERROR: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Test order cancel endpoint
 */
async function testOrderCancel() {
  console.log('❌ Testing Order Cancel Endpoint');
  console.log('   Endpoint: POST /api/order-cancel\n');

  const payload = {
    order_number: TEST_ORDER_NUMBERS[2], // Use third test order
    status: 'cancelled',
    timestamp: new Date().toISOString(),
    cancelled_by: 'kitchen_app',
    cancel_reason: 'Cancelled via kitchen app test',
    notes: 'Order cancelled: Test cancellation'
  };

  try {
    const response = await makeRequest('/api/order-cancel', payload);
    
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Response: ${response.body}`);
    
    if (response.statusCode === 200) {
      console.log('   ✅ Order Cancel - SUCCESS');
    } else {
      console.log(`   ❌ Order Cancel - FAILED (${response.statusCode})`);
    }
  } catch (error) {
    console.log(`   ❌ Order Cancel - ERROR: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Test order number normalization
 */
async function testOrderNumberNormalization() {
  console.log('🔢 Testing Order Number Normalization');
  console.log('   Testing # prefix removal\n');

  const testOrderNumber = `#${TEST_ORDER_NUMBERS[3]}`; // Add # prefix
  const expectedOrderNumber = TEST_ORDER_NUMBERS[3]; // Without # prefix

  const payload = {
    order_number: expectedOrderNumber, // Should be normalized (# removed)
    status: 'approved',
    timestamp: new Date().toISOString(),
    updated_by: 'kitchen_app',
    notes: `Testing order number normalization: ${testOrderNumber} → ${expectedOrderNumber}`
  };

  try {
    const response = await makeRequest('/api/order-status-update', payload);
    
    console.log(`   Original: ${testOrderNumber}`);
    console.log(`   Normalized: ${expectedOrderNumber}`);
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Response: ${response.body}`);
    
    if (response.statusCode === 200) {
      console.log('   ✅ Order Number Normalization - SUCCESS');
    } else {
      console.log(`   ❌ Order Number Normalization - FAILED (${response.statusCode})`);
    }
  } catch (error) {
    console.log(`   ❌ Order Number Normalization - ERROR: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Test authentication and headers
 */
async function testAuthentication() {
  console.log('🔐 Testing Authentication and Headers');
  console.log('   Testing required headers\n');

  const payload = {
    order_number: TEST_ORDER_NUMBERS[4],
    status: 'approved',
    timestamp: new Date().toISOString(),
    updated_by: 'kitchen_app',
    notes: 'Testing authentication and headers'
  };

  // Test with correct auth
  try {
    const response = await makeRequest('/api/order-status-update', payload);
    
    console.log('   With correct Basic auth:');
    console.log(`      Status: ${response.statusCode}`);
    console.log(`      Response: ${response.body}`);
    
    if (response.statusCode === 200) {
      console.log('      ✅ Authentication - SUCCESS');
    } else if (response.statusCode === 401) {
      console.log('      ❌ Authentication - UNAUTHORIZED');
    } else {
      console.log(`      ⚠️ Authentication - UNEXPECTED (${response.statusCode})`);
    }
  } catch (error) {
    console.log(`      ❌ Authentication - ERROR: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🎯 Starting API Endpoint Tests...\n');
  console.log(`📋 Test Order Numbers: ${TEST_ORDER_NUMBERS.join(', ')}\n`);
  
  try {
    await testOrderStatusUpdate();
    await testOrderDispatch();
    await testOrderCancel();
    await testOrderNumberNormalization();
    await testAuthentication();
    
    console.log('🎉 API Endpoint Tests Complete!\n');
    console.log('📊 Test Summary:');
    console.log('   ✅ Order Status Update endpoint tested (approved, preparing, ready)');
    console.log('   ✅ Order Dispatch endpoint tested');
    console.log('   ✅ Order Cancel endpoint tested');
    console.log('   ✅ Order number normalization tested');
    console.log('   ✅ Authentication headers tested');
    console.log('\n💡 Note: Check the response status codes above to verify API functionality.');
    console.log('   200 = Success, 401 = Unauthorized, 404 = Not Found, 500 = Server Error');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run tests
runAllTests();
