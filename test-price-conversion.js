/**
 * Test Price Conversion Logic
 * 
 * This script tests the price conversion logic to ensure:
 * 1. New payload format (decimal prices) are handled correctly
 * 2. Legacy test orders (prices in cents) are converted properly
 * 3. Edge cases are handled appropriately
 */

console.log('🧪 Testing Price Conversion Logic');
console.log('=================================\n');

// Helper function to convert price from cents to pounds if needed
const convertPrice = (price) => {
  if (typeof price === 'string') {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof price === 'number') {
    // If price is greater than 100 and no decimal places, it's likely in cents
    if (price > 100 && price % 1 === 0) {
      return price / 100;
    }
    return price;
  }
  return 0;
};

// Test cases
const testCases = [
  // New payload format (already in pounds)
  { input: 13.00, expected: 13.00, description: 'New payload decimal price (£13.00)' },
  { input: 3.50, expected: 3.50, description: 'New payload decimal price (£3.50)' },
  { input: '13.00', expected: 13.00, description: 'New payload string price (£13.00)' },
  { input: '3.50', expected: 3.50, description: 'New payload string price (£3.50)' },
  
  // Legacy test orders (prices in cents)
  { input: 1300, expected: 13.00, description: 'Legacy test order price in cents (1300 → £13.00)' },
  { input: 350, expected: 3.50, description: 'Legacy test order price in cents (350 → £3.50)' },
  { input: 1250, expected: 12.50, description: 'Legacy test order price in cents (1250 → £12.50)' },
  { input: 850, expected: 8.50, description: 'Legacy test order price in cents (850 → £8.50)' },
  
  // Edge cases
  { input: 0, expected: 0, description: 'Zero price' },
  { input: 50, expected: 50, description: 'Small price (£50.00 - not converted)' },
  { input: 99, expected: 99, description: 'Price under 100 (£99.00 - not converted)' },
  { input: 100, expected: 100, description: 'Exactly 100 (£100.00 - not converted)' },
  { input: 101, expected: 1.01, description: 'Just over 100 (101 → £1.01)' },
  { input: null, expected: 0, description: 'Null price' },
  { input: undefined, expected: 0, description: 'Undefined price' },
  { input: '', expected: 0, description: 'Empty string price' },
  { input: 'invalid', expected: 0, description: 'Invalid string price' },
];

// Run tests
let passedTests = 0;
let totalTests = testCases.length;

console.log('Running price conversion tests...\n');

testCases.forEach((testCase, index) => {
  const result = convertPrice(testCase.input);
  const passed = Math.abs(result - testCase.expected) < 0.001; // Allow for floating point precision
  
  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`  Input: ${JSON.stringify(testCase.input)}`);
  console.log(`  Expected: £${testCase.expected.toFixed(2)}`);
  console.log(`  Result: £${result.toFixed(2)}`);
  console.log(`  Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('');
  
  if (passed) {
    passedTests++;
  }
});

// Test with sample order data
console.log('🧪 Testing with Sample Order Data');
console.log('=================================\n');

// Sample new payload order (from website)
const newPayloadOrder = {
  orderNumber: '#WEB001',
  amount: 25.50,
  amountDisplay: '£25.50',
  totals: {
    subtotal: '23.00',
    discount: '2.00',
    delivery: '1.50',
    vat: '3.00',
    total: '25.50'
  },
  items: [
    {
      title: 'Chicken Makhani',
      quantity: 1,
      price: 13.00,
      unitPrice: '13.00',
      unitPriceMinor: 1300
    },
    {
      title: 'Garlic Naan',
      quantity: 1,
      price: 3.50,
      unitPrice: '3.50',
      unitPriceMinor: 350
    }
  ]
};

// Sample legacy test order (from test scripts)
const legacyTestOrder = {
  orderNumber: 'BUTTON-TEST-001',
  amount: 1250, // $12.50 in cents
  items: [
    {
      title: 'Test Burger',
      quantity: 1,
      price: 1250 // in cents
    }
  ]
};

console.log('1️⃣ New Payload Order (from website):');
console.log(`   Order Total: ${newPayloadOrder.amount} → £${convertPrice(newPayloadOrder.amount).toFixed(2)}`);
newPayloadOrder.items.forEach((item, index) => {
  console.log(`   Item ${index + 1}: ${item.title}`);
  console.log(`     Price: ${item.price} → £${convertPrice(item.price).toFixed(2)}`);
  console.log(`     Unit Price: ${item.unitPrice} → £${convertPrice(item.unitPrice).toFixed(2)}`);
});

console.log('\n2️⃣ Legacy Test Order (from test scripts):');
console.log(`   Order Total: ${legacyTestOrder.amount} → £${convertPrice(legacyTestOrder.amount).toFixed(2)}`);
legacyTestOrder.items.forEach((item, index) => {
  console.log(`   Item ${index + 1}: ${item.title}`);
  console.log(`     Price: ${item.price} → £${convertPrice(item.price).toFixed(2)}`);
});

// Summary
console.log('\n📊 Test Summary');
console.log('===============');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 All tests passed! Price conversion logic is working correctly.');
  console.log('\n✅ Expected Results:');
  console.log('   - New payload prices (£13.00, £3.50) remain unchanged');
  console.log('   - Legacy test prices (1300, 350) convert to £13.00, £3.50');
  console.log('   - Edge cases handled appropriately');
} else {
  console.log('\n❌ Some tests failed. Please review the conversion logic.');
}

console.log('\n🔧 Next Steps:');
console.log('1. Test the app with existing test orders to see if prices display correctly');
console.log('2. Send a new order from the website using the /api/orders/receive endpoint');
console.log('3. Verify that both legacy and new orders show correct prices');
console.log('4. Check receipt printing to ensure prices are formatted properly');
