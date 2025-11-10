const fs = require('fs');
const path = require('path');

// Fix TypeScript error in receipt generator
const receiptPath = path.join(__dirname, 'services', 'receipt-generator.ts');
let content = fs.readFileSync(receiptPath, 'utf8');

// Fix the TypeScript error by adding type assertion
content = content.replace(
  '        name: item.title || item.name || \'Unknown Item\',',
  '        name: item.title || (item as any).name || \'Unknown Item\','
);

fs.writeFileSync(receiptPath, content, 'utf8');

console.log('✅ Fixed TypeScript error in receipt generator');

// Verify the change
const updatedContent = fs.readFileSync(receiptPath, 'utf8');
const lines = updatedContent.split('\n');
console.log('Line 39:', lines[38]); // Array is 0-indexed
