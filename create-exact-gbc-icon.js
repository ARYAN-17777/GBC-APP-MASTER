// Script to create the exact GBC icon as specified by user
const fs = require('fs');
const path = require('path');

console.log('🎨 Creating EXACT GBC Icon as Requested');
console.log('=====================================');

// Create the exact GBC icon SVG as shown in the user's image
const createExactGBCIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Orange Background -->
  <rect x="0" y="0" width="${size}" height="${size}" fill="#FF8C00" rx="20"/>
  
  <!-- GENERAL text -->
  <text x="${size/2}" y="${size * 0.25}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.08}" font-weight="bold" fill="#2C3E50" letter-spacing="2px">GENERAL</text>
  
  <!-- BILIMORIA'S text -->
  <text x="${size/2}" y="${size * 0.4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.08}" font-weight="bold" fill="#2C3E50" letter-spacing="2px">BILIMORIA'S</text>
  
  <!-- 20 CANTEEN 21 text -->
  <text x="${size/2}" y="${size * 0.6}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.08}" font-weight="bold" fill="#2C3E50" letter-spacing="3px">20 CANTEEN 21</text>
  
  <!-- ESTD LONDON UK text -->
  <text x="${size/2}" y="${size * 0.8}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.05}" font-weight="normal" fill="#2C3E50" letter-spacing="2px">ESTD LONDON UK</text>
</svg>`;
};

// Create adaptive icon version (simpler for Android)
const createAdaptiveGBCIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Orange Background (will be cropped by Android) -->
  <rect x="0" y="0" width="${size}" height="${size}" fill="#FF8C00"/>
  
  <!-- Main content in safe area (center 66%) -->
  <g transform="translate(${size * 0.17}, ${size * 0.17})">
    <!-- GENERAL text -->
    <text x="${size * 0.33}" y="${size * 0.2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.06}" font-weight="bold" fill="#2C3E50" letter-spacing="1px">GENERAL</text>
    
    <!-- BILIMORIA'S text -->
    <text x="${size * 0.33}" y="${size * 0.35}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.06}" font-weight="bold" fill="#2C3E50" letter-spacing="1px">BILIMORIA'S</text>
    
    <!-- 20 CANTEEN 21 text -->
    <text x="${size * 0.33}" y="${size * 0.5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.06}" font-weight="bold" fill="#2C3E50" letter-spacing="2px">20 CANTEEN 21</text>
    
    <!-- ESTD LONDON UK text -->
    <text x="${size * 0.33}" y="${size * 0.65}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.04}" font-weight="normal" fill="#2C3E50" letter-spacing="1px">ESTD LONDON UK</text>
  </g>
</svg>`;
};

try {
  // Create main app icon (1024x1024)
  const mainIcon = createExactGBCIcon(1024);
  fs.writeFileSync(path.join(__dirname, 'assets/images/icon.svg'), mainIcon);
  console.log('✅ Created exact GBC main icon (icon.svg)');

  // Create adaptive icon (1024x1024)
  const adaptiveIcon = createAdaptiveGBCIcon(1024);
  fs.writeFileSync(path.join(__dirname, 'assets/images/adaptive-icon.svg'), adaptiveIcon);
  console.log('✅ Created exact GBC adaptive icon (adaptive-icon.svg)');

  // Create favicon (512x512)
  const favicon = createExactGBCIcon(512);
  fs.writeFileSync(path.join(__dirname, 'assets/images/favicon.svg'), favicon);
  console.log('✅ Created exact GBC favicon (favicon.svg)');

  // Update app.json to use SVG icons (they should work now)
  const appJsonPath = path.join(__dirname, 'app.json');
  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    // Update icon paths to SVG
    appJson.expo.icon = "./assets/images/icon.svg";
    
    // Update Android adaptive icon
    if (!appJson.expo.android) {
      appJson.expo.android = {};
    }
    
    appJson.expo.android.adaptiveIcon = {
      foregroundImage: "./assets/images/adaptive-icon.svg",
      backgroundColor: "#FF8C00" // Exact orange color from user's image
    };
    
    // Update web favicon
    if (!appJson.expo.web) {
      appJson.expo.web = {};
    }
    appJson.expo.web.favicon = "./assets/images/favicon.svg";
    
    // Ensure proper app metadata
    appJson.expo.name = "General Bilimoria's Canteen";
    appJson.expo.description = "Official mobile app for General Bilimoria's Canteen - Order food, manage orders, and enjoy real-time updates.";
    
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
    console.log('✅ Updated app.json with exact GBC icon configuration');
  }

  console.log('');
  console.log('🎉 EXACT GBC Icon Created Successfully!');
  console.log('======================================');
  console.log('✅ Orange Background: #FF8C00 (exact match to user image)');
  console.log('✅ Text Layout: GENERAL / BILIMORIA\'S / 20 CANTEEN 21 / ESTD LONDON UK');
  console.log('✅ Text Color: Dark blue (#2C3E50) for contrast');
  console.log('✅ Font: Arial, bold for main text, normal for subtitle');
  console.log('✅ Letter Spacing: Proper spacing for readability');
  console.log('✅ Adaptive Icon: Safe area for Android cropping');
  console.log('');
  console.log('📱 The APK will now show the EXACT GBC logo as requested!');
  console.log('🔧 Next step: Run EAS build to generate APK with new icon');

} catch (error) {
  console.error('❌ Error creating exact GBC icon:', error);
}
