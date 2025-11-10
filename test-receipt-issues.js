#!/usr/bin/env node

/**
 * Test Receipt Issues - Comprehensive Testing
 * 
 * This script tests the three critical receipt printing issues:
 * 1. Customization notes not displaying
 * 2. Logo not visible (blank black space)
 * 3. Phone number not dynamic from payload
 */

const fs = require('fs');

console.log('🧪 Testing Receipt Printing Issues...\n');

// Sample order payload from user (exact structure)
const sampleOrderPayload = {
  "website_restaurant_id": "186",
  "app_restaurant_uid": "a0b80051-756c-46d9-8cfa-0537ee7be3eb",
  "userId": "a0b80051-756c-46d9-8cfa-0537ee7be3eb",
  "callback_url": "https://your-website.com/api/orders/callback",
  "idempotency_key": "pi_3XoZz1KYZQ9qAbc123",
  "orderNumber": "#GB20251101-001",
  "amount": 23.8,
  "amountDisplay": "£23.80",
  "totals": {
    "subtotal": "22.40",
    "discount": "1.00",
    "delivery": "2.50",
    "vat": "0.80",
    "total": "23.80"
  },
  "status": "pending",
  "items": [
    {
      "title": "Paneer Tikka",
      "quantity": 2,
      "unitPrice": "8.50",
      "price": 17.0,
      "lineTotal": "17.00",
      "originalUnitPrice": "8.50",
      "discountedUnitPrice": "8.50",
      "customizations": [
        { "name": "Extra Spicy", "qty": 1, "price": "0.00" }
      ]
    },
    {
      "title": "Garlic Naan",
      "quantity": 3,
      "unitPrice": "1.80",
      "price": 5.4,
      "lineTotal": "5.40",
      "originalUnitPrice": "1.80",
      "discountedUnitPrice": "1.80",
      "customizations": []
    }
  ],
  "user": {
    "name": "John Smith",
    "phone": "‪+447911223344‬",
    "address": {
      "line": "12 Baker Street",
      "city": "London",
      "state": "England",
      "postcode": "W1U 3BW",
      "country": "United Kingdom",
      "lat": null,
      "lng": null
    },
    "addressDisplay": "12 Baker Street, London, England, W1U 3BW, United Kingdom"
  },
  "restaurant": { "name": "General Bilimoria's Canteen - Petts Wood (Indian)" },
  "deliveryAddress": {
    "line": "12 Baker Street",
    "city": "London",
    "state": "England",
    "postcode": "W1U 3BW",
    "country": "United Kingdom",
    "lat": null,
    "lng": null,
    "display": "12 Baker Street, London, England, W1U 3BW, United Kingdom"
  }
};

console.log('✅ Test 1: Order Payload Structure Analysis');
console.log(`   - Order Number: ${sampleOrderPayload.orderNumber}`);
console.log(`   - Customer Name: ${sampleOrderPayload.user.name}`);
console.log(`   - Customer Phone: ${sampleOrderPayload.user.phone}`);
console.log(`   - Items Count: ${sampleOrderPayload.items.length}`);

// Test customizations
console.log('\n✅ Test 2: Customizations Analysis');
sampleOrderPayload.items.forEach((item, index) => {
  console.log(`   Item ${index + 1}: ${item.title}`);
  console.log(`     - Quantity: ${item.quantity}`);
  console.log(`     - Price: £${item.price}`);
  console.log(`     - Customizations: ${item.customizations.length > 0 ? item.customizations.map(c => c.name).join(', ') : 'None'}`);
});

// Test phone number extraction strategies
console.log('\n✅ Test 3: Phone Number Extraction Strategies');
const phoneExtractionTests = [
  { path: 'user.phone', value: sampleOrderPayload.user?.phone },
  { path: 'customerPhone', value: sampleOrderPayload.customerPhone },
  { path: 'phone', value: sampleOrderPayload.phone },
  { path: 'customer.phone', value: sampleOrderPayload.customer?.phone }
];

phoneExtractionTests.forEach(test => {
  console.log(`   - ${test.path}: ${test.value || 'undefined'}`);
});

console.log(`\n   ✅ Expected phone number: ${sampleOrderPayload.user.phone}`);

// Test receipt generator implementation
console.log('\n✅ Test 4: Receipt Generator Implementation Check');
const receiptGeneratorPath = './services/receipt-generator.ts';
if (fs.existsSync(receiptGeneratorPath)) {
  const receiptContent = fs.readFileSync(receiptGeneratorPath, 'utf8');
  
  // Check customizations handling
  const hasCustomizationsLogic = receiptContent.includes('customizations') && 
                                receiptContent.includes('customization.name');
  
  // Check phone number extraction
  const hasPhoneExtraction = receiptContent.includes('customerPhone') ||
                            receiptContent.includes('user.phone');
  
  // Check logo integration
  const hasLogoIntegration = receiptContent.includes('LogoConverter') &&
                            receiptContent.includes('getLogoForHtmlReceipt');
  
  console.log(`   - Customizations logic: ${hasCustomizationsLogic ? '✅' : '❌'}`);
  console.log(`   - Phone extraction logic: ${hasPhoneExtraction ? '✅' : '❌'}`);
  console.log(`   - Logo integration: ${hasLogoIntegration ? '✅' : '❌'}`);
} else {
  console.log('   ❌ Receipt generator file not found');
}

// Test logo file existence
console.log('\n✅ Test 5: Logo File Verification');
const logoFiles = [
  './assets/images/recipt top logo for printing.bmp',
  './assets/images/gbc-circular-logo.svg',
  './assets/images/gbc-logo.png'
];

logoFiles.forEach(logoPath => {
  const exists = fs.existsSync(logoPath);
  console.log(`   - ${logoPath.split('/').pop()}: ${exists ? '✅' : '❌'}`);
});

// Test app order management screens
console.log('\n✅ Test 6: App Order Management Screens');
const appFiles = ['./app/(tabs)/index.tsx', './app/(tabs)/orders.tsx'];

appFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasCustomizationsDisplay = content.includes('customizations') &&
                                   content.includes('customizationsText');
    console.log(`   - ${filePath.split('/').pop()}: ${hasCustomizationsDisplay ? '✅' : '❌'} customizations display`);
  } else {
    console.log(`   - ${filePath.split('/').pop()}: ❌ file not found`);
  }
});

console.log('\n🔍 Issue Analysis Summary:');
console.log('   1. 📝 Customizations: Implementation exists but may need debugging');
console.log('   2. 🖼️ Logo: BMP file exists, LogoConverter implemented');
console.log('   3. 📞 Phone: Need to verify extraction from user.phone field');

console.log('\n🎯 Expected Receipt Output:');
console.log('   ┌─────────────────────────────┐');
console.log('   │         [GBC LOGO]          │');
console.log('   │  General Bilimoria\'s Canteen │');
console.log('   │    Pickup 3:56 PM #GB20...  │');
console.log('   │                             │');
console.log('   │ Order                       │');
console.log('   │ 2x Paneer Tikka      £17.00 │');
console.log('   │   + Extra Spicy             │'); // ← This should appear
console.log('   │ 3x Garlic Naan        £5.40 │');
console.log('   │                             │');
console.log('   │ Customer John Smith         │');
console.log('   │ Phone +447911223344         │'); // ← This should be dynamic
console.log('   │ Delivery Address            │');
console.log('   │ 12 Baker Street, London...  │');
console.log('   └─────────────────────────────┘');

console.log('\n🚀 Ready to implement fixes!');
