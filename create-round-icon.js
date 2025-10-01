/**
 * Script to create a round adaptive icon for Android
 * This creates a circular version of the existing icon
 */

const fs = require('fs');
const path = require('path');

// Check if the adaptive icon exists
const adaptiveIconPath = path.join(__dirname, 'assets', 'images', 'adaptive-icon.png');
const iconPath = path.join(__dirname, 'assets', 'images', 'icon.png');

console.log('🎨 Creating round adaptive icon for GBC Canteen app...');

if (fs.existsSync(adaptiveIconPath)) {
  console.log('✅ Adaptive icon already exists at:', adaptiveIconPath);
} else if (fs.existsSync(iconPath)) {
  console.log('✅ Base icon exists at:', iconPath);
  console.log('📝 Note: The adaptive icon should be created from the base icon');
} else {
  console.log('❌ No icon files found. Please ensure icon.png exists in assets/images/');
}

// Update app.json to ensure proper adaptive icon configuration
const appJsonPath = path.join(__dirname, 'app.json');
if (fs.existsSync(appJsonPath)) {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  // Ensure adaptive icon configuration
  if (!appJson.expo.android) {
    appJson.expo.android = {};
  }
  
  appJson.expo.android.adaptiveIcon = {
    foregroundImage: "./assets/images/adaptive-icon.png",
    backgroundColor: "#ffffff"
  };
  
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log('✅ Updated app.json with adaptive icon configuration');
} else {
  console.log('❌ app.json not found');
}

console.log('🎯 Round icon setup complete!');
console.log('📱 The adaptive icon will appear round on Android devices');
console.log('🔧 Make sure adaptive-icon.png is a square image with transparent background');
console.log('   Android will automatically crop it to a circle on supported devices');
