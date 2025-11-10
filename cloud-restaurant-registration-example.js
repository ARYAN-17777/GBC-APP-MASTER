// =====================================================
// CLOUD RESTAURANT REGISTRATION INTEGRATION EXAMPLE
// =====================================================
// Complete website integration example for the cloud-based restaurant registration system
// Shows how to register restaurants and integrate with the cloud handshake system

const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

// =====================================================
// RESTAURANT REGISTRATION FUNCTIONS
// =====================================================

/**
 * Register a restaurant with the GBC Kitchen App cloud system
 * @param {Object} restaurantData - Restaurant information
 * @returns {Promise<Object>} Registration result with app_restaurant_uid
 */
async function registerRestaurant(restaurantData) {
  console.log('🏪 Registering restaurant with cloud system...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cloud-register-restaurant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'User-Agent': 'RestaurantWebsite/1.0',
        'X-Website-Domain': 'demo-restaurant-website.com'
      },
      body: JSON.stringify(restaurantData)
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Restaurant registered successfully!');
      console.log(`   App Restaurant UID: ${result.app_restaurant_uid}`);
      console.log(`   Website Restaurant ID: ${result.website_restaurant_id}`);
      console.log(`   Registered At: ${result.registered_at}`);
      return result;
    } else {
      console.error('❌ Registration failed:', result);
      
      // Handle specific error cases
      if (response.status === 409) {
        console.log('ℹ️  Restaurant already exists, using existing UID:', result.existing_app_restaurant_uid);
        return {
          success: true,
          app_restaurant_uid: result.existing_app_restaurant_uid,
          website_restaurant_id: restaurantData.website_restaurant_id,
          duplicate: true
        };
      }
      
      throw new Error(result.error || 'Registration failed');
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    throw error;
  }
}

/**
 * Initiate cloud handshake with registered restaurant
 * @param {string} websiteRestaurantId - Website's restaurant identifier
 * @param {string} targetRestaurantUid - App restaurant UID from registration
 * @param {string} callbackUrl - Website callback URL for order status updates
 * @returns {Promise<Object>} Handshake result
 */
async function initiateCloudHandshake(websiteRestaurantId, targetRestaurantUid, callbackUrl) {
  console.log('🤝 Initiating cloud handshake...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cloud-handshake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'User-Agent': 'RestaurantWebsite/1.0',
        'X-Website-Domain': 'demo-restaurant-website.com'
      },
      body: JSON.stringify({
        website_restaurant_id: websiteRestaurantId,
        callback_url: callbackUrl,
        website_domain: 'demo-restaurant-website.com',
        target_restaurant_uid: targetRestaurantUid
      })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Handshake initiated successfully!');
      console.log(`   Handshake Request ID: ${result.handshake_request_id}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Estimated Response Time: ${result.estimated_response_time}`);
      return result;
    } else {
      console.error('❌ Handshake initiation failed:', result);
      throw new Error(result.error || 'Handshake initiation failed');
    }
  } catch (error) {
    console.error('❌ Handshake error:', error.message);
    throw error;
  }
}

/**
 * Poll for handshake response
 * @param {string} handshakeRequestId - Handshake request ID from initiation
 * @returns {Promise<Object>} Handshake response when completed
 */
