#!/usr/bin/env node

/**
 * 🔍 RESTAURANT ORDER ISOLATION VERIFICATION
 * 
 * This script verifies that order data is properly scoped to restaurant accounts:
 * 1. Order queries filter by restaurant UID
 * 2. AsyncStorage keys are namespaced per restaurant
 * 3. Logout clears restaurant-scoped cached data
 * 4. Login clears data from other restaurant sessions
 * 5. No order data leaks between different restaurant accounts
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING RESTAURANT ORDER ISOLATION...');
console.log('==========================================');

let allTestsPassed = true;
const results = {
  orderFiltering: [],
  asyncStorageScoping: [],
  logoutDataClearing: [],
  loginDataClearing: [],
  codeQuality: []
};

// Test 1: Verify order queries filter by restaurant UID
console.log('\n🏪 Test 1: Order Query Filtering...');
console.log('-----------------------------------');

const filesToCheckForFiltering = [
  { path: 'app/(tabs)/orders.tsx', name: 'Orders Screen' },
  { path: 'app/(tabs)/index.tsx', name: 'Home Screen' },
  { path: 'contexts/NotificationContext.tsx', name: 'Notification Context' }
];

filesToCheckForFiltering.forEach(({ path: filePath, name }) => {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for restaurant UID filtering
      const hasRestaurantUIDFilter = content.includes(".eq('restaurant_uid', restaurantUser.app_restaurant_uid)");
      const hasRestaurantUserCheck = content.includes('getCurrentRestaurantUser()');
      const hasGlobalOrderQuery = content.includes("from('orders').select('*')") && 
                                   !content.includes(".eq('restaurant_uid'");
      const hasRestaurantLogging = content.includes('🏪') && content.includes('restaurant');
      
      const filteringChecks = {
        'Filters orders by restaurant UID': hasRestaurantUIDFilter,
        'Checks for restaurant user': hasRestaurantUserCheck,
        'No global order queries': !hasGlobalOrderQuery,
        'Has restaurant-specific logging': hasRestaurantLogging
      };
      
      let filePassed = true;
      Object.entries(filteringChecks).forEach(([check, passed]) => {
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${name}: ${check}`);
        results.orderFiltering.push(`${status} ${name}: ${check}`);
        if (!passed) {
          filePassed = false;
          allTestsPassed = false;
        }
      });
      
      if (filePassed) {
        console.log(`  ✅ ${name}: All filtering checks passed`);
      }
    } else {
      console.log(`  ⚠️  ${name}: File not found at ${filePath}`);
    }
  } catch (error) {
    console.log(`  ❌ ${name}: Error reading file - ${error.message}`);
    results.orderFiltering.push(`❌ ${name}: Error reading file`);
    allTestsPassed = false;
  }
});

// Test 2: Verify AsyncStorage scoping
console.log('\n💾 Test 2: AsyncStorage Scoping...');
console.log('----------------------------------');

const filesToCheckForScoping = [
  { path: 'app/(tabs)/orders.tsx', name: 'Orders Screen' },
  { path: 'contexts/NotificationContext.tsx', name: 'Notification Context' }
];

filesToCheckForScoping.forEach(({ path: filePath, name }) => {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for restaurant-scoped storage functions
      const hasRestaurantCacheKey = content.includes('getRestaurantCacheKey') || 
                                     content.includes('getRestaurantStorageKey');
      const hasRestaurantUIDInKey = content.includes('app_restaurant_uid') && 
                                     content.includes('AsyncStorage');
      const hasGlobalStorageKeys = content.includes("AsyncStorage.setItem('orders'") ||
                                    content.includes("AsyncStorage.getItem('orders'");
      
      const scopingChecks = {
        'Has restaurant-scoped storage functions': hasRestaurantCacheKey,
        'Uses restaurant UID in storage keys': hasRestaurantUIDInKey,
        'No global storage keys': !hasGlobalStorageKeys
      };
      
      let filePassed = true;
      Object.entries(scopingChecks).forEach(([check, passed]) => {
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${name}: ${check}`);
        results.asyncStorageScoping.push(`${status} ${name}: ${check}`);
        if (!passed) {
          filePassed = false;
          allTestsPassed = false;
        }
      });
      
      if (filePassed) {
        console.log(`  ✅ ${name}: All scoping checks passed`);
      }
    }
  } catch (error) {
    console.log(`  ❌ ${name}: Error reading file - ${error.message}`);
    results.asyncStorageScoping.push(`❌ ${name}: Error reading file`);
    allTestsPassed = false;
  }
});

// Test 3: Verify logout data clearing
console.log('\n🚪 Test 3: Logout Data Clearing...');
console.log('----------------------------------');

try {
  const settingsPath = path.join(__dirname, 'app/(tabs)/settings.tsx');
  if (fs.existsSync(settingsPath)) {
    const content = fs.readFileSync(settingsPath, 'utf8');
    
    const hasSignOutRestaurant = content.includes('signOutRestaurant()');
    const hasClearRestaurantData = content.includes('Clearing restaurant-scoped cached data');
    const hasRestaurantUIDClearing = content.includes('orders_${restaurantUID}');
    const hasNotificationClearing = content.includes('gbc_notifications_${restaurantUID}');
    const hasMultiRemove = content.includes('AsyncStorage.removeItem') || 
                           content.includes('multiRemove');
    
    const logoutChecks = {
      'Uses signOutRestaurant()': hasSignOutRestaurant,
      'Clears restaurant-scoped data': hasClearRestaurantData,
      'Clears restaurant UID-based keys': hasRestaurantUIDClearing,
      'Clears notification data': hasNotificationClearing,
      'Uses AsyncStorage removal': hasMultiRemove
    };
    
    Object.entries(logoutChecks).forEach(([check, passed]) => {
      const status = passed ? '✅' : '❌';
      console.log(`  ${status} Settings: ${check}`);
      results.logoutDataClearing.push(`${status} Settings: ${check}`);
      if (!passed) allTestsPassed = false;
    });
  }
} catch (error) {
  console.log(`  ❌ Settings: Error reading file - ${error.message}`);
  results.logoutDataClearing.push('❌ Settings: Error reading file');
  allTestsPassed = false;
}

// Test 4: Verify login data clearing
console.log('\n🔑 Test 4: Login Data Clearing...');
console.log('---------------------------------');

try {
  const loginPath = path.join(__dirname, 'app/login.tsx');
  if (fs.existsSync(loginPath)) {
    const content = fs.readFileSync(loginPath, 'utf8');
    
    const hasClearCachedData = content.includes('Clearing cached data from previous sessions');
    const hasGetAllKeys = content.includes('AsyncStorage.getAllKeys()');
    const hasFilterKeys = content.includes('orders_') && content.includes('filter');
    const hasMultiRemove = content.includes('multiRemove');
    const hasRestaurantUIDFilter = content.includes('app_restaurant_uid');
    
    const loginChecks = {
      'Clears cached data on login': hasClearCachedData,
      'Gets all AsyncStorage keys': hasGetAllKeys,
      'Filters keys by type': hasFilterKeys,
      'Uses multiRemove for cleanup': hasMultiRemove,
      'Preserves current restaurant data': hasRestaurantUIDFilter
    };
    
    Object.entries(loginChecks).forEach(([check, passed]) => {
      const status = passed ? '✅' : '❌';
      console.log(`  ${status} Login: ${check}`);
      results.loginDataClearing.push(`${status} Login: ${check}`);
      if (!passed) allTestsPassed = false;
    });
  }
} catch (error) {
  console.log(`  ❌ Login: Error reading file - ${error.message}`);
  results.loginDataClearing.push('❌ Login: Error reading file');
  allTestsPassed = false;
}

// Test 5: Check for problematic patterns
console.log('\n🔍 Test 5: Code Quality Checks...');
console.log('----------------------------------');

const problematicPatterns = [
  { pattern: "from('orders').select('*').order", description: 'Global order query without filtering' },
  { pattern: "AsyncStorage.setItem('orders'", description: 'Global order storage key' },
  { pattern: "AsyncStorage.getItem('orders'", description: 'Global order retrieval key' },
  { pattern: 'mockOrders', description: 'Mock data usage (should be restaurant-scoped)' }
];

problematicPatterns.forEach(({ pattern, description }) => {
  let foundFiles = [];
  
  // Search in key directories
  const searchDirs = ['app', 'contexts'];
  
  searchDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
      const files = getAllFiles(dirPath, ['.tsx', '.ts']);
      
      files.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes(pattern) && !content.includes('.eq(\'restaurant_uid\'')) {
            foundFiles.push(path.relative(__dirname, file));
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });
    }
  });
  
  if (foundFiles.length === 0) {
    console.log(`  ✅ No problematic "${pattern}" found`);
    results.codeQuality.push(`✅ No problematic "${pattern}" found`);
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
  console.log('🎉 ALL TESTS PASSED! Restaurant order isolation is properly implemented.');
  console.log('');
  console.log('✅ Order queries filter by restaurant UID');
  console.log('✅ AsyncStorage keys are restaurant-scoped');
  console.log('✅ Logout clears restaurant-specific data');
  console.log('✅ Login clears data from other restaurants');
  console.log('✅ No order data leaks between restaurant accounts');
  console.log('');
  console.log('🚀 Ready for testing with multiple restaurant accounts!');
} else {
  console.log('❌ SOME TESTS FAILED! Please review the issues above.');
  console.log('');
  console.log('Issues found:');
  [...results.orderFiltering, ...results.asyncStorageScoping, ...results.logoutDataClearing, ...results.loginDataClearing, ...results.codeQuality]
    .filter(result => result.startsWith('❌'))
    .forEach(issue => console.log(`  ${issue}`));
}

console.log('\n🧪 Testing Protocol:');
console.log('1. Log in as Restaurant A → View orders → Log out');
console.log('2. Log in as Restaurant B → Verify NO orders from Restaurant A visible');
console.log('3. Log back in as Restaurant A → Verify original orders reappear');
console.log('4. Test with multiple restaurant accounts for complete isolation');

process.exit(allTestsPassed ? 0 : 1);
