const { createClient } = require('@supabase/supabase-js');

// Test receipt customizations by sending a real order
async function testReceiptCustomizations() {
  console.log('🧪 Testing Receipt Customizations with Real Order');
  console.log('=' .repeat(60));

  // Create test order with customizations
  const testOrder = {
    id: 'test-receipt-' + Date.now(),
    orderNumber: '#RECEIPT001',
    status: 'pending',
    amount: 28.98,
    currency: 'GBP',
    user: { 
      name: 'Receipt Test Customer',
      email: 'test@example.com',
      phone: '442033195035'
    },
    items: [
      {
        title: 'Chicken Biryani',
        quantity: 2,
        price: 12.99,
        unitPrice: '12.99',
        lineTotal: '25.98',
        customizations: [
          { name: 'Extra Spicy', qty: 1, price: '0.00' },
          { name: 'No Onions', qty: 1, price: '0.00' }
        ]
      },
      {
        title: 'Mango Lassi',
        quantity: 1,
        price: 3.00,
        unitPrice: '3.00',
        lineTotal: '3.00',
        customizations: [
          { name: 'Extra Sweet', qty: 1, price: '0.00' }
        ]
      }
    ],
    totals: {
      subtotal: 28.98,
      discount: 0,
      delivery: 0,
      vat: 0,
      total: 28.98
    },
    amountDisplay: '£28.98',
    customerName: 'Receipt Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '442033195035',
    deliveryAddress: 'Test Address, United Kingdom',
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString()
  };

  console.log('📋 Test Order with Customizations:');
  console.log(JSON.stringify(testOrder, null, 2));

  console.log('');
  console.log('🎯 Expected Receipt Output:');
  console.log('2× Chicken Biryani                £12.99');
  console.log('  + Extra Spicy');
  console.log('  + No Onions');
  console.log('1× Mango Lassi                     £3.00');
  console.log('  + Extra Sweet');

  console.log('');
  console.log('🔍 Key Points to Verify:');
  console.log('1. Customizations array is properly formatted');
  console.log('2. Each customization has name, qty, and price fields');
  console.log('3. Receipt generator receives the customizations data');
  console.log('4. HTML template renders customizations with proper indentation');

  console.log('');
  console.log('📝 To test this order:');
  console.log('1. Send this order to the /api/orders/receive endpoint');
  console.log('2. Check the app logs for receipt generator debug output');
  console.log('3. Print the receipt and verify customizations appear');
  console.log('4. Look for debug logs showing customizations data');

  // Create a curl command for testing
  const curlCommand = `curl -X POST http://localhost:8081/api/orders/receive \\
  -H "Content-Type: application/json" \\
  -H "X-Restaurant-UID: your-restaurant-uid" \\
  -d '${JSON.stringify(testOrder)}'`;

  console.log('');
  console.log('🚀 Test Command:');
  console.log(curlCommand);

  return testOrder;
}

testReceiptCustomizations();
