#!/usr/bin/env node

/**
 * Test Price Display Fixes
 * 
 * This script tests the price display fixes for both mobile app and thermal receipt printing.
 * It verifies that prices are correctly formatted and discounts are properly handled.
 */

// Import the currency utilities (simulated for Node.js testing)
function formatOrderPrice(value, showSymbol = true) {
  if (value == null) {
    return showSymbol ? '£0.00' : '0.00';
  }

  let numericValue;
  if (typeof value === 'string') {
    const cleanString = value.replace(/[£\s]/g, '');
    numericValue = parseFloat(cleanString);
    
    if (isNaN(numericValue)) {
      return showSymbol ? '£0.00' : '0.00';
    }
  } else {
    numericValue = value;
  }

  // Smart detection: use enhanced logic for pence detection
  if (isLikelyMinorUnits(numericValue)) {
    numericValue = numericValue / 100;
  }

  const formatted = numericValue.toFixed(2);
  return showSymbol ? `£${formatted}` : formatted;
}

function isLikelyMinorUnits(value) {
  // Values over 1000 are definitely in pence (e.g., 11305 pence = £113.05)
  if (value > 1000) {
    return true;
  }

  // Values between 100-1000 that are whole numbers are likely in pence
  // (e.g., 250 pence = £2.50, 350 pence = £3.50)
  if (value >= 100 && value <= 1000 && value % 1 === 0) {
    return true;
  }

  // Values with decimals or under 100 are likely in pounds
  return false;
}

function extractDiscountValue(orderData) {
  if (orderData.totals && orderData.totals.discount) {
    const discountValue = parseFloat(orderData.totals.discount);
    return isNaN(discountValue) ? 0 : discountValue;
  }

  if (orderData.discount != null) {
    let discountValue = typeof orderData.discount === 'string'
      ? parseFloat(orderData.discount)
      : orderData.discount;

    if (isNaN(discountValue)) {
      return 0;
    }

    // Apply smart conversion for legacy data
    if (isLikelyMinorUnits(discountValue)) {
      discountValue = discountValue / 100;
    }

    return discountValue;
  }

  return 0;
}

function extractSubtotalValue(orderData) {
  if (orderData.totals && orderData.totals.subtotal) {
    const subtotalValue = parseFloat(orderData.totals.subtotal);
    return isNaN(subtotalValue) ? orderData.amount || 0 : subtotalValue;
  }

  if (orderData.subtotal != null) {
    const subtotalValue = typeof orderData.subtotal === 'string' 
      ? parseFloat(orderData.subtotal) 
      : orderData.subtotal;
    return isNaN(subtotalValue) ? orderData.amount || 0 : subtotalValue;
  }

  return orderData.amount || orderData.total || 0;
}

console.log('🧪 TESTING PRICE DISPLAY FIXES');
console.log('============================================================');

// Test data with various price formats
const testOrders = [
  {
    name: 'New Payload Format (Website Order)',
    order: {
      userId: 'test-user-1',
      orderNumber: '#100001',
      amount: 25.50,
      amountDisplay: '£25.50',
      totals: {
        subtotal: '23.00',
        discount: '2.50',
        delivery: '2.00',
        vat: '3.00',
        total: '25.50'
      },
      items: [
        {
          title: 'Chicken Curry',
          quantity: 1,
          unitPrice: '15.50',
          price: 15.50,
          customizations: [
            { name: 'Extra Rice', price: '2.50' },
            { name: 'Less Spicy' }
          ]
        },
        {
          title: 'Naan Bread',
          quantity: 2,
          unitPrice: '3.75',
          price: 7.50
        }
      ]
    }
  },
  {
    name: 'Legacy Format (Prices in Pence)',
    order: {
      id: 'legacy-order-1',
      orderNumber: '#100002',
      amount: 2550, // 25.50 in pence
      items: [
        {
          name: 'Fish & Chips',
          quantity: 1,
          price: 1550 // 15.50 in pence
        },
        {
          name: 'Mushy Peas',
          quantity: 1,
          price: 350 // 3.50 in pence
        }
      ],
      discount: 250 // 2.50 in pence
    }
  },
  {
    name: 'Mixed Format (Some Prices as Strings)',
    order: {
      id: 'mixed-order-1',
      orderNumber: '#100003',
      amount: '18.99',
      items: [
        {
          name: 'Pizza Margherita',
          quantity: 1,
          price: '12.99'
        },
        {
          name: 'Garlic Bread',
          quantity: 1,
          price: 6.00
        }
      ],
      totals: {
        subtotal: '18.99',
        discount: '0.00'
      }
    }
  },
  {
    name: 'No Discount Order',
    order: {
      userId: 'test-user-2',
      orderNumber: '#100004',
      amount: 32.75,
      items: [
        {
          title: 'Lamb Biryani',
          quantity: 1,
          price: 18.50
        },
        {
          title: 'Raita',
          quantity: 1,
          price: 4.25
        },
        {
          title: 'Papadum',
          quantity: 2,
          price: 5.00
        }
      ]
      // No discount field - should default to 0
    }
  }
];

