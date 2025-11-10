/**
 * Cloud-Based Handshake Website Integration Example
 * 
 * This example demonstrates how to integrate with the GBC Kitchen App
 * using the new cloud-based handshake system (no device IP required).
 */

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

// Cloud handshake endpoints
const CLOUD_HANDSHAKE_URL = `${SUPABASE_URL}/functions/v1/cloud-handshake`;
const GET_HANDSHAKE_RESPONSE_URL = `${SUPABASE_URL}/functions/v1/get-handshake-response`;
const CLOUD_ORDER_RECEIVE_URL = `${SUPABASE_URL}/functions/v1/cloud-order-receive`;

console.log('🌐 CLOUD-BASED HANDSHAKE WEBSITE INTEGRATION EXAMPLE');
console.log('====================================================\n');

/**
 * Step 1: Initiate Cloud Handshake
 * No device IP required - works from anywhere!
 */
async function initiateCloudHandshake(websiteRestaurantId, callbackUrl) {
  console.log('🤝 Step 1: Initiating cloud handshake...');
  console.log(`   Website Restaurant ID: ${websiteRestaurantId}`);
  console.log(`   Callback URL: ${callbackUrl}`);
  
  try {
    const response = await fetch(CLOUD_HANDSHAKE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        website_restaurant_id: websiteRestaurantId,
        callback_url: callbackUrl,
        website_domain: new URL(callbackUrl).hostname
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Handshake request created successfully!');
      console.log(`   Request ID: ${result.handshake_request_id}`);
      console.log(`   Message: ${result.message}`);
      console.log(`   Estimated response time: ${result.estimated_response_time}`);
      return result;
    } else {
      console.error('❌ Handshake request failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error initiating handshake:', error);
    return null;
  }
}

/**
 * Step 2: Poll for Handshake Response
 * Check if the restaurant app has responded
 */
async function pollHandshakeResponse(handshakeRequestId, maxAttempts = 12, intervalSeconds = 5) {
  console.log('\n🔍 Step 2: Polling for handshake response...');
  console.log(`   Request ID: ${handshakeRequestId}`);
  console.log(`   Max attempts: ${maxAttempts}`);
  console.log(`   Interval: ${intervalSeconds} seconds`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\n   Attempt ${attempt}/${maxAttempts}:`);
    
    try {
      const response = await fetch(`${GET_HANDSHAKE_RESPONSE_URL}?handshake_request_id=${handshakeRequestId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      const result = await response.json();
      
      console.log(`   Status: ${result.status}`);
      console.log(`   Message: ${result.message}`);
      
      if (result.status === 'completed' && result.response) {
        console.log('✅ Handshake completed successfully!');
        console.log('   Restaurant Details:');
        console.log(`     Restaurant UID: ${result.response.restaurant_uid}`);
        console.log(`     Device Label: ${result.response.device_label}`);
        console.log(`     App Version: ${result.response.app_version}`);
        console.log(`     Platform: ${result.response.platform}`);
        console.log(`     Capabilities: ${result.response.capabilities.join(', ')}`);
        return result.response;
      } else if (result.status === 'failed' || result.status === 'expired') {
        console.error(`❌ Handshake ${result.status}:`, result.message);
        return null;
      } else {
        console.log(`   ⏳ Still ${result.status}... waiting ${intervalSeconds} seconds`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error checking handshake status:`, error);
    }
    
    // Wait before next attempt (except on last attempt)
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
    }
  }
  
  console.error('❌ Handshake polling timed out');
  return null;
}

/**
 * Step 3: Send Order to Restaurant
 * Use the restaurant UID from handshake response
 */
async function sendOrderToRestaurant(websiteRestaurantId, appRestaurantUID, orderData) {
  console.log('\n📦 Step 3: Sending order to restaurant...');
  console.log(`   Website Restaurant ID: ${websiteRestaurantId}`);
  console.log(`   App Restaurant UID: ${appRestaurantUID}`);
  console.log(`   Order Number: ${orderData.orderNumber}`);
  
  try {
    const response = await fetch(CLOUD_ORDER_RECEIVE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        website_restaurant_id: websiteRestaurantId,
        app_restaurant_uid: appRestaurantUID,
        ...orderData,
        idempotency_key: `order-${orderData.orderNumber}-${Date.now()}`
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Order sent successfully!');
      console.log(`   Order ID: ${result.order_id}`);
      console.log(`   Message: ${result.message}`);
      console.log(`   Received at: ${result.received_at}`);
      return result;
    } else {
      console.error('❌ Order sending failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error sending order:', error);
    return null;
  }
}

/**
 * Complete Integration Example
 * Demonstrates the full cloud-based handshake flow
 */
async function completeIntegrationExample() {
  console.log('🚀 RUNNING COMPLETE CLOUD HANDSHAKE INTEGRATION EXAMPLE');
  console.log('======================================================\n');
  
  // Configuration
  const websiteRestaurantId = 'rest_gbc_demo_001';
  const callbackUrl = 'https://your-restaurant-website.com/api/orders/callback';
  
  // Sample order data
  const orderData = {
    orderNumber: '#DEMO-12345',
    amount: 25.50,
    currency: 'GBP',
    status: 'pending',
    items: [
      {
        title: 'Chicken Curry',
        quantity: 1,
        unitPrice: '15.50',
        customizations: ['Extra spicy']
      },
      {
        title: 'Basmati Rice',
        quantity: 1,
        unitPrice: '10.00',
        customizations: []
      }
    ],
    user: {
      name: 'Demo Customer',
      phone: '+44 123 456 7890',
      email: 'demo@example.com'
    },
    restaurant: {
      name: 'GBC Kitchen Demo'
    },
    time: new Date().toISOString(),
    notes: 'Demo order from cloud handshake example',
    paymentMethod: 'website_order',
    callback_url: callbackUrl
  };
  
  try {
    // Step 1: Initiate handshake
    const handshakeRequest = await initiateCloudHandshake(websiteRestaurantId, callbackUrl);
    if (!handshakeRequest) {
      console.error('❌ Failed to initiate handshake');
      return;
    }
    
    // Step 2: Wait for handshake response
    const handshakeResponse = await pollHandshakeResponse(handshakeRequest.handshake_request_id);
    if (!handshakeResponse) {
      console.error('❌ Failed to get handshake response');
      return;
    }
    
    // Step 3: Send order
    const orderResult = await sendOrderToRestaurant(
      websiteRestaurantId,
      handshakeResponse.restaurant_uid,
      orderData
    );
    
    if (orderResult) {
      console.log('\n🎉 CLOUD HANDSHAKE INTEGRATION SUCCESSFUL!');
      console.log('==========================================');
      console.log('✅ Handshake completed without device IP');
      console.log('✅ Restaurant automatically discovered');
      console.log('✅ Order sent via cloud communication');
      console.log('✅ Real-time notifications enabled');
      console.log('\n🌐 The cloud-based system is working perfectly!');
    } else {
      console.error('\n❌ Integration failed at order sending stage');
    }
    
  } catch (error) {
    console.error('❌ Integration example failed:', error);
  }
}

/**
 * Postman Collection Example
 * Ready-to-use requests for testing
 */
function generatePostmanCollection() {
  console.log('\n📋 POSTMAN COLLECTION FOR CLOUD HANDSHAKE TESTING');
  console.log('=================================================\n');
  
  const collection = {
    info: {
      name: "GBC Kitchen App - Cloud Handshake",
      description: "Cloud-based handshake system (no device IP required)"
    },
    item: [
      {
        name: "1. Initiate Cloud Handshake",
        request: {
          method: "POST",
          header: [
            {
              key: "Authorization",
              value: `Bearer ${SUPABASE_ANON_KEY}`
            },
            {
              key: "Content-Type",
              value: "application/json"
            }
          ],
          url: {
            raw: CLOUD_HANDSHAKE_URL,
            host: [SUPABASE_URL.replace('https://', '').replace('http://', '')],
            path: ["functions", "v1", "cloud-handshake"]
          },
          body: {
            mode: "raw",
            raw: JSON.stringify({
              website_restaurant_id: "rest_gbc_demo_001",
              callback_url: "https://your-restaurant-website.com/api/orders/callback",
              website_domain: "your-restaurant-website.com"
            }, null, 2)
          }
        }
      },
      {
        name: "2. Get Handshake Response",
        request: {
          method: "GET",
          header: [
            {
              key: "Authorization",
              value: `Bearer ${SUPABASE_ANON_KEY}`
            }
          ],
          url: {
            raw: `${GET_HANDSHAKE_RESPONSE_URL}?handshake_request_id={{handshake_request_id}}`,
            host: [SUPABASE_URL.replace('https://', '').replace('http://', '')],
            path: ["functions", "v1", "get-handshake-response"],
            query: [
              {
                key: "handshake_request_id",
                value: "{{handshake_request_id}}"
              }
            ]
          }
        }
      },
      {
        name: "3. Send Order to Restaurant",
        request: {
          method: "POST",
          header: [
            {
              key: "Authorization",
              value: `Bearer ${SUPABASE_ANON_KEY}`
            },
            {
              key: "Content-Type",
              value: "application/json"
            }
          ],
          url: {
            raw: CLOUD_ORDER_RECEIVE_URL,
            host: [SUPABASE_URL.replace('https://', '').replace('http://', '')],
            path: ["functions", "v1", "cloud-order-receive"]
          },
          body: {
            mode: "raw",
            raw: JSON.stringify({
              website_restaurant_id: "rest_gbc_demo_001",
              app_restaurant_uid: "{{restaurant_uid}}",
              orderNumber: "#DEMO-12345",
              amount: 25.50,
              currency: "GBP",
              status: "pending",
              items: [
                {
                  title: "Chicken Curry",
                  quantity: 1,
                  unitPrice: "15.50"
                }
              ],
              user: {
                name: "Demo Customer",
                phone: "+44 123 456 7890",
                email: "demo@example.com"
              },
              callback_url: "https://your-restaurant-website.com/api/orders/callback",
              idempotency_key: "order-demo-12345-" + Date.now()
            }, null, 2)
          }
        }
      }
    ]
  };
  
  console.log('Postman Collection JSON:');
  console.log(JSON.stringify(collection, null, 2));
  
  return collection;
}

// Export functions for use
module.exports = {
  initiateCloudHandshake,
  pollHandshakeResponse,
  sendOrderToRestaurant,
  completeIntegrationExample,
  generatePostmanCollection
};

// Run example if this file is executed directly
if (require.main === module) {
  console.log('🌐 Cloud-based handshake system eliminates device IP dependencies!');
  console.log('📡 All communication goes through Supabase cloud infrastructure');
  console.log('🔄 Restaurants auto-register when users log in');
  console.log('⚡ Real-time communication via Supabase Realtime');
  console.log('📈 Scalable to unlimited restaurants without manual setup\n');
  
  // Uncomment to run the complete example
  // completeIntegrationExample();
  
  // Uncomment to generate Postman collection
  // generatePostmanCollection();
}
