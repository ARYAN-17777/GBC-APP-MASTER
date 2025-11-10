const fs = require('fs');
const path = require('path');

// Fix the specific line in receipt generator
const receiptPath = path.join(__dirname, 'services', 'receipt-generator.ts');
let content = fs.readFileSync(receiptPath, 'utf8');

// Replace the specific line
content = content.replace(
  '        name: item.title,',
  '        name: item.title || item.name || \'Unknown Item\','
);

fs.writeFileSync(receiptPath, content, 'utf8');

console.log('✅ Fixed receipt generator item name mapping');

// Verify the change
const updatedContent = fs.readFileSync(receiptPath, 'utf8');
const lines = updatedContent.split('\n');
console.log('Line 39:', lines[38]); // Array is 0-indexed
