const fs = require('fs');
const path = require('path');

console.log('🔧 Removing Old Project ID and Owner');
console.log('=' .repeat(40));

// Read current app.json
const appJsonPath = path.join(__dirname, 'app.json');
const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Remove the old project ID and owner
if (appConfig.expo.extra && appConfig.expo.extra.eas) {
  delete appConfig.expo.extra.eas.projectId;
  console.log('✅ Removed old project ID');
}

if (appConfig.expo.owner) {
  delete appConfig.expo.owner;
  console.log('✅ Removed old owner');
}

// Write updated config
fs.writeFileSync(appJsonPath, JSON.stringify(appConfig, null, 2), 'utf8');

console.log('✅ Updated app.json - ready for new project creation');
console.log('🎯 Now can create new EAS project under new account');
