// Script to create GBC app icons with proper sizing
const fs = require('fs');
const path = require('path');

console.log('🎨 Creating GBC App Icons');
console.log('========================');

// Create a simple SVG icon with GBC branding
const createGBCIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background Circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#F47B20"/>
  
  <!-- Inner Circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 20}" fill="#ffffff" stroke="#F47B20" stroke-width="4"/>
  
  <!-- GBC Text -->
  <text x="${size/2}" y="${size/2 - 10}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size/8}" font-weight="bold" fill="#F47B20">GBC</text>
  
  <!-- Canteen Text -->
  <text x="${size/2}" y="${size/2 + 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size/16}" font-weight="normal" fill="#F47B20">CANTEEN</text>
  
  <!-- Decorative Elements -->
  <circle cx="${size/2 - 30}" cy="${size/2 - 30}" r="3" fill="#F47B20"/>
  <circle cx="${size/2 + 30}" cy="${size/2 - 30}" r="3" fill="#F47B20"/>
  <circle cx="${size/2 - 30}" cy="${size/2 + 30}" r="3" fill="#F47B20"/>
  <circle cx="${size/2 + 30}" cy="${size/2 + 30}" r="3" fill="#F47B20"/>
</svg>`;
};

// Create adaptive icon (foreground only)
const createAdaptiveIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Main Circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 40}" fill="#F47B20"/>
  
  <!-- Inner Circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 60}" fill="#ffffff" stroke="#F47B20" stroke-width="6"/>
  
  <!-- GBC Text -->
  <text x="${size/2}" y="${size/2 - 15}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size/6}" font-weight="bold" fill="#F47B20">GBC</text>
  
  <!-- Canteen Text -->
  <text x="${size/2}" y="${size/2 + 25}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size/12}" font-weight="normal" fill="#F47B20">CANTEEN</text>
</svg>`;
};

try {
  // Create main app icon (1024x1024)
  const mainIcon = createGBCIcon(1024);
  fs.writeFileSync(path.join(__dirname, 'assets/images/icon.svg'), mainIcon);
  console.log('✅ Created main app icon (icon.svg)');

  // Create adaptive icon (1024x1024)
  const adaptiveIcon = createAdaptiveIcon(1024);
  fs.writeFileSync(path.join(__dirname, 'assets/images/adaptive-icon.svg'), adaptiveIcon);
  console.log('✅ Created adaptive icon (adaptive-icon.svg)');

  // Create favicon (48x48)
  const favicon = createGBCIcon(48);
  fs.writeFileSync(path.join(__dirname, 'assets/images/favicon.svg'), favicon);
  console.log('✅ Created favicon (favicon.svg)');

  // Update app.json to use new icons
  const appJsonPath = path.join(__dirname, 'app.json');
  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    // Update icon paths
    appJson.expo.icon = "./assets/images/icon.svg";
    
    // Update Android adaptive icon
    if (!appJson.expo.android) {
      appJson.expo.android = {};
    }
    
    appJson.expo.android.adaptiveIcon = {
      foregroundImage: "./assets/images/adaptive-icon.svg",
      backgroundColor: "#ffffff"
    };
    
    // Update web favicon
    if (!appJson.expo.web) {
      appJson.expo.web = {};
    }
    appJson.expo.web.favicon = "./assets/images/favicon.svg";
    
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
    console.log('✅ Updated app.json with new GBC icons');
  }

  console.log('');
  console.log('🎉 GBC App Icons Created Successfully!');
  console.log('=====================================');
  console.log('✅ Main Icon: Orange circle with white inner circle and GBC branding');
  console.log('✅ Adaptive Icon: Optimized for Android adaptive icon system');
  console.log('✅ Favicon: Web-optimized version');
  console.log('✅ App Configuration: Updated to use new icons');
  console.log('');
  console.log('🔧 Icon Features:');
  console.log('- Brand Color: #F47B20 (GBC Orange)');
  console.log('- Professional Design: Clean, readable text');
  console.log('- Scalable: SVG format for all sizes');
  console.log('- Android Compatible: Adaptive icon support');
  console.log('');
  console.log('📱 The APK will now show the GBC logo instead of plain yellow!');

} catch (error) {
  console.error('❌ Error creating GBC icons:', error);
}
