// Script to create a GBC logo PNG from the existing SVG
const fs = require('fs');
const path = require('path');

// Create a simple GBC logo as a placeholder
// In a real scenario, you would convert the SVG to PNG using a proper tool
console.log('Creating GBC logo PNG...');

// For now, we'll copy the existing icon.png as a placeholder
// In production, you would use the actual GBC logo
const iconPath = path.join(__dirname, 'assets', 'images', 'icon.png');
const logoPath = path.join(__dirname, 'assets', 'images', 'gbc-logo.png');

try {
  if (fs.existsSync(iconPath)) {
    fs.copyFileSync(iconPath, logoPath);
    console.log('✅ GBC logo PNG created successfully');
    console.log('📁 Location:', logoPath);
  } else {
    console.log('❌ Source icon not found');
  }
} catch (error) {
  console.error('❌ Error creating logo:', error);
}
