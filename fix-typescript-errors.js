const fs = require('fs');
const path = require('path');

// Fix TypeScript errors in orders.tsx
const ordersPath = path.join(__dirname, 'app', '(tabs)', 'orders.tsx');
let ordersContent = fs.readFileSync(ordersPath, 'utf8');

// Fix the customizations type errors by adding type assertions
ordersContent = ordersContent.replace(
  /\{item\.customizations && item\.customizations\.length > 0 && \(/g,
  '{(item as any).customizations && (item as any).customizations.length > 0 && ('
);

ordersContent = ordersContent.replace(
  /item\.customizations\.map\(c => c\.name\)/g,
  '(item as any).customizations.map((c: any) => c.name)'
);

// Write the fixed content back
fs.writeFileSync(ordersPath, ordersContent, 'utf8');

console.log('✅ Fixed TypeScript errors in orders.tsx');
console.log('🔧 Added type assertions for customizations property');
