const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Receipt Customizations Issue - V2');
console.log('=' .repeat(50));

// Fix orders.tsx to handle both title and name fields
const ordersPath = path.join(__dirname, 'app', '(tabs)', 'orders.tsx');
let ordersContent = fs.readFileSync(ordersPath, 'utf8');

// Fix all instances of item name mapping
ordersContent = ordersContent.replace(
  /name: item\.title,/g,
  'name: item.title || item.name || \'Unknown Item\','
);

fs.writeFileSync(ordersPath, ordersContent, 'utf8');
console.log('✅ Fixed orders.tsx item name mapping');

// Fix index.tsx as well
const indexPath = path.join(__dirname, 'app', '(tabs)', 'index.tsx');
let indexContent = fs.readFileSync(indexPath, 'utf8');

indexContent = indexContent.replace(
  /name: item\.title,/g,
  'name: item.title || item.name || \'Unknown Item\','
);

fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('✅ Fixed index.tsx item name mapping');

// Also fix the receipt generator to handle both title and name
const receiptPath = path.join(__dirname, 'services', 'receipt-generator.ts');
let receiptContent = fs.readFileSync(receiptPath, 'utf8');

// Fix the processNewPayload function
receiptContent = receiptContent.replace(
  /name: item\.title,/g,
  'name: item.title || item.name || \'Unknown Item\','
);

fs.writeFileSync(receiptPath, receiptContent, 'utf8');
console.log('✅ Fixed receipt generator item name mapping');

console.log('');
console.log('🎯 Changes Made:');
console.log('1. Updated item name mapping to handle both "title" and "name" fields');
console.log('2. Added fallback to "Unknown Item" if neither field exists');
console.log('3. Applied fix to orders.tsx, index.tsx, and receipt-generator.ts');

console.log('');
console.log('🔍 This should fix the "Unknown Item" issue in receipts');
console.log('📋 Customizations should now appear correctly below each item');
