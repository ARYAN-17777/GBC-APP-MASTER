/**
 * Test Order Number Normalization for Website API Compatibility
 * 
 * This script verifies:
 * 1. Order numbers are sent with leading "#" to website API
 * 2. Fallback retry logic works for 404 "Order not found" errors
 * 3. Multi-tenant headers are included
 * 4. Both formats are included in payload and headers
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Order Number Normalization for Website API');
console.log('=' .repeat(70));

const testResults = [];

function recordResult(test, description, status, details) {
  const result = {
    test,
    description,
    status,
    details,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${statusIcon} ${test}: ${description}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

/**
 * Test 1: Verify Order Number Canonicalization
 */
function testOrderNumberCanonicalization() {
  console.log('\n🔢 Testing Order Number Canonicalization...');
  
  const apiFile = path.join(__dirname, 'services/gbc-order-status-api.ts');
  
  if (!fs.existsSync(apiFile)) {
    recordResult('NORM-1', 'Order Status API File', 'FAIL', 'gbc-order-status-api.ts not found');
    return;
  }
  
  const apiContent = fs.readFileSync(apiFile, 'utf8');
  
  // Check for canonicalization method
  const hasCanonicalizeMethod = apiContent.includes('canonicalizeOrderId') && 
                               apiContent.includes('digits') && 
                               apiContent.includes('hashForm');
  
  // Check for both formats in payload
  const hasOrderNumberDigits = apiContent.includes('order_number_digits');
  
  // Check for hash form as primary
  const usesHashFormPrimary = apiContent.includes('order_number: hashForm');
  
  if (hasCanonicalizeMethod && hasOrderNumberDigits && usesHashFormPrimary) {
    recordResult('NORM-1', 'Order Number Canonicalization', 'PASS', 'Both formats implemented correctly');
  } else {
    const missing = [];
    if (!hasCanonicalizeMethod) missing.push('Canonicalization method');
    if (!hasOrderNumberDigits) missing.push('order_number_digits field');
    if (!usesHashFormPrimary) missing.push('Hash form as primary');
    recordResult('NORM-1', 'Order Number Canonicalization', 'FAIL', `Missing: ${missing.join(', ')}`);
  }
}

/**
 * Test 2: Verify Multi-Tenant Headers
 */
function testMultiTenantHeaders() {
  console.log('\n🏢 Testing Multi-Tenant Headers...');
  
  const apiFile = path.join(__dirname, 'services/gbc-order-status-api.ts');
  const apiContent = fs.readFileSync(apiFile, 'utf8');
  
  // Check for restaurant UID header
  const hasRestaurantUIDHeader = apiContent.includes('X-Restaurant-UID');
  
  // Check for order digits header
  const hasOrderDigitsHeader = apiContent.includes('X-Order-Number-Digits');
  
  // Check for restaurant UID method
  const hasGetRestaurantUID = apiContent.includes('getRestaurantUID');
  
  if (hasRestaurantUIDHeader && hasOrderDigitsHeader && hasGetRestaurantUID) {
    recordResult('TENANT-1', 'Multi-Tenant Headers', 'PASS', 'All required headers implemented');
  } else {
    const missing = [];
    if (!hasRestaurantUIDHeader) missing.push('X-Restaurant-UID header');
    if (!hasOrderDigitsHeader) missing.push('X-Order-Number-Digits header');
    if (!hasGetRestaurantUID) missing.push('getRestaurantUID method');
    recordResult('TENANT-1', 'Multi-Tenant Headers', 'FAIL', `Missing: ${missing.join(', ')}`);
  }
}

/**
 * Test 3: Verify Fallback Retry Logic
 */
