// =====================================================
// TEST CURRENT REGISTRATION SYSTEM
// =====================================================
// Verify the existing cloud-based restaurant registration system is working

const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

async function testCurrentRegistration() {
  console.log('🧪 Testing Current Registration System...\n');

  // Test data for registration
  const testRegistration = {
    website_restaurant_id: `test_auth_${Date.now()}`,
    restaurant_name: 'Test Auth Restaurant',
    restaurant_phone: '+44 123 456 7890',
    restaurant_email: `test.auth.${Date.now()}@restaurant.com`,
    restaurant_address: '123 Test Street, London, UK',
    owner_name: 'Test Owner',
    category: 'Test Cuisine',
    callback_url: 'https://test-restaurant.com/callback'
  };

  try {
    console.log('📝 Testing restaurant registration...');
    console.log('Registration data:', JSON.stringify(testRegistration, null, 2));

    const response = await fetch(`${SUPABASE_URL}/functions/v1/cloud-register-restaurant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'User-Agent': 'TestScript/1.0',
        'X-Website-Domain': 'test-restaurant.com'
      },
      body: JSON.stringify(testRegistration)
    });

    const result = await response.json();

    console.log('\n📊 Registration Response:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.status === 201 && result.success) {
      console.log('\n✅ REGISTRATION SYSTEM WORKING');
      console.log('✅ Restaurant registered successfully');
      console.log('✅ App Restaurant UID:', result.app_restaurant_uid);
      console.log('✅ Website Restaurant ID:', result.website_restaurant_id);
      
      return {
        success: true,
        app_restaurant_uid: result.app_restaurant_uid,
        website_restaurant_id: result.website_restaurant_id,
        restaurant_email: testRegistration.restaurant_email,
        restaurant_phone: testRegistration.restaurant_phone
      };
    } else {
      console.log('\n❌ REGISTRATION FAILED');
      console.log('❌ Status:', response.status);
      console.log('❌ Error:', result.error || 'Unknown error');
      return { success: false, error: result.error };
    }

  } catch (error) {
    console.error('\n❌ REGISTRATION TEST FAILED');
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testDuplicateDetection(existingData) {
  console.log('\n🧪 Testing Duplicate Detection...');
  console.log('Using existing data:', JSON.stringify(existingData, null, 2));

  try {
    // Try to register with same email
    const duplicateTest = {
      website_restaurant_id: `duplicate_test_${Date.now()}`,
      restaurant_name: 'Duplicate Test Restaurant',
      restaurant_phone: existingData.restaurant_phone,
      restaurant_email: existingData.restaurant_email,
      restaurant_address: '456 Different Street, London, UK',
      owner_name: 'Different Owner',
      category: 'Different Cuisine',
      callback_url: 'https://different-restaurant.com/callback'
    };

    console.log('Duplicate test data:', JSON.stringify(duplicateTest, null, 2));

    const response = await fetch(`${SUPABASE_URL}/functions/v1/cloud-register-restaurant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'User-Agent': 'TestScript/1.0',
        'X-Website-Domain': 'test-restaurant.com'
      },
      body: JSON.stringify(duplicateTest)
    });

    const result = await response.json();

    console.log('Duplicate test response:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.status === 409 && result.duplicate_field) {
      console.log('✅ DUPLICATE DETECTION WORKING');
      console.log('✅ Detected duplicate:', result.duplicate_field);
      console.log('✅ Existing UID returned:', result.existing_app_restaurant_uid);
      return { success: true };
    } else {
      console.log('❌ DUPLICATE DETECTION FAILED');
      console.log('❌ Expected 409 status, got:', response.status);
      if (result.error) {
        console.log('❌ Error:', result.error);
      }
      return { success: false };
    }

  } catch (error) {
    console.error('❌ DUPLICATE TEST FAILED');
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testValidation() {
  console.log('\n🧪 Testing Input Validation...');

  const invalidData = {
    website_restaurant_id: 'test_validation',
    restaurant_name: 'AB', // Too short
    restaurant_phone: '123', // Too short
    restaurant_email: 'invalid-email', // Invalid format
    restaurant_address: 'Short', // Too short
    callback_url: 'http://insecure.com' // Not HTTPS
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cloud-register-restaurant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'User-Agent': 'TestScript/1.0'
      },
      body: JSON.stringify(invalidData)
    });

    const result = await response.json();

    if (response.status === 400 && result.validation_errors) {
      console.log('✅ INPUT VALIDATION WORKING');
      console.log('✅ Validation errors detected:', result.validation_errors.length);
      result.validation_errors.forEach(error => {
        console.log(`  - ${error.field}: ${error.message}`);
      });
      return { success: true };
    } else {
      console.log('❌ INPUT VALIDATION FAILED');
      console.log('❌ Expected 400 status with validation_errors, got:', response.status);
      return { success: false };
    }

  } catch (error) {
    console.error('❌ VALIDATION TEST FAILED');
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 STARTING REGISTRATION SYSTEM VERIFICATION\n');
  console.log('=' .repeat(60));

  const results = {
    registration: false,
    duplicate: false,
    validation: false
  };

  // Test 1: Basic Registration
  console.log('\n1️⃣ TESTING BASIC REGISTRATION');
  console.log('-'.repeat(40));
  const registrationResult = await testCurrentRegistration();
  results.registration = registrationResult.success;

  // Test 2: Duplicate Detection (only if registration worked)
  if (registrationResult.success) {
    console.log('\n2️⃣ TESTING DUPLICATE DETECTION');
    console.log('-'.repeat(40));
    const duplicateResult = await testDuplicateDetection({
      restaurant_email: registrationResult.restaurant_email,
      restaurant_phone: registrationResult.restaurant_phone
    });
    results.duplicate = duplicateResult.success;
  }

  // Test 3: Input Validation
  console.log('\n3️⃣ TESTING INPUT VALIDATION');
  console.log('-'.repeat(40));
  const validationResult = await testValidation();
  results.validation = validationResult.success;

  // Final Results
  console.log('\n' + '='.repeat(60));
  console.log('🏁 VERIFICATION RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Basic Registration: ${results.registration ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Duplicate Detection: ${results.duplicate ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Input Validation: ${results.validation ? 'PASS' : 'FAIL'}`);

  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED - REGISTRATION SYSTEM IS WORKING!');
    console.log('✅ Ready to add username/password authentication');
  } else {
    console.log('\n❌ SOME TESTS FAILED - NEED TO FIX ISSUES FIRST');
    console.log('❌ Cannot proceed with authentication enhancement');
  }

  return { success: allPassed, results };
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
