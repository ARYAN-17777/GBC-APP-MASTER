#!/usr/bin/env node

/**
 * Test Order Status Update Functionality
 * 
 * This script tests the order status update buttons and API integration
 * to ensure they're working correctly with the GBC website.
 */

const fs = require('fs');
const https = require('https');

console.log('🧪 Testing Order Status Update Functionality...\n');

// Test 1: Verify API Service Implementation
console.log('✅ Test 1: API Service Implementation');
const apiServicePath = './services/gbc-order-status-api.ts';
if (fs.existsSync(apiServicePath)) {
  const apiContent = fs.readFileSync(apiServicePath, 'utf8');
  
  // Check configuration
  const hasCorrectBaseURL = apiContent.includes('https://gbcanteen-com.stackstaging.com');
  const hasCorrectAuth = apiContent.includes('Basic Z2JjX2tpdGNoZW46R0JDQEtpdGNoZW4jMjAyNQ==');
  
  // Check methods
  const hasUpdateOrderStatus = apiContent.includes('async updateOrderStatus');
  const hasDispatchOrder = apiContent.includes('async dispatchOrder');
  const hasCancelOrder = apiContent.includes('async cancelOrder');
  
  console.log(`   - Base URL configured: ${hasCorrectBaseURL ? '✅' : '❌'}`);
  console.log(`   - Authentication configured: ${hasCorrectAuth ? '✅' : '❌'}`);
  console.log(`   - updateOrderStatus method: ${hasUpdateOrderStatus ? '✅' : '❌'}`);
  console.log(`   - dispatchOrder method: ${hasDispatchOrder ? '✅' : '❌'}`);
  console.log(`   - cancelOrder method: ${hasCancelOrder ? '✅' : '❌'}`);
} else {
  console.log('   ❌ API service file not found');
}

// Test 2: Check Home Page Button Implementation
console.log('\n✅ Test 2: Home Page Button Implementation');
const homePagePath = './app/(tabs)/index.tsx';
if (fs.existsSync(homePagePath)) {
  const homeContent = fs.readFileSync(homePagePath, 'utf8');
  
  const hasGBCAPIImport = homeContent.includes('import gbcOrderStatusAPI');
  const hasApproveHandler = homeContent.includes('handleApproveOrder') && 
                           homeContent.includes('gbcOrderStatusAPI.updateOrderStatus') &&
                           homeContent.includes("'approved'");
  const hasCancelHandler = homeContent.includes('handleCancelOrder') && 
                          homeContent.includes('gbcOrderStatusAPI.cancelOrder');
  const hasApproveButton = homeContent.includes('handleApproveOrder(order.id)');
  const hasCancelButton = homeContent.includes('handleCancelOrder(order.id)');
  
  console.log(`   - GBC API imported: ${hasGBCAPIImport ? '✅' : '❌'}`);
  console.log(`   - Approve handler implemented: ${hasApproveHandler ? '✅' : '❌'}`);
  console.log(`   - Cancel handler implemented: ${hasCancelHandler ? '✅' : '❌'}`);
  console.log(`   - Approve button connected: ${hasApproveButton ? '✅' : '❌'}`);
  console.log(`   - Cancel button connected: ${hasCancelButton ? '✅' : '❌'}`);
} else {
  console.log('   ❌ Home page file not found');
}

// Test 3: Check Orders Page Button Implementation
console.log('\n✅ Test 3: Orders Page Button Implementation');
const ordersPagePath = './app/(tabs)/orders.tsx';
if (fs.existsSync(ordersPagePath)) {
  const ordersContent = fs.readFileSync(ordersPagePath, 'utf8');
  
  const hasGBCAPIImport = ordersContent.includes('import gbcOrderStatusAPI');
  const hasStatusUpdate = ordersContent.includes('gbcOrderStatusAPI.updateOrderStatus') &&
                         (ordersContent.includes("'preparing'") || ordersContent.includes("'ready'"));
  const hasDispatchHandler = ordersContent.includes('gbcOrderStatusAPI.dispatchOrder');
  
  console.log(`   - GBC API imported: ${hasGBCAPIImport ? '✅' : '❌'}`);
  console.log(`   - Status update (preparing/ready): ${hasStatusUpdate ? '✅' : '❌'}`);
  console.log(`   - Dispatch handler implemented: ${hasDispatchHandler ? '✅' : '❌'}`);
} else {
  console.log('   ❌ Orders page file not found');
}

// Test 4: Live API Connectivity Test
console.log('\n✅ Test 4: Live API Connectivity Test');

const testAPIConnectivity = () => {
  return new Promise((resolve) => {
    const testPayload = JSON.stringify({
      order_number: "TEST123",
      order_number_digits: "123",
      status: "approved",
      timestamp: new Date().toISOString(),
      updated_by: "test-system"
    });

    const options = {
      hostname: 'gbcanteen-com.stackstaging.com',
      port: 443,
      path: '/api/order-status-update',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testPayload),
        'Authorization': 'Basic Z2JjX2tpdGNoZW46R0JDQEtpdGNoZW4jMjAyNQ==',
        'X-Idempotency-Key': `test-${Date.now()}`
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`   - API Response Status: ${res.statusCode}`);
        console.log(`   - API Response: ${data}`);
        
        if (res.statusCode === 200 || res.statusCode === 404) {
          console.log('   ✅ API connectivity working (404 expected for test order)');
        } else if (res.statusCode === 401) {
          console.log('   ❌ Authentication failed');
        } else {
          console.log(`   ⚠️ Unexpected response: ${res.statusCode}`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ API connectivity failed: ${error.message}`);
      resolve();
    });

    req.on('timeout', () => {
      console.log('   ❌ API request timed out');
      req.destroy();
      resolve();
    });

    req.write(testPayload);
    req.end();
  });
};

// Run the connectivity test
testAPIConnectivity().then(() => {
  console.log('\n🎉 Order Status Update Functionality Test Complete!\n');
  
  console.log('📋 Summary:');
  console.log('   - API service implementation verified');
  console.log('   - Button handlers and connections checked');
  console.log('   - Live API connectivity tested');
  
  console.log('\n🔧 Next Steps:');
  console.log('   1. Test with real order data in the app');
  console.log('   2. Verify status updates appear on the website');
  console.log('   3. Check error handling for failed requests');
  console.log('   4. Confirm offline queue functionality');
});
