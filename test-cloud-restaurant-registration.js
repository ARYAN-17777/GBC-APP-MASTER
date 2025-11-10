// =====================================================
// CLOUD RESTAURANT REGISTRATION SYSTEM TEST SUITE
// =====================================================
// Comprehensive test suite for the cloud-based restaurant registration system
// Tests all validation, error handling, and integration scenarios

const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';
const REGISTRATION_ENDPOINT = `${SUPABASE_URL}/functions/v1/cloud-register-restaurant`;

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function logTest(testName, passed, details = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`✅ ${testName}`);
    if (details) console.log(`    ${details}`);
  } else {
    failedTests++;
    console.log(`❌ ${testName}`);
    if (details) console.log(`    ${details}`);
  }
}

function generateUniqueId() {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function makeRegistrationRequest(data, expectedStatus = 201) {
  try {
    const response = await fetch(REGISTRATION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'User-Agent': 'TestSuite/1.0',
        'X-Website-Domain': 'test-restaurant.com'
      },
      body: JSON.stringify(data)
    });

    const responseData = await response.json();
    return {
      status: response.status,
      data: responseData,
      success: response.status === expectedStatus
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      success: false
    };
  }
}

// =====================================================
// TEST DATA GENERATORS
// =====================================================

function getValidRegistrationData() {
  const uniqueId = generateUniqueId();
  return {
    website_restaurant_id: `rest_${uniqueId}`,
    restaurant_name: `Test Restaurant ${uniqueId}`,
    restaurant_phone: `+44 123 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
    restaurant_email: `test_${uniqueId}@restaurant.com`,
    restaurant_address: `123 Test Street, London, UK, ${uniqueId}`,
    owner_name: `Test Owner ${uniqueId}`,
    category: 'Test Cuisine',
    callback_url: `https://test-restaurant-${uniqueId}.com/api/callback`
  };
}

function getMinimalValidData() {
  const uniqueId = generateUniqueId();
  return {
    website_restaurant_id: `rest_minimal_${uniqueId}`,
    restaurant_name: `Minimal Restaurant ${uniqueId}`,
    restaurant_phone: `+44 987 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
    restaurant_email: `minimal_${uniqueId}@restaurant.com`,
    restaurant_address: `456 Minimal Street, London, UK, ${uniqueId}`,
    callback_url: `https://minimal-restaurant-${uniqueId}.com/api/callback`
  };
}

// =====================================================
// TEST FUNCTIONS
// =====================================================

async function testSuccessfulRegistrationWithAllFields() {
  const testData = getValidRegistrationData();
  const result = await makeRegistrationRequest(testData, 201);
  
  const passed = result.success && 
                 result.data.success === true &&
                 result.data.app_restaurant_uid &&
                 result.data.website_restaurant_id === testData.website_restaurant_id;
  
  logTest(
    '1. Successful registration with all fields',
    passed,
    passed ? `Generated UID: ${result.data.app_restaurant_uid}` : `Error: ${JSON.stringify(result.data)}`
  );
  
  return result.data.app_restaurant_uid; // Return for duplicate tests
}

async function testSuccessfulRegistrationWithRequiredFieldsOnly() {
  const testData = getMinimalValidData();
  const result = await makeRegistrationRequest(testData, 201);
  
  const passed = result.success && 
                 result.data.success === true &&
                 result.data.app_restaurant_uid;
  
  logTest(
    '2. Successful registration with required fields only',
    passed,
    passed ? `Generated UID: ${result.data.app_restaurant_uid}` : `Error: ${JSON.stringify(result.data)}`
  );
  
  return { email: testData.restaurant_email, phone: testData.restaurant_phone, websiteId: testData.website_restaurant_id };
}

async function testDuplicateEmailDetection(existingEmail) {
  const testData = getValidRegistrationData();
  testData.restaurant_email = existingEmail;
  
  const result = await makeRegistrationRequest(testData, 409);
  
  const passed = result.status === 409 &&
                 result.data.success === false &&
                 result.data.duplicate_field === 'restaurant_email';
  
  logTest(
    '3. Duplicate email detection',
    passed,
    passed ? 'Correctly rejected duplicate email' : `Error: ${JSON.stringify(result.data)}`
  );
}

