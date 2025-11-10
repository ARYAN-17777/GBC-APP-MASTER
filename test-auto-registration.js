// =====================================================
// AUTO-REGISTRATION TESTING SCRIPT
// =====================================================
// Test script to verify the new auto-registration functionality
// Tests both new restaurant auto-registration and existing restaurant login

const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

// Test credentials
const TEST_RESTAURANTS = [
  {
    username: 'thecurryvault',
    password: 'Password@123',
    description: 'User reported 401 error - should auto-register'
  },
  {
    username: 'autotest001',
    password: 'TestPass123!',
    description: 'New test restaurant for auto-registration'
  },
  {
    username: 'autotest002',
    password: 'SecurePass456#',
    description: 'Another test restaurant'
  }
];

// =====================================================
// AUTHENTICATION TEST FUNCTION
// =====================================================

async function testRestaurantAuth(username, password, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`📝 Credentials: ${username} / ${password}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/restaurant-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'User-Agent': 'AutoRegistrationTest/1.0.0',
        'X-Device-Platform': 'test'
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ SUCCESS: ${result.message}`);
      console.log(`🏪 Restaurant: ${result.restaurant.restaurant_name}`);
      console.log(`🆔 UID: ${result.restaurant.app_restaurant_uid}`);
      
      if (result.session.auto_registered) {
        console.log(`🚀 AUTO-REGISTERED: New restaurant created automatically`);
      } else {
        console.log(`🔑 EXISTING LOGIN: Restaurant was already registered`);
      }
      
      return { success: true, result };
    } else {
      console.log(`❌ FAILED: ${result.error || 'Unknown error'}`);
      console.log(`📊 Status: ${response.status}`);
      
      if (result.validation_errors) {
        console.log(`🔍 Validation Errors:`, result.validation_errors);
      }
      
      return { success: false, result };
    }
    
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// =====================================================
// DUPLICATE LOGIN TEST
// =====================================================

async function testDuplicateLogin(username, password) {
  console.log(`\n🔄 Testing duplicate login for: ${username}`);
  
  const result = await testRestaurantAuth(username, password, 'Duplicate login test');
  
  if (result.success && !result.result.session.auto_registered) {
    console.log(`✅ DUPLICATE LOGIN SUCCESS: Existing restaurant authenticated correctly`);
    return true;
  } else if (result.success && result.result.session.auto_registered) {
    console.log(`⚠️  UNEXPECTED: Restaurant was auto-registered again (should have existed)`);
    return false;
  } else {
    console.log(`❌ DUPLICATE LOGIN FAILED`);
    return false;
  }
}

// =====================================================
// MAIN TEST EXECUTION
// =====================================================

async function runAutoRegistrationTests() {
  console.log('🚀 STARTING AUTO-REGISTRATION TESTS');
  console.log('=====================================');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    autoRegistered: 0,
    existingLogins: 0
  };
  
  // Test each restaurant
  for (const restaurant of TEST_RESTAURANTS) {
    results.total++;
    
    const testResult = await testRestaurantAuth(
      restaurant.username,
      restaurant.password,
      restaurant.description
    );
    
    if (testResult.success) {
      results.passed++;
      
      if (testResult.result.session.auto_registered) {
        results.autoRegistered++;
        
        // Test duplicate login for auto-registered restaurants
        const duplicateResult = await testDuplicateLogin(
          restaurant.username,
          restaurant.password
        );
        
        if (duplicateResult) {
          console.log(`✅ DUPLICATE LOGIN TEST PASSED`);
        } else {
          console.log(`❌ DUPLICATE LOGIN TEST FAILED`);
          results.failed++;
        }
        
      } else {
        results.existingLogins++;
      }
    } else {
      results.failed++;
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`🚀 Auto-Registered: ${results.autoRegistered}`);
  console.log(`🔑 Existing Logins: ${results.existingLogins}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Auto-registration system is working correctly.');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Check the logs above for details.');
  }
  
  return results;
}

// =====================================================
// POSTMAN COLLECTION GENERATOR
// =====================================================

function generatePostmanCollection() {
  const collection = {
    info: {
      name: "GBC Auto-Registration Tests",
      description: "Test collection for the new auto-registration functionality"
    },
    item: TEST_RESTAURANTS.map(restaurant => ({
      name: `Test ${restaurant.username}`,
      request: {
        method: "POST",
        header: [
          {
            key: "Content-Type",
            value: "application/json"
          },
          {
            key: "Authorization",
            value: `Bearer ${SUPABASE_ANON_KEY}`
          }
        ],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            username: restaurant.username,
            password: restaurant.password
          }, null, 2)
        },
        url: {
          raw: `${SUPABASE_URL}/functions/v1/restaurant-login`,
          host: [SUPABASE_URL.replace('https://', '')],
          path: ["functions", "v1", "restaurant-login"]
        }
      }
    }))
  };
  
  console.log('\n📋 POSTMAN COLLECTION:');
  console.log(JSON.stringify(collection, null, 2));
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  runAutoRegistrationTests().then(() => {
    console.log('\n📋 Generating Postman collection...');
    generatePostmanCollection();
  });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAutoRegistrationTests,
    testRestaurantAuth,
    generatePostmanCollection,
    TEST_RESTAURANTS
  };
}
