#!/usr/bin/env node

/**
 * GBC Canteen - Project Validation Script
 * Validates project configuration and readiness for APK build
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 GBC Canteen - Project Validation');
console.log('=====================================\n');

let errors = [];
let warnings = [];
let success = [];

// Helper function to check if file exists
function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    success.push(`✅ ${description}: Found`);
    return true;
  } else {
    errors.push(`❌ ${description}: Missing (${filePath})`);
    return false;
  }
}

// Helper function to check directory
function checkDirectory(dirPath, description) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    success.push(`✅ ${description}: Found`);
    return true;
  } else {
    errors.push(`❌ ${description}: Missing (${dirPath})`);
    return false;
  }
}

// 1. Check core configuration files
console.log('📋 Checking Core Configuration...');
checkFile('package.json', 'Package Configuration');
checkFile('app.json', 'Expo Configuration');
checkFile('eas.json', 'EAS Build Configuration');
checkFile('tsconfig.json', 'TypeScript Configuration');

// 2. Check essential app files
console.log('\n📱 Checking App Structure...');
checkFile('app/_layout.tsx', 'Root Layout');
checkFile('app/index.tsx', 'Main Entry Point');
checkDirectory('app/screens', 'Screens Directory');
checkDirectory('app/components', 'Components Directory');

// 3. Check assets
console.log('\n🖼️ Checking Assets...');
checkFile('assets/images/icon.png', 'App Icon');
checkFile('assets/images/splash.png', 'Splash Screen');
checkFile('assets/images/adaptive-icon.png', 'Adaptive Icon');

// 4. Check thermal printer implementation
console.log('\n🖨️ Checking Thermal Printer...');
checkFile('utils/thermalPrinter.ts', 'Thermal Printer Service');
checkFile('utils/escPosCommands.ts', 'ESC/POS Commands');
checkFile('utils/bitmapRenderer.ts', 'Bitmap Renderer');
checkFile('utils/printerModule.ts', 'Printer Module');

// 5. Check auto-refresh service
console.log('\n🔄 Checking Auto-Refresh...');
checkFile('services/auto-refresh-service.ts', 'Auto-Refresh Service');

// 6. Check package.json content
console.log('\n📦 Validating Dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check essential dependencies
  const requiredDeps = [
    'expo',
    'react',
    'react-native',
    'expo-router',
    'react-native-printer-imin',
    '@supabase/supabase-js'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      success.push(`✅ Dependency: ${dep} (${packageJson.dependencies[dep]})`);
    } else {
      errors.push(`❌ Missing dependency: ${dep}`);
    }
  });
  
  // Check build scripts
  const requiredScripts = ['build:preview', 'build:prod', 'pre-build-check'];
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      success.push(`✅ Build Script: ${script}`);
    } else {
      warnings.push(`⚠️ Missing script: ${script}`);
    }
  });
  
} catch (error) {
  errors.push(`❌ Error reading package.json: ${error.message}`);
}

// 7. Check app.json content
console.log('\n⚙️ Validating App Configuration...');
try {
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  
  if (appJson.expo) {
    const expo = appJson.expo;
    
    // Check essential fields
    if (expo.name) success.push(`✅ App Name: ${expo.name}`);
    else errors.push('❌ Missing app name');
    
    if (expo.version) success.push(`✅ App Version: ${expo.version}`);
    else errors.push('❌ Missing app version');
    
    if (expo.android && expo.android.package) {
      success.push(`✅ Android Package: ${expo.android.package}`);
    } else {
      errors.push('❌ Missing Android package name');
    }
    
    // Check permissions
    if (expo.android && expo.android.permissions) {
      const permissions = expo.android.permissions;
      const requiredPerms = ['BLUETOOTH', 'BLUETOOTH_ADMIN', 'BLUETOOTH_CONNECT'];
      
      requiredPerms.forEach(perm => {
        if (permissions.includes(perm)) {
          success.push(`✅ Permission: ${perm}`);
        } else {
          warnings.push(`⚠️ Missing permission: ${perm}`);
        }
      });
    }
  }
} catch (error) {
  errors.push(`❌ Error reading app.json: ${error.message}`);
}

// 8. Check eas.json content
console.log('\n🚀 Validating EAS Configuration...');
try {
  const easJson = JSON.parse(fs.readFileSync('eas.json', 'utf8'));
  
  if (easJson.build) {
    const profiles = ['development', 'preview', 'production'];
    profiles.forEach(profile => {
      if (easJson.build[profile]) {
        success.push(`✅ EAS Profile: ${profile}`);
        
        // Check Android configuration
        if (easJson.build[profile].android) {
          success.push(`✅ Android Config: ${profile}`);
        }
      } else {
        warnings.push(`⚠️ Missing EAS profile: ${profile}`);
      }
    });
  }
} catch (error) {
  errors.push(`❌ Error reading eas.json: ${error.message}`);
}

// 9. Check node_modules
console.log('\n📚 Checking Dependencies Installation...');
if (checkDirectory('node_modules', 'Node Modules')) {
  // Check specific important modules
  const importantModules = [
    'expo',
    'react',
    'react-native',
    'react-native-printer-imin',
    '@supabase/supabase-js'
  ];
  
  importantModules.forEach(module => {
    if (fs.existsSync(path.join('node_modules', module))) {
      success.push(`✅ Module Installed: ${module}`);
    } else {
      errors.push(`❌ Module Missing: ${module}`);
    }
  });
}

// 10. Final validation summary
console.log('\n' + '='.repeat(50));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(50));

if (success.length > 0) {
  console.log('\n✅ SUCCESSFUL CHECKS:');
  success.forEach(item => console.log(`  ${item}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️ WARNINGS:');
  warnings.forEach(item => console.log(`  ${item}`));
}

if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(item => console.log(`  ${item}`));
}

console.log('\n' + '='.repeat(50));

if (errors.length === 0) {
  console.log('🎉 PROJECT VALIDATION: PASSED');
  console.log('✅ Your project is ready for APK build!');
  console.log('\nNext steps:');
  console.log('1. Run: npm install (if node_modules missing)');
  console.log('2. Run: eas login');
  console.log('3. Run: npm run build:preview');
  console.log('\n🚀 Happy building!');
  process.exit(0);
} else {
  console.log('❌ PROJECT VALIDATION: FAILED');
  console.log(`Found ${errors.length} error(s) that need to be fixed.`);
  console.log('\nPlease fix the errors above before building APK.');
  process.exit(1);
}