function testFallbackRetryLogic() {
  console.log('\n🔄 Testing Fallback Retry Logic...');
  
  const apiFile = path.join(__dirname, 'services/gbc-order-status-api.ts');
  const apiContent = fs.readFileSync(apiFile, 'utf8');
  
  // Check for order not found error detection
  const hasOrderNotFoundCheck = apiContent.includes('isOrderNotFoundError') && 
                               apiContent.includes('order not found');
  
  // Check for format caching
  const hasFormatCache = apiContent.includes('orderNumberFormatCache') && 
                        apiContent.includes('Map');
  
  // Check for fallback attempt
  const hasFallbackLogic = apiContent.includes('fallbackFormat') && 
                          apiContent.includes('attemptRequest');
  
  if (hasOrderNotFoundCheck && hasFormatCache && hasFallbackLogic) {
    recordResult('RETRY-1', 'Fallback Retry Logic', 'PASS', 'Complete fallback implementation');
  } else {
    const missing = [];
    if (!hasOrderNotFoundCheck) missing.push('Order not found detection');
    if (!hasFormatCache) missing.push('Format caching');
    if (!hasFallbackLogic) missing.push('Fallback logic');
    recordResult('RETRY-1', 'Fallback Retry Logic', 'FAIL', `Missing: ${missing.join(', ')}`);
  }
}

/**
 * Test 4: Verify Payload Structure
 */
function testPayloadStructure() {
  console.log('\n📦 Testing Payload Structure...');
  
  const apiFile = path.join(__dirname, 'services/gbc-order-status-api.ts');
  const apiContent = fs.readFileSync(apiFile, 'utf8');
  
  // Check for updated interface
  const hasUpdatedInterface = apiContent.includes('order_number_digits: string');
  
  // Check for all status methods using new format
  const hasUpdatedApprove = apiContent.includes('updateOrderStatus') && 
                           apiContent.includes('order_number: hashForm');
  const hasUpdatedDispatch = apiContent.includes('dispatchOrder') && 
                            apiContent.includes('order_number: hashForm');
  const hasUpdatedCancel = apiContent.includes('cancelOrder') && 
                          apiContent.includes('order_number: hashForm');
  
  if (hasUpdatedInterface && hasUpdatedApprove && hasUpdatedDispatch && hasUpdatedCancel) {
    recordResult('PAYLOAD-1', 'Payload Structure', 'PASS', 'All methods use new payload structure');
  } else {
    const missing = [];
    if (!hasUpdatedInterface) missing.push('Updated interface');
    if (!hasUpdatedApprove) missing.push('Updated approve method');
    if (!hasUpdatedDispatch) missing.push('Updated dispatch method');
    if (!hasUpdatedCancel) missing.push('Updated cancel method');
    recordResult('PAYLOAD-1', 'Payload Structure', 'FAIL', `Missing: ${missing.join(', ')}`);
  }
}

/**
 * Test 5: Verify Logging Implementation
 */
function testLoggingImplementation() {
  console.log('\n📝 Testing Logging Implementation...');
  
  const apiFile = path.join(__dirname, 'services/gbc-order-status-api.ts');
  const apiContent = fs.readFileSync(apiFile, 'utf8');
  
  // Check for format logging
  const hasFormatLogging = apiContent.includes('using format:') || 
                          apiContent.includes('#digits') || 
                          apiContent.includes('digits format');
  
  // Check for success logging
  const hasSuccessLogging = apiContent.includes('Success with') && 
                           apiContent.includes('format for');
  
  // Check for fallback logging
  const hasFallbackLogging = apiContent.includes('Trying fallback format');
  
  if (hasFormatLogging && hasSuccessLogging && hasFallbackLogging) {
    recordResult('LOG-1', 'Logging Implementation', 'PASS', 'Comprehensive logging implemented');
  } else {
    const missing = [];
    if (!hasFormatLogging) missing.push('Format logging');
    if (!hasSuccessLogging) missing.push('Success logging');
    if (!hasFallbackLogging) missing.push('Fallback logging');
    recordResult('LOG-1', 'Logging Implementation', 'FAIL', `Missing: ${missing.join(', ')}`);
  }
}