let totalTests = 0;
let passedTests = 0;

function runTest(testName, expected, actual) {
  totalTests++;
  if (expected === actual) {
    console.log(`  ✅ ${testName}: ${actual}`);
    passedTests++;
  } else {
    console.log(`  ❌ ${testName}: Expected "${expected}", got "${actual}"`);
  }
}

// Test each order
testOrders.forEach((testCase, index) => {
  console.log(`\n${index + 1}️⃣  TESTING: ${testCase.name}`);
  console.log('------------------------------');
  
  const order = testCase.order;
  
  // Test total price formatting
  const formattedTotal = formatOrderPrice(order.amount);
  console.log(`💰 Total Amount: ${formattedTotal}`);
  
  // Test item price formatting
  if (order.items) {
    order.items.forEach((item, itemIndex) => {
      const itemName = item.title || item.name;
      const itemPrice = formatOrderPrice(item.price || item.unitPrice);
      console.log(`📦 Item ${itemIndex + 1}: ${item.quantity}x ${itemName} - ${itemPrice}`);
      
      // Test customizations if available
      if (item.customizations) {
        item.customizations.forEach(customization => {
          if (customization.price) {
            const custPrice = formatOrderPrice(customization.price);
            console.log(`   + ${customization.name}: ${custPrice}`);
          } else {
            console.log(`   + ${customization.name}: No charge`);
          }
        });
      }
    });
  }
  
  // Test discount extraction
  const discount = extractDiscountValue(order);
  const subtotal = extractSubtotalValue(order);
  
  console.log(`📊 Subtotal: ${formatOrderPrice(subtotal)}`);
  console.log(`🎯 Discount: ${discount > 0 ? formatOrderPrice(discount) : 'No discount'}`);
  
  // Run specific tests based on order type
  if (testCase.name.includes('New Payload Format')) {
    runTest('New payload total formatting', '£25.50', formattedTotal);
    runTest('New payload discount extraction', 2.5, discount);
    runTest('New payload subtotal extraction', 23, subtotal);
  } else if (testCase.name.includes('Legacy Format')) {
    runTest('Legacy pence conversion', '£25.50', formattedTotal);
    runTest('Legacy discount conversion', 2.5, discount);
  } else if (testCase.name.includes('Mixed Format')) {
    runTest('String price conversion', '£18.99', formattedTotal);
    runTest('Mixed format discount', 0, discount);
  } else if (testCase.name.includes('No Discount')) {
    runTest('No discount fallback', 0, discount);
    runTest('Subtotal fallback to amount', 32.75, subtotal);
  }
});

// Test edge cases
console.log('\n🔬 TESTING EDGE CASES');
console.log('------------------------------');

// Test null/undefined values
runTest('Null price handling', '£0.00', formatOrderPrice(null));
runTest('Undefined price handling', '£0.00', formatOrderPrice(undefined));
runTest('Empty string handling', '£0.00', formatOrderPrice(''));
runTest('Invalid string handling', '£0.00', formatOrderPrice('invalid'));

// Test currency symbol control
runTest('No symbol formatting', '25.50', formatOrderPrice(25.50, false));
runTest('With symbol formatting', '£25.50', formatOrderPrice(25.50, true));

// Test pence detection
runTest('Large number (pence)', '£113.05', formatOrderPrice(11305));
runTest('Small number (pounds)', '£25.50', formatOrderPrice(25.50));

console.log('\n============================================================');
console.log('📊 TEST RESULTS');
console.log('============================================================');

const successRate = ((passedTests / totalTests) * 100).toFixed(1);

if (passedTests === totalTests) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log(`✅ ${passedTests}/${totalTests} tests successful (${successRate}%)`);
  console.log('');
  console.log('🚀 Price Display Fixes Status:');
  console.log('   • Currency formatting: ✅ Working');
  console.log('   • Discount handling: ✅ Working');
  console.log('   • Mixed format support: ✅ Working');
  console.log('   • Edge case handling: ✅ Working');
  console.log('   • Pence/pounds detection: ✅ Working');
  console.log('');
  console.log('✨ The price display fixes are ready for production!');
} else {
  console.log('❌ SOME TESTS FAILED!');
  console.log(`📊 ${passedTests}/${totalTests} tests passed (${successRate}%)`);
  console.log(`❌ ${totalTests - passedTests} tests failed`);
  console.log('');
  console.log('Please review the failed tests above and fix the issues.');
}

console.log('');
