const fs = require('fs');
const path = require('path');

// Debug script to test receipt customizations
console.log('🔍 Debugging Receipt Customizations');
console.log('=' .repeat(50));

// Test order with customizations
const testOrder = {
  id: 'test-customizations-' + Date.now(),
  orderNumber: '#TEST001',
  status: 'pending',
  amount: 25.99,
  currency: 'GBP',
  user: { name: 'Test Customer' },
  items: [
    {
      title: 'Chicken Biryani',
      quantity: 2,
      price: 12.99,
      customizations: [
        { name: 'Extra Spicy', qty: 1 },
        { name: 'No Onions', qty: 1 }
      ]
    },
    {
      title: 'Garlic Naan',
      quantity: 1,
      price: 3.50,
      customizations: [
        { name: 'Extra Garlic', qty: 1 }
      ]
    }
  ],
  createdAt: new Date().toISOString()
};

console.log('📋 Test Order Data:');
console.log(JSON.stringify(testOrder, null, 2));

console.log('');
console.log('🔧 Checking Receipt Generator Implementation...');

// Read the receipt generator file
const receiptGeneratorPath = path.join(__dirname, 'services', 'receipt-generator.ts');
const receiptContent = fs.readFileSync(receiptGeneratorPath, 'utf8');

// Check if customizations logic exists
const hasCustomizationsLogic = receiptContent.includes('item.customizations && item.customizations.length > 0');
console.log('✅ Customizations logic exists:', hasCustomizationsLogic);

// Check the exact customization rendering code
const customizationMatch = receiptContent.match(/if \(item\.customizations.*?\}/gs);
if (customizationMatch) {
  console.log('📝 Customization rendering code found:');
  console.log(customizationMatch[0]);
} else {
  console.log('❌ Customization rendering code not found');
}

console.log('');
console.log('🔧 Checking Order Mapping in orders.tsx...');

// Read the orders.tsx file
const ordersPath = path.join(__dirname, 'app', '(tabs)', 'orders.tsx');
const ordersContent = fs.readFileSync(ordersPath, 'utf8');

// Check if customizations are being mapped
const hasCustomizationsMapping = ordersContent.includes('customizations: (item as any).customizations || []');
console.log('✅ Customizations mapping exists:', hasCustomizationsMapping);

console.log('');
console.log('🎯 Expected Receipt Output:');
console.log('2× Chicken Biryani                £12.99');
console.log('  + Extra Spicy');
console.log('  + No Onions');
console.log('1× Garlic Naan                     £3.50');
console.log('  + Extra Garlic');

console.log('');
console.log('🔍 Potential Issues to Check:');
console.log('1. Order data structure - are customizations in the correct format?');
console.log('2. Type casting - is (item as any).customizations working?');
console.log('3. Receipt generator input - is the mapped data reaching the generator?');
console.log('4. HTML rendering - are the customizations being rendered in the HTML?');

console.log('');
console.log('💡 Next Steps:');
console.log('1. Add console.log to receipt generator to debug input data');
console.log('2. Check actual order data structure in Supabase');
console.log('3. Verify customizations array format matches interface');
console.log('4. Test with a real order that has customizations');