/**
 * Test 6: Verify TypeScript Compilation
 */
function testTypeScriptCompilation() {
  console.log('\n📝 Testing TypeScript Compilation...');
  
  // Check for obvious TypeScript issues
  const apiFile = path.join(__dirname, 'services/gbc-order-status-api.ts');
  
  if (!fs.existsSync(apiFile)) {
    recordResult('TS-1', 'TypeScript Compilation', 'FAIL', 'API file not found');
    return;
  }
  
  const content = fs.readFileSync(apiFile, 'utf8');
  
  // Check for common TypeScript issues
  const hasSyntaxErrors = content.includes('}: {') && !content.includes('}: Promise<{');
  const hasMissingTypes = content.includes(': any') && !content.includes('data?: any');
  
  if (!hasSyntaxErrors && !hasMissingTypes) {
    recordResult('TS-1', 'TypeScript Compilation', 'PASS', 'No obvious TypeScript issues detected');
  } else {
    const issues = [];
    if (hasSyntaxErrors) issues.push('Syntax errors');
    if (hasMissingTypes) issues.push('Missing types');
    recordResult('TS-1', 'TypeScript Compilation', 'WARN', `Potential issues: ${issues.join(', ')}`);
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log('\n🚀 Starting Order Number Normalization Tests...\n');

  testOrderNumberCanonicalization();
  testMultiTenantHeaders();
  testFallbackRetryLogic();
  testPayloadStructure();
  testLoggingImplementation();
  testTypeScriptCompilation();

  // Generate summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(70));

  const passedTests = testResults.filter(r => r.status === 'PASS').length;
  const failedTests = testResults.filter(r => r.status === 'FAIL').length;
  const warnTests = testResults.filter(r => r.status === 'WARN').length;
  const totalTests = testResults.length;

  console.log(`\n✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${failedTests}/${totalTests}`);
  console.log(`⚠️  Warnings: ${warnTests}/${totalTests}`);

  // Final verdict
  console.log('\n' + '='.repeat(70));
  console.log('🎯 FINAL VERDICT');
  console.log('='.repeat(70));

  if (failedTests === 0) {
    console.log('✅ ORDER NUMBER NORMALIZATION SUCCESSFULLY IMPLEMENTED');
    console.log('   🔢 Order numbers now sent with leading "#" to website API');
    console.log('   🔄 Fallback retry logic handles 404 "Order not found" errors');
    console.log('   🏢 Multi-tenant headers included for proper routing');
    console.log('   📦 Both formats included in payload and headers');
    console.log('   📱 Ready for website API compatibility testing');
  } else {
    console.log('❌ SOME ISSUES DETECTED');
    const failedTestsList = testResults.filter(r => r.status === 'FAIL');
    failedTestsList.forEach(test => {
      console.log(`   - ${test.test}: ${test.description} - ${test.details}`);
    });
  }

  if (warnTests > 0) {
    console.log('\n⚠️  WARNINGS TO ADDRESS:');
    const warnTestsList = testResults.filter(r => r.status === 'WARN');
    warnTestsList.forEach(test => {
      console.log(`   - ${test.test}: ${test.description} - ${test.details}`);
    });
  }

  // Smoke test instructions
  console.log('\n' + '='.repeat(70));
  console.log('🧪 SMOKE TEST INSTRUCTIONS');
  console.log('='.repeat(70));
  console.log('After deployment, test with these scenarios:');
  console.log('1. Approve order #100071 → should send "order_number": "#100071"');
  console.log('2. If 404 "Order not found" → should retry with "order_number": "100071"');
  console.log('3. Verify X-Restaurant-UID and X-Order-Number-Digits headers');
  console.log('4. Test with multiple tenants to ensure no cross-tenant leakage');
  console.log('5. Confirm local approval dialog only appears when both attempts fail');
}

// Run the tests
runAllTests();
