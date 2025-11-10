const fs = require('fs');
const path = require('path');

// Add debugging to receipt generator
const receiptPath = path.join(__dirname, 'services', 'receipt-generator.ts');
let content = fs.readFileSync(receiptPath, 'utf8');

// Add debugging at the start of generateThermalReceiptHTML function
const debugCode = `
    // DEBUG: Log order data to check customizations
    console.log('🧾 Receipt Generator - Order Data:', JSON.stringify(order, null, 2));
    console.log('🧾 Receipt Generator - Items with customizations:');
    order.items.forEach((item, index) => {
      console.log(\`Item \${index + 1}: \${item.name}\`);
      console.log(\`  Customizations:\`, item.customizations);
      console.log(\`  Has customizations:\`, !!(item.customizations && item.customizations.length > 0));
    });
`;

// Find the generateThermalReceiptHTML function and add debugging
const functionStart = 'private generateThermalReceiptHTML(order: Order, format: \'png\' | \'pdf\', restaurantName?: string): string {';
const insertPoint = content.indexOf(functionStart);

if (insertPoint !== -1) {
  const functionStartEnd = insertPoint + functionStart.length;
  content = content.slice(0, functionStartEnd) + debugCode + content.slice(functionStartEnd);
  
  fs.writeFileSync(receiptPath, content, 'utf8');
  console.log('✅ Added debugging to generateThermalReceiptHTML function');
  console.log('🔍 Debug logs will show order data and customizations when receipt HTML is generated');
} else {
  console.log('❌ Could not find generateThermalReceiptHTML function');
  console.log('Looking for:', functionStart);
}
