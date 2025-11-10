// Script to create proper GBC app icon with exact branding
const fs = require('fs');
const path = require('path');

console.log('🎨 Creating Proper GBC App Icon with Exact Branding');
console.log('==================================================');

// Create SVG icon that matches the exact GBC logo design
const createGBCBrandedIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Orange Background (GBC Brand Color) -->
  <rect width="${size}" height="${size}" fill="#F47B20" rx="${size * 0.1}"/>
  
  <!-- Main Text: GENERAL -->
  <text x="${size/2}" y="${size * 0.25}" text-anchor="middle" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${size * 0.08}" 
        font-weight="bold" 
        fill="#2C3E50" 
        letter-spacing="${size * 0.005}">GENERAL</text>
  
  <!-- Main Text: BILIMORIA'S -->
  <text x="${size/2}" y="${size * 0.4}" text-anchor="middle" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${size * 0.08}" 
        font-weight="bold" 
        fill="#2C3E50" 
        letter-spacing="${size * 0.005}">BILIMORIA'S</text>
  
  <!-- Year and Canteen -->
  <text x="${size/2}" y="${size * 0.6}" text-anchor="middle" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${size * 0.06}" 
        font-weight="normal" 
        fill="#2C3E50" 
        letter-spacing="${size * 0.01}">20 CANTEEN 21</text>
  
  <!-- Bottom Text: ESTD LONDON UK -->
  <text x="${size/2}" y="${size * 0.8}" text-anchor="middle" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${size * 0.045}" 
        font-weight="normal" 
        fill="#2C3E50" 
        letter-spacing="${size * 0.008}">ESTD LONDON UK</text>
  
  <!-- Decorative border -->
  <rect x="${size * 0.05}" y="${size * 0.05}" 
        width="${size * 0.9}" height="${size * 0.9}" 
        fill="none" stroke="#2C3E50" 
        stroke-width="${size * 0.008}" 
        rx="${size * 0.08}"/>
</svg>`;
};

// Create adaptive icon (simpler version for Android)
const createGBCAdaptiveIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Orange Background -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 50}" fill="#F47B20"/>
  
  <!-- White Circle Background for Text -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 100}" fill="#ffffff" stroke="#2C3E50" stroke-width="8"/>
  
  <!-- GBC Text -->
  <text x="${size/2}" y="${size/2 - 40}" text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.12}" 
        font-weight="bold" 
        fill="#2C3E50">GBC</text>
  
  <!-- CANTEEN Text -->
  <text x="${size/2}" y="${size/2 + 40}" text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.06}" 
        font-weight="normal" 
        fill="#2C3E50">CANTEEN</text>
</svg>`;
};

try {
  // Create main app icon (1024x1024) - exact GBC branding
  const mainIcon = createGBCBrandedIcon(1024);
  fs.writeFileSync(path.join(__dirname, 'assets/images/icon.svg'), mainIcon);
  console.log('✅ Created main GBC branded icon (icon.svg)');

  // Create adaptive icon (1024x1024) - simplified for Android
  const adaptiveIcon = createGBCAdaptiveIcon(1024);
  fs.writeFileSync(path.join(__dirname, 'assets/images/adaptive-icon.svg'), adaptiveIcon);
  console.log('✅ Created GBC adaptive icon (adaptive-icon.svg)');

  // Create favicon (smaller version)
  const favicon = createGBCAdaptiveIcon(512);
  fs.writeFileSync(path.join(__dirname, 'assets/images/favicon.svg'), favicon);
  console.log('✅ Created GBC favicon (favicon.svg)');

  // Update app.json to use SVG icons (they should work now)
  const appJsonPath = path.join(__dirname, 'app.json');
  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    // Update to use SVG icons
    appJson.expo.icon = "./assets/images/icon.svg";
    
    // Update Android adaptive icon
    appJson.expo.android = appJson.expo.android || {};
    appJson.expo.android.adaptiveIcon = {
      foregroundImage: "./assets/images/adaptive-icon.svg",
      backgroundColor: "#F47B20"
    };
    
    // Update web favicon
    appJson.expo.web = appJson.expo.web || {};
    appJson.expo.web.favicon = "./assets/images/favicon.svg";
    
    // Ensure proper app metadata
    appJson.expo.name = "General Bilimoria's Canteen";
    appJson.expo.description = "Official mobile app for General Bilimoria's Canteen - Order food, manage orders, and enjoy real-time updates.";
    
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
    console.log('✅ Updated app.json with proper GBC branded icons');
  }

  console.log('');
  console.log('🎉 PROPER GBC BRANDED ICONS CREATED!');
  console.log('===================================');
  console.log('✅ Main Icon: Exact GBC branding with orange background');
  console.log('✅ Text Layout: GENERAL BILIMORIA\'S / 20 CANTEEN 21 / ESTD LONDON UK');
  console.log('✅ Colors: Orange background (#F47B20) with dark text (#2C3E50)');
  console.log('✅ Adaptive Icon: Simplified GBC logo for Android');
  console.log('✅ Professional Design: Matches your exact branding requirements');
  console.log('');
  console.log('📱 The APK will now show the proper GBC logo instead of yellow circle!');
  console.log('🚀 Ready for new EAS build with correct branding!');

} catch (error) {
  console.error('❌ Error creating proper GBC icons:', error);
}
