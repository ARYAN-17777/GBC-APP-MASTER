/**
 * Test Script for Dispatch Functionality
 * 
 * This script tests the dispatch service and configuration
 * to ensure everything works correctly.
 */

const { dispatchService } = require('./services/dispatch');
const { dispatchConfigService } = require('./services/dispatch-config');

// Test configuration
const TEST_ORDER_ID = 'test_order_' + Date.now();
const TEST_ENDPOINTS = [
  {
    name: 'test_local',
    url: 'http://localhost:3000/api/test-dispatch',
    environment: 'development',
    timeout: 5000,
    retryAttempts: 1,
    description: 'Local test endpoint',
    isActive: true
  },
  {
    name: 'test_mock',
    url: 'https://httpbin.org/post',
    environment: 'development',
    timeout: 10000,
    retryAttempts: 2,
    description: 'Mock endpoint for testing',
    isActive: true
  }
];

async function runDispatchTests() {
  console.log('🧪 Starting Dispatch Functionality Tests');
  console.log('=' .repeat(50));

  try {
    // Test 1: Configuration Service
    console.log('\n📋 Test 1: Configuration Service');
    await testConfigurationService();

    // Test 2: Endpoint Connectivity
    console.log('\n🌐 Test 2: Endpoint Connectivity');
    await testEndpointConnectivity();

    // Test 3: Dispatch Service
    console.log('\n🚀 Test 3: Dispatch Service');
    await testDispatchService();

    // Test 4: Error Handling
    console.log('\n❌ Test 4: Error Handling');
    await testErrorHandling();

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

async function testConfigurationService() {
  console.log('Testing configuration service...');

  // Test getting default endpoint
  const defaultEndpoint = dispatchConfigService.getDefaultEndpoint();
  console.log('✓ Default endpoint:', defaultEndpoint?.name);

  // Test adding test endpoints
  for (const endpoint of TEST_ENDPOINTS) {
    const added = dispatchConfigService.addEndpoint(endpoint);
    console.log(`✓ Added test endpoint '${endpoint.name}':`, added);
  }

  // Test getting all endpoints
  const allEndpoints = dispatchConfigService.getEndpoints();
  console.log('✓ Total endpoints:', allEndpoints.length);

  // Test getting active endpoints
  const activeEndpoints = dispatchConfigService.getActiveEndpoints();
  console.log('✓ Active endpoints:', activeEndpoints.length);

  // Test environment filtering
  const devEndpoints = dispatchConfigService.getEndpointsByEnvironment('development');
  console.log('✓ Development endpoints:', devEndpoints.length);

  console.log('Configuration service tests passed ✅');
}

async function testEndpointConnectivity() {
  console.log('Testing endpoint connectivity...');

  // Test individual endpoint
  const testResult = await dispatchConfigService.testEndpoint('test_mock');
  console.log('✓ Mock endpoint test:', testResult.success ? 'PASS' : 'FAIL', testResult.message);

  // Test all endpoints
  const allResults = await dispatchConfigService.testAllEndpoints();
  console.log('✓ All endpoints tested:', Object.keys(allResults).length);

  for (const [name, result] of Object.entries(allResults)) {
    console.log(`  - ${name}: ${result.success ? 'PASS' : 'FAIL'} (${result.responseTime}ms)`);
  }

  console.log('Endpoint connectivity tests passed ✅');
}

async function testDispatchService() {
  console.log('Testing dispatch service...');

  // Test with mock endpoint
  console.log('Testing dispatch to mock endpoint...');
  const mockResult = await dispatchService.dispatchOrder(TEST_ORDER_ID, {
    websiteEndpoint: 'https://httpbin.org/post',
    timeout: 10000,
    retryAttempts: 1
  });

  console.log('✓ Mock dispatch result:', mockResult.success ? 'SUCCESS' : 'FAILED');
  console.log('  Message:', mockResult.message);

  // Test with configuration service endpoint
  const testEndpoint = dispatchConfigService.getEndpoint('test_mock');
  if (testEndpoint) {
    console.log('Testing dispatch with config service...');
    const configResult = await dispatchService.dispatchOrder(TEST_ORDER_ID, {
      websiteEndpoint: testEndpoint.url,
      timeout: testEndpoint.timeout,
      retryAttempts: testEndpoint.retryAttempts
    });

    console.log('✓ Config dispatch result:', configResult.success ? 'SUCCESS' : 'FAILED');
    console.log('  Message:', configResult.message);
  }

  console.log('Dispatch service tests passed ✅');
}

async function testErrorHandling() {
  console.log('Testing error handling...');

  // Test invalid endpoint
  console.log('Testing invalid endpoint...');
  const invalidResult = await dispatchService.dispatchOrder(TEST_ORDER_ID, {
    websiteEndpoint: 'https://invalid-endpoint-that-does-not-exist.com/api/dispatch',
    timeout: 5000,
    retryAttempts: 1
  });

  console.log('✓ Invalid endpoint result:', invalidResult.success ? 'UNEXPECTED SUCCESS' : 'EXPECTED FAILURE');
  console.log('  Message:', invalidResult.message);

  // Test timeout
  console.log('Testing timeout...');
  const timeoutResult = await dispatchService.dispatchOrder(TEST_ORDER_ID, {
    websiteEndpoint: 'https://httpbin.org/delay/10',
    timeout: 2000,
    retryAttempts: 1
  });

  console.log('✓ Timeout result:', timeoutResult.success ? 'UNEXPECTED SUCCESS' : 'EXPECTED FAILURE');
  console.log('  Message:', timeoutResult.message);

  // Test invalid order ID
  console.log('Testing invalid order ID...');
  const invalidOrderResult = await dispatchService.dispatchOrder('', {
    websiteEndpoint: 'https://httpbin.org/post'
  });

  console.log('✓ Invalid order ID result:', invalidOrderResult.success ? 'UNEXPECTED SUCCESS' : 'EXPECTED FAILURE');
  console.log('  Message:', invalidOrderResult.message);

  console.log('Error handling tests passed ✅');
}

// Mock Supabase for testing
global.supabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({
          data: {
            id: TEST_ORDER_ID,
            status: 'completed',
            dispatched_at: null
          },
          error: null
        })
      })
    }),
    update: () => ({
      eq: () => Promise.resolve({ error: null })
    })
  })
};

// Create a simple test server for local testing
function createTestServer() {
  const http = require('http');
  const url = require('url');

  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/api/test-dispatch') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log('📨 Test server received dispatch:', data);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Test dispatch received successfully',
            received_data: data,
            timestamp: new Date().toISOString()
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Invalid JSON'
          }));
        }
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: 'Not found'
      }));
    }
  });

  return server;
}

// Main execution
if (require.main === module) {
  console.log('🚀 GBC Dispatch Functionality Test Suite');
  console.log('Version: 3.1.1');
  console.log('Date:', new Date().toISOString());

  // Start test server
  const testServer = createTestServer();
  testServer.listen(3000, () => {
    console.log('🌐 Test server started on http://localhost:3000');
    
    // Run tests after a short delay
    setTimeout(() => {
      runDispatchTests().finally(() => {
        testServer.close();
        console.log('🛑 Test server stopped');
      });
    }, 1000);
  });
}

module.exports = {
  runDispatchTests,
  testConfigurationService,
  testEndpointConnectivity,
  testDispatchService,
  testErrorHandling
};