async function pollHandshakeResponse(handshakeRequestId) {
  console.log('⏳ Polling for handshake response...');
  
  const maxAttempts = 12; // 2 minutes with 10-second intervals
  const pollInterval = 10000; // 10 seconds
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/get-handshake-response?handshake_request_id=${handshakeRequestId}`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        if (result.status === 'completed') {
          console.log('✅ Handshake completed successfully!');
          console.log(`   Restaurant UID: ${result.response.restaurant_uid}`);
          console.log(`   Device Label: ${result.response.device_label}`);
          console.log(`   App Version: ${result.response.app_version}`);
          console.log(`   Platform: ${result.response.platform}`);
          console.log(`   Capabilities: ${result.response.capabilities.join(', ')}`);
          return result;
        } else if (result.status === 'expired') {
          throw new Error('Handshake request expired');
        } else if (result.status === 'failed') {
          throw new Error('Handshake failed');
        } else {
          console.log(`⏳ Attempt ${attempt}/${maxAttempts}: Handshake status is ${result.status}, waiting...`);
        }
      } else {
        throw new Error(result.error || 'Failed to get handshake response');
      }
      
      // Wait before next poll (except on last attempt)
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    } catch (error) {
      console.error(`❌ Poll attempt ${attempt} failed:`, error.message);
      if (attempt === maxAttempts) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
  
  throw new Error('Handshake polling timed out');
}

/**
 * Send order to restaurant via cloud system
 * @param {string} websiteRestaurantId - Website's restaurant identifier
 * @param {string} appRestaurantUid - App restaurant UID
 * @param {Object} orderData - Order information
 * @returns {Promise<Object>} Order result
 */
async function sendOrderToRestaurant(websiteRestaurantId, appRestaurantUid, orderData) {
  console.log('📦 Sending order to restaurant...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cloud-order-receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'User-Agent': 'RestaurantWebsite/1.0',
        'X-Website-Domain': 'demo-restaurant-website.com'
      },
      body: JSON.stringify({
        website_restaurant_id: websiteRestaurantId,
        app_restaurant_uid: appRestaurantUid,
        ...orderData
      })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Order sent successfully!');
      console.log(`   Order ID: ${result.order_id}`);
      console.log(`   Received At: ${result.received_at}`);
      return result;
    } else {
      console.error('❌ Order sending failed:', result);
      throw new Error(result.error || 'Order sending failed');
    }
  } catch (error) {
    console.error('❌ Order sending error:', error.message);
    throw error;
  }
}

// =====================================================
// COMPLETE INTEGRATION EXAMPLE
// =====================================================

/**
 * Complete integration example: Registration → Handshake → Order
 */
async function completeIntegrationExample() {
  console.log('🚀 COMPLETE CLOUD RESTAURANT INTEGRATION EXAMPLE');
  console.log('=================================================\n');

  try {
    // Step 1: Register Restaurant
    console.log('📋 STEP 1: RESTAURANT REGISTRATION');
    console.log('===================================');
    
    const restaurantData = {
      website_restaurant_id: `rest_demo_${Date.now()}`,
      restaurant_name: 'Demo Cloud Restaurant',
      restaurant_phone: '+44 123 456 7890',
      restaurant_email: `demo_${Date.now()}@restaurant.com`,
      restaurant_address: '123 Demo Street, London, UK, SW1A 1AA',
      owner_name: 'Demo Owner',
      category: 'Demo Cuisine',
      callback_url: 'https://demo-restaurant.com/api/orders/callback'
    };

    const registrationResult = await registerRestaurant(restaurantData);
    
    // Step 2: Initiate Handshake
    console.log('\n🤝 STEP 2: CLOUD HANDSHAKE INITIATION');
    console.log('=====================================');
    
    const handshakeResult = await initiateCloudHandshake(
      registrationResult.website_restaurant_id,
      registrationResult.app_restaurant_uid,
      restaurantData.callback_url
    );
    
    // Step 3: Poll for Handshake Response
    console.log('\n⏳ STEP 3: HANDSHAKE RESPONSE POLLING');
    console.log('====================================');
    
    const handshakeResponse = await pollHandshakeResponse(handshakeResult.handshake_request_id);
    
    // Step 4: Send Test Order
    console.log('\n📦 STEP 4: SEND TEST ORDER');
    console.log('==========================');
    
    const orderData = {
      orderNumber: `#DEMO-${Date.now()}`,
      amount: 25.50,
      currency: 'GBP',
      status: 'pending',
      idempotency_key: `order-demo-${Date.now()}`,
      items: [
        {
          title: 'Demo Chicken Curry',
          quantity: 1,
          unitPrice: '15.50',
          customizations: ['Extra spicy']
        },
        {
          title: 'Demo Basmati Rice',
          quantity: 1,
          unitPrice: '10.00',
          customizations: []
        }
      ],
      user: {
        name: 'Demo Customer',
        phone: '+44 987 654 3210',
        email: 'customer@demo.com'
      },
      restaurant: {
        name: restaurantData.restaurant_name
      },
      callback_url: restaurantData.callback_url,
      time: new Date().toISOString(),
      notes: 'Demo order from cloud registration example',
      paymentMethod: 'website_order'
    };

    const orderResult = await sendOrderToRestaurant(
      registrationResult.website_restaurant_id,
      registrationResult.app_restaurant_uid,
      orderData
    );
    
    // Success Summary
    console.log('\n🎉 INTEGRATION COMPLETE!');
    console.log('========================');
    console.log('✅ Restaurant registered successfully');
    console.log('✅ Cloud handshake completed successfully');
    console.log('✅ Test order sent successfully');
    console.log('\n📊 Integration Summary:');
    console.log(`   Website Restaurant ID: ${registrationResult.website_restaurant_id}`);
    console.log(`   App Restaurant UID: ${registrationResult.app_restaurant_uid}`);
    console.log(`   Handshake Request ID: ${handshakeResult.handshake_request_id}`);
    console.log(`   Order ID: ${orderResult.order_id}`);
    console.log('\n🌐 The restaurant is now fully integrated with the GBC Kitchen App cloud system!');
    
  } catch (error) {
    console.error('\n❌ INTEGRATION FAILED:', error.message);
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Verify Supabase URL and anonymous key are correct');
    console.log('2. Check that all Edge Functions are deployed');
    console.log('3. Ensure database schema is properly deployed');
    console.log('4. Verify network connectivity');
    console.log('5. Check Supabase function logs for detailed errors');
  }
}

// =====================================================
// POSTMAN COLLECTION GENERATOR
// =====================================================

/**
 * Generate Postman collection for restaurant registration system
 */