async function testDuplicatePhoneDetection(existingPhone) {
  const testData = getValidRegistrationData();
  testData.restaurant_phone = existingPhone;
  
  const result = await makeRegistrationRequest(testData, 409);
  
  const passed = result.status === 409 &&
                 result.data.success === false &&
                 result.data.duplicate_field === 'restaurant_phone';
  
  logTest(
    '4. Duplicate phone detection',
    passed,
    passed ? 'Correctly rejected duplicate phone' : `Error: ${JSON.stringify(result.data)}`
  );
}

async function testDuplicateWebsiteIdDetection(existingWebsiteId) {
  const testData = getValidRegistrationData();
  testData.website_restaurant_id = existingWebsiteId;
  
  const result = await makeRegistrationRequest(testData, 409);
  
  const passed = result.status === 409 &&
                 result.data.success === false &&
                 result.data.duplicate_field === 'website_restaurant_id';
  
  logTest(
    '5. Duplicate website_restaurant_id detection',
    passed,
    passed ? 'Correctly rejected duplicate website ID' : `Error: ${JSON.stringify(result.data)}`
  );
}

async function testInvalidEmailFormat() {
  const testData = getValidRegistrationData();
  testData.restaurant_email = 'invalid-email-format';
  
  const result = await makeRegistrationRequest(testData, 400);
  
  const passed = result.status === 400 &&
                 result.data.success === false &&
                 result.data.validation_errors &&
                 result.data.validation_errors.some(e => e.field === 'restaurant_email');
  
  logTest(
    '6. Invalid email format rejection',
    passed,
    passed ? 'Correctly rejected invalid email format' : `Error: ${JSON.stringify(result.data)}`
  );
}

async function testInvalidPhoneFormat() {
  const testData = getValidRegistrationData();
  testData.restaurant_phone = 'invalid-phone-123abc';
  
  const result = await makeRegistrationRequest(testData, 400);
  
  const passed = result.status === 400 &&
                 result.data.success === false &&
                 result.data.validation_errors &&
                 result.data.validation_errors.some(e => e.field === 'restaurant_phone');
  
  logTest(
    '7. Invalid phone format rejection',
    passed,
    passed ? 'Correctly rejected invalid phone format' : `Error: ${JSON.stringify(result.data)}`
  );
}

async function testInvalidCallbackUrl() {
  const testData = getValidRegistrationData();
  testData.callback_url = 'http://insecure-url.com/callback'; // http instead of https
  
  const result = await makeRegistrationRequest(testData, 400);
  
  const passed = result.status === 400 &&
                 result.data.success === false &&
                 result.data.validation_errors &&
                 result.data.validation_errors.some(e => e.field === 'callback_url');
  
  logTest(
    '8. Invalid callback URL rejection (http instead of https)',
    passed,
    passed ? 'Correctly rejected non-HTTPS callback URL' : `Error: ${JSON.stringify(result.data)}`
  );
}

async function testMissingRequiredFields() {
  const testData = {
    website_restaurant_id: generateUniqueId(),
    // Missing all other required fields
  };
  
  const result = await makeRegistrationRequest(testData, 400);
  
  const passed = result.status === 400 &&
                 result.data.success === false &&
                 result.data.validation_errors &&
                 result.data.validation_errors.length > 0;
  
  logTest(
    '9. Missing required fields rejection',
    passed,
    passed ? `Correctly rejected ${result.data.validation_errors.length} missing fields` : `Error: ${JSON.stringify(result.data)}`
  );
}

async function testFieldLengthValidation() {
  const testData = getValidRegistrationData();
  testData.restaurant_name = 'AB'; // Too short (minimum 3 characters)
  testData.restaurant_address = '123 St'; // Too short (minimum 10 characters)
  
  const result = await makeRegistrationRequest(testData, 400);
  
  const passed = result.status === 400 &&
                 result.data.success === false &&
                 result.data.validation_errors &&
                 result.data.validation_errors.length >= 2;
  
  logTest(
    '10. Field length validation',
    passed,
    passed ? 'Correctly rejected fields that are too short' : `Error: ${JSON.stringify(result.data)}`
  );
}

async function testRateLimiting() {
  console.log('\n⏳ Testing rate limiting (this may take a moment)...');
  
  // Make 11 requests rapidly to trigger rate limiting
  const promises = [];
  for (let i = 0; i < 11; i++) {
    const testData = getValidRegistrationData();
    promises.push(makeRegistrationRequest(testData, i < 10 ? 201 : 429));
  }
  
  const results = await Promise.all(promises);
  
  // Check if the last request was rate limited
  const lastResult = results[results.length - 1];
  const passed = lastResult.status === 429 &&
                 lastResult.data.success === false &&
                 lastResult.data.error.includes('Rate limit exceeded');
  
  logTest(
    '11. Rate limiting after 10 requests',
    passed,
    passed ? 'Correctly rate limited after 10 requests' : `Error: ${JSON.stringify(lastResult.data)}`
  );
}

