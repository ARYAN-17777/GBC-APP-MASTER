const fs = require('fs');
const path = require('path');

console.log('🔧 Updating Project Configuration for New Account');
console.log('=' .repeat(50));

// Read current app.json
const appJsonPath = path.join(__dirname, 'app.json');
const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Update the slug for new account
const oldSlug = appConfig.expo.slug;
const newSlug = 'gbc-kitchen-app-v2';

console.log(`📱 Updating project slug: ${oldSlug} → ${newSlug}`);

appConfig.expo.slug = newSlug;
appConfig.expo.version = '1.0.0'; // Reset version for new project

// Write updated config
fs.writeFileSync(appJsonPath, JSON.stringify(appConfig, null, 2), 'utf8');

console.log('✅ Updated app.json configuration');
console.log('📋 New Configuration:');
console.log(`   - Name: ${appConfig.expo.name}`);
console.log(`   - Slug: ${appConfig.expo.slug}`);
console.log(`   - Version: ${appConfig.expo.version}`);
console.log(`   - Package: ${appConfig.expo.android.package}`);

console.log('');
console.log('🎯 Next Steps:');
console.log('1. Create new EAS project');
console.log('2. Configure build credentials');
console.log('3. Start APK build');