function generatePostmanCollection() {
  const collection = {
    info: {
      name: 'GBC Kitchen App - Cloud Restaurant Registration',
      description: 'Complete API collection for cloud-based restaurant registration and integration',
      version: '1.0.0'
    },
    variable: [
      {
        key: 'supabase_url',
        value: SUPABASE_URL
      },
      {
        key: 'supabase_anon_key',
        value: SUPABASE_ANON_KEY
      }
    ],
    item: [
      {
        name: '1. Register Restaurant',
        request: {
          method: 'POST',
          header: [
            { key: 'Content-Type', value: 'application/json' },
            { key: 'Authorization', value: 'Bearer {{supabase_anon_key}}' },
            { key: 'User-Agent', value: 'RestaurantWebsite/1.0' },
            { key: 'X-Website-Domain', value: 'demo-restaurant.com' }
          ],
          url: '{{supabase_url}}/functions/v1/cloud-register-restaurant',
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              website_restaurant_id: 'rest_postman_demo',
              restaurant_name: 'Postman Demo Restaurant',
              restaurant_phone: '+44 123 456 7890',
              restaurant_email: 'postman@demo.com',
              restaurant_address: '123 Postman Street, London, UK',
              owner_name: 'Postman Owner',
              category: 'Demo Cuisine',
              callback_url: 'https://postman-demo.com/callback'
            }, null, 2)
          }
        }
      },
      {
        name: '2. Initiate Cloud Handshake',
        request: {
          method: 'POST',
          header: [
            { key: 'Content-Type', value: 'application/json' },
            { key: 'Authorization', value: 'Bearer {{supabase_anon_key}}' },
            { key: 'User-Agent', value: 'RestaurantWebsite/1.0' }
          ],
          url: '{{supabase_url}}/functions/v1/cloud-handshake',
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              website_restaurant_id: 'rest_postman_demo',
              callback_url: 'https://postman-demo.com/callback',
              target_restaurant_uid: 'REPLACE_WITH_REGISTRATION_UID'
            }, null, 2)
          }
        }
      },
      {
        name: '3. Get Handshake Response',
        request: {
          method: 'GET',
          header: [
            { key: 'Authorization', value: 'Bearer {{supabase_anon_key}}' }
          ],
          url: '{{supabase_url}}/functions/v1/get-handshake-response?handshake_request_id=REPLACE_WITH_HANDSHAKE_REQUEST_ID'
        }
      },
      {
        name: '4. Send Order',
        request: {
          method: 'POST',
          header: [
            { key: 'Content-Type', value: 'application/json' },
            { key: 'Authorization', value: 'Bearer {{supabase_anon_key}}' },
            { key: 'User-Agent', value: 'RestaurantWebsite/1.0' }
          ],
          url: '{{supabase_url}}/functions/v1/cloud-order-receive',
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              website_restaurant_id: 'rest_postman_demo',
              app_restaurant_uid: 'REPLACE_WITH_REGISTRATION_UID',
              orderNumber: '#POSTMAN-001',
              amount: 25.50,
              currency: 'GBP',
              idempotency_key: 'postman-order-001',
              items: [
                {
                  title: 'Postman Test Item',
                  quantity: 1,
                  unitPrice: '25.50'
                }
              ],
              user: {
                name: 'Postman Customer',
                phone: '+44 987 654 3210',
                email: 'customer@postman.com'
              },
              callback_url: 'https://postman-demo.com/callback'
            }, null, 2)
          }
        }
      }
    ]
  };

  console.log('\n📮 POSTMAN COLLECTION');
  console.log('=====================');
  console.log(JSON.stringify(collection, null, 2));
  console.log('\n💡 To use this collection:');
  console.log('1. Copy the JSON above');
  console.log('2. Import into Postman');
  console.log('3. Replace placeholder values with actual IDs from responses');
  console.log('4. Run requests in sequence: Register → Handshake → Get Response → Send Order');
}

// =====================================================
// MAIN EXECUTION
// =====================================================

// Run the complete integration example
if (require.main === module) {
  console.log('🌐 CLOUD RESTAURANT REGISTRATION INTEGRATION EXAMPLE');
  console.log('====================================================\n');
  
  console.log('Choose an option:');
  console.log('1. Run complete integration example');
  console.log('2. Generate Postman collection');
  console.log('');
  
  // For demo purposes, run the complete example
  completeIntegrationExample();
}

// Export functions for use in other modules
module.exports = {
  registerRestaurant,
  initiateCloudHandshake,
  pollHandshakeResponse,
  sendOrderToRestaurant,
  completeIntegrationExample,
  generatePostmanCollection
};

// =====================================================
// INTEGRATION EXAMPLE COMPLETE
// =====================================================
// This example demonstrates:
// ✅ Restaurant registration with cloud system
// ✅ Cloud handshake initiation and polling
// ✅ Order sending via cloud system
// ✅ Complete error handling and logging
// ✅ Postman collection generation
// ✅ Production-ready integration patterns
// =====================================================
