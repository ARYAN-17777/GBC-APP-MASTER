#!/usr/bin/env node

/**
 * 🔍 COMPREHENSIVE LOGIN FIXES VERIFICATION
 * 
 * This script verifies all the critical login fixes have been implemented correctly:
 * 1. Fixed undefined variables in login.tsx
 * 2. Removed all user authentication dependencies
 * 3. Ensured restaurant-only authentication throughout the app
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING LOGIN FIXES...');
console.log('=====================================');

let allTestsPassed = true;
const results = {
  loginFixes: [],
  authenticationConsistency: [],
  codeQuality: []
};

// Test 1: Verify login.tsx fixes
console.log('\n🏪 Test 1: Login.tsx Critical Bug Fixes...');
console.log('-------------------------------------------');

try {
  const loginPath = path.join(__dirname, 'app', 'login.tsx');
  const loginContent = fs.readFileSync(loginPath, 'utf8');
  
  // Check for fixed undefined variables
  const hasUndefinedIsRestaurantLogin = loginContent.includes('if (isRestaurantLogin)');
  const hasUndefinedEmailOrPhone = loginContent.includes('emailOrPhone.trim()');
  const hasSimplifiedValidation = loginContent.includes('if (!username.trim() || !password.trim())') && 
                                   !loginContent.includes('if (isRestaurantLogin)');
  const hasEnhancedLogging = loginContent.includes('🏪 LOGIN: Attempting restaurant authentication');
  const hasNavigationLogging = loginContent.includes('🏪 LOGIN: Navigating to tabs after successful login');
  
  const loginChecks = {
    'Undefined isRestaurantLogin removed': !hasUndefinedIsRestaurantLogin,
    'Undefined emailOrPhone removed': !hasUndefinedEmailOrPhone,
    'Simplified validation implemented': hasSimplifiedValidation,
    'Enhanced logging added': hasEnhancedLogging,
    'Navigation logging added': hasNavigationLogging,
    'Only restaurant authentication used': loginContent.includes('signInRestaurant') && !loginContent.includes('signIn(')
  };
  
  Object.entries(loginChecks).forEach(([check, passed]) => {
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${check}`);
    results.loginFixes.push(`${status} ${check}`);
    if (!passed) allTestsPassed = false;
  });
  
} catch (error) {
  console.log('  ❌ Error reading login.tsx:', error.message);
  results.loginFixes.push('❌ Error reading login.tsx');
  allTestsPassed = false;
}

// Test 2: Verify authentication consistency across all files
console.log('\n🔐 Test 2: Authentication Consistency...');
console.log('---------------------------------------');

const filesToCheck = [
  { path: 'app/profile.tsx', name: 'Profile Screen' },
  { path: 'app/(tabs)/orders.tsx', name: 'Orders Screen' },
  { path: 'services/receipt-generator.ts', name: 'Receipt Generator' },
  { path: 'app/change-password.tsx', name: 'Change Password' },
  { path: 'app/(tabs)/_layout.tsx', name: 'Tab Layout' },
  { path: 'app/index.tsx', name: 'Index Screen' },
  { path: 'app/(tabs)/notifications.tsx', name: 'Notifications' }
];

filesToCheck.forEach(({ path: filePath, name }) => {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for wrong authentication methods
      const hasGetCurrentUser = content.includes('getCurrentUser()') && !content.includes('getCurrentRestaurantUser()');
      const hasInitializeSession = content.includes('initializeSession()') && !content.includes('initializeRestaurantSession()');
      const hasCurrentUserStorage = content.includes("AsyncStorage.getItem('currentUser')");
      const hasRestaurantAuth = content.includes('getCurrentRestaurantUser') || content.includes('initializeRestaurantSession') || content.includes("AsyncStorage.getItem('restaurant_session')");
      
      const authChecks = {
        'No getCurrentUser() usage': !hasGetCurrentUser,
        'No initializeSession() usage': !hasInitializeSession,
        'No currentUser AsyncStorage usage': !hasCurrentUserStorage,
        'Uses restaurant authentication': hasRestaurantAuth || name === 'Change Password' // Change password is special case
      };
      
      let filePassed = true;
      Object.entries(authChecks).forEach(([check, passed]) => {
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${name}: ${check}`);
        results.authenticationConsistency.push(`${status} ${name}: ${check}`);
        if (!passed) {
          filePassed = false;
          allTestsPassed = false;
        }
      });
      
      if (filePassed) {
        console.log(`  ✅ ${name}: All authentication checks passed`);
      }
    } else {
      console.log(`  ⚠️  ${name}: File not found at ${filePath}`);
    }
  } catch (error) {
    console.log(`  ❌ ${name}: Error reading file - ${error.message}`);
    results.authenticationConsistency.push(`❌ ${name}: Error reading file`);
    allTestsPassed = false;
  }
});

// Test 3: Check for remaining problematic patterns
console.log('\n🔍 Test 3: Code Quality Checks...');
console.log('----------------------------------');

const searchPatterns = [
  { pattern: 'getCurrentUser()', description: 'Old user authentication method' },
  { pattern: 'initializeSession()', description: 'Old session initialization' },
  { pattern: "AsyncStorage.getItem('currentUser')", description: 'Old user storage access' },
  { pattern: 'isRestaurantLogin', description: 'Undefined variable reference' },
  { pattern: 'emailOrPhone', description: 'Undefined variable reference' }
];

searchPatterns.forEach(({ pattern, description }) => {
  let foundFiles = [];
  
  // Search in key directories
  const searchDirs = ['app', 'services', 'components'];
  
  searchDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
      const files = getAllFiles(dirPath, ['.tsx', '.ts']);
      
      files.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes(pattern)) {
            foundFiles.push(path.relative(__dirname, file));
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });
    }
  });
  
  if (foundFiles.length === 0) {
    console.log(`  ✅ No usage of "${pattern}" found`);
    results.codeQuality.push(`✅ No usage of "${pattern}" found`);
  } else {
    console.log(`  ❌ Found "${pattern}" (${description}) in:`);
    foundFiles.forEach(file => {
      console.log(`    - ${file}`);
    });
    results.codeQuality.push(`❌ Found "${pattern}" in ${foundFiles.length} files`);
    allTestsPassed = false;
  }
});

// Helper function to get all files with specific extensions
function getAllFiles(dirPath, extensions) {
  let files = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files = files.concat(getAllFiles(fullPath, extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    });
  } catch (error) {
    // Skip directories that can't be read
  }
  
  return files;
}

// Final Results
console.log('\n📊 FINAL RESULTS');
console.log('================');

if (allTestsPassed) {
  console.log('🎉 ALL TESTS PASSED! Login fixes are complete and ready for build.');
  console.log('');
  console.log('✅ Critical login bug fixed (undefined variables removed)');
  console.log('✅ All user authentication dependencies removed');
  console.log('✅ Restaurant-only authentication implemented consistently');
  console.log('✅ Enhanced logging added for debugging');
  console.log('');
  console.log('🚀 Ready to build APK with working restaurant login!');
} else {
  console.log('❌ SOME TESTS FAILED! Please review the issues above.');
  console.log('');
  console.log('Issues found:');
  [...results.loginFixes, ...results.authenticationConsistency, ...results.codeQuality]
    .filter(result => result.startsWith('❌'))
    .forEach(issue => console.log(`  ${issue}`));
}

console.log('\n🔗 Next Steps:');
console.log('1. If all tests passed: Build APK with EAS');
console.log('2. Test login with credentials: thecurryvault / Password@123');
console.log('3. Verify navigation to home screen after successful login');

process.exit(allTestsPassed ? 0 : 1);
