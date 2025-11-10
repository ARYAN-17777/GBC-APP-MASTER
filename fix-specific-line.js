const fs = require('fs');
const path = require('path');

// Fix the specific line in orders.tsx
const ordersPath = path.join(__dirname, 'app', '(tabs)', 'orders.tsx');
let content = fs.readFileSync(ordersPath, 'utf8');

// Replace the specific line 163
content = content.replace(
  '              name: item.title,',
  '              name: item.title || item.name || \'Unknown Item\','
);

fs.writeFileSync(ordersPath, content, 'utf8');

console.log('✅ Fixed line 163 in orders.tsx');

// Verify the change
const updatedContent = fs.readFileSync(ordersPath, 'utf8');
const lines = updatedContent.split('\n');
console.log('Line 163:', lines[162]); // Array is 0-indexed