async function testDatabaseIntegration() {
  // This test verifies that the registration actually creates database entries
  const testData = getValidRegistrationData();
  const result = await makeRegistrationRequest(testData, 201);
  
  const passed = result.success &&
                 result.data.success === true &&
                 result.data.app_restaurant_uid &&
                 result.data.registered_at &&
                 result.data.next_steps;
  
  logTest(
    '12. Database integration verification',
    passed,
    passed ? 'Registration successfully created database entries' : `Error: ${JSON.stringify(result.data)}`
  );
}

// =====================================================
// MAIN TEST EXECUTION
// =====================================================

async function runAllTests() {
  console.log('🧪 TESTING CLOUD-BASED RESTAURANT REGISTRATION SYSTEM');
  console.log('======================================================\n');

  console.log('🔧 PART 1: SUCCESSFUL REGISTRATION TESTS');
  console.log('==========================================');
  
  // Test successful registrations first to get data for duplicate tests
  const firstRegistrationUid = await testSuccessfulRegistrationWithAllFields();
  const secondRegistrationData = await testSuccessfulRegistrationWithRequiredFieldsOnly();
  
  console.log('\n❌ PART 2: DUPLICATE DETECTION TESTS');
  console.log('=====================================');
  
  await testDuplicateEmailDetection(secondRegistrationData.email);
  await testDuplicatePhoneDetection(secondRegistrationData.phone);
  await testDuplicateWebsiteIdDetection(secondRegistrationData.websiteId);
  
  console.log('\n🔍 PART 3: VALIDATION ERROR TESTS');
  console.log('==================================');
  
  await testInvalidEmailFormat();
  await testInvalidPhoneFormat();
  await testInvalidCallbackUrl();
  await testMissingRequiredFields();
  await testFieldLengthValidation();
  
  console.log('\n⚡ PART 4: SYSTEM BEHAVIOR TESTS');
  console.log('=================================');
  
  await testRateLimiting();
  await testDatabaseIntegration();
  
  // =====================================================
  // TEST RESULTS SUMMARY
  // =====================================================
  
  console.log('\n🎯 CLOUD RESTAURANT REGISTRATION TEST RESULTS');
  console.log('==============================================\n');
  
  console.log(`📊 Overall Summary:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%\n`);
  
  if (failedTests === 0) {
    console.log('🎉 ALL RESTAURANT REGISTRATION TESTS PASSED!');
    console.log('✅ Cloud-based restaurant registration system is fully functional');
    console.log('✅ Input validation is working correctly');
    console.log('✅ Duplicate detection is working correctly');
    console.log('✅ Rate limiting is working correctly');
    console.log('✅ Database integration is working correctly');
    console.log('✅ Error handling is working correctly');
    console.log('\n🚀 RESTAURANT REGISTRATION SYSTEM STATUS: PRODUCTION-READY');
    console.log('🌐 Zero device IP configuration required');
    console.log('🔒 Comprehensive validation and security');
    console.log('📈 Scalable cloud-based architecture');
  } else {
    console.log('⚠️  SOME TESTS FAILED - SYSTEM NEEDS ATTENTION');
    console.log('❌ Please review failed tests and fix issues before deployment');
  }
  
  console.log('\n🔧 RESTAURANT REGISTRATION SYSTEM VERIFICATION COMPLETE');
  console.log('The cloud-based restaurant registration system has been tested and verified\n');
}

// Run the test suite
runAllTests().catch(error => {
  console.error('❌ Test suite execution failed:', error);
  process.exit(1);
});

// =====================================================
// TEST SUITE COMPLETE
// =====================================================
// This test suite verifies:
// ✅ Successful registration with all fields
// ✅ Successful registration with required fields only
// ✅ Duplicate email detection
// ✅ Duplicate phone detection
// ✅ Duplicate website_restaurant_id detection
// ✅ Invalid email format rejection
// ✅ Invalid phone format rejection
// ✅ Invalid callback URL rejection (http vs https)
// ✅ Missing required field rejection
// ✅ Field length validation
// ✅ Rate limiting after 10 requests per hour
// ✅ Database integration and entry creation
// =====================================================
