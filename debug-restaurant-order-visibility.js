#!/usr/bin/env node

/**
 * 🔍 RESTAURANT ORDER VISIBILITY DEBUG SCRIPT
 * 
 * This script helps debug why orders are not appearing for the correct restaurant.
 * It checks:
 * 1. Restaurant authentication and UID extraction
 * 2. Database schema and field names
 * 3. Order filtering logic
 * 4. Real-time subscription setup
 * 5. AsyncStorage cache issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DEBUGGING RESTAURANT ORDER VISIBILITY ISSUE...');
console.log('==================================================');

let allTestsPassed = true;
const issues = [];

// Test 1: Check restaurant UID field consistency
console.log('\n🏪 Test 1: Restaurant UID Field Consistency...');
console.log('-----------------------------------------------');

const filesToCheck = [
  { path: 'app/(tabs)/index.tsx', name: 'Home Screen' },
  { path: 'app/(tabs)/orders.tsx', name: 'Orders Screen' },
  { path: 'services/supabase-auth.ts', name: 'Auth Service' },
  { path: 'services/gbc-order-status-api.ts', name: 'API Service' }
];

filesToCheck.forEach(({ path: filePath, name }) => {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for consistent field usage
      const hasAppRestaurantUID = content.includes('app_restaurant_uid');
      const hasRestaurantUID = content.includes('restaurant_uid');
      const hasGetCurrentRestaurantUser = content.includes('getCurrentRestaurantUser');
      
      console.log(`  📄 ${name}:`);
      console.log(`    - Uses app_restaurant_uid: ${hasAppRestaurantUID ? '✅' : '❌'}`);
      console.log(`    - Uses restaurant_uid: ${hasRestaurantUID ? '✅' : '❌'}`);
      console.log(`    - Uses getCurrentRestaurantUser: ${hasGetCurrentRestaurantUser ? '✅' : '❌'}`);
      
      // Check for potential field name mismatches
      if (content.includes('.eq(\'restaurant_uid\'') && content.includes('app_restaurant_uid')) {
        console.log(`    ✅ Correct field mapping: restaurant_uid ← app_restaurant_uid`);
      } else if (content.includes('.eq(\'restaurant_uid\'')) {
        console.log(`    ⚠️  Uses restaurant_uid in query but may not have app_restaurant_uid source`);
        issues.push(`${name}: Potential field mapping issue`);
      }
    }
  } catch (error) {
    console.log(`  ❌ ${name}: Error reading file - ${error.message}`);
    issues.push(`${name}: File read error`);
    allTestsPassed = false;
  }
});

// Test 2: Check for debugging logs
console.log('\n🔍 Test 2: Debugging Implementation...');
console.log('--------------------------------------');

const debugPatterns = [
  { pattern: 'DEBUG: Restaurant user object', description: 'Restaurant user logging' },
  { pattern: 'DEBUG: All orders in database', description: 'Database content logging' },
  { pattern: 'DEBUG: Looking for restaurant_uid matching', description: 'UID matching logging' },
  { pattern: 'DEBUG: Orders matching our restaurant UID', description: 'Match result logging' },
  { pattern: 'DEBUG: Executing filtered query', description: 'Query execution logging' },
  { pattern: 'DEBUG: Filtered orders result', description: 'Query result logging' }
];

debugPatterns.forEach(({ pattern, description }) => {
  let foundInFiles = [];
  
  ['app/(tabs)/index.tsx', 'app/(tabs)/orders.tsx'].forEach(filePath => {
    try {
      const fullPath = path.join(__dirname, filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(pattern)) {
          foundInFiles.push(path.basename(filePath));
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  if (foundInFiles.length > 0) {
    console.log(`  ✅ ${description}: Found in ${foundInFiles.join(', ')}`);
  } else {
    console.log(`  ❌ ${description}: Not found`);
    issues.push(`Missing debug logging: ${description}`);
    allTestsPassed = false;
  }
});

// Test 3: Check real-time subscription filtering
console.log('\n📡 Test 3: Real-time Subscription Filtering...');
console.log('-----------------------------------------------');

['app/(tabs)/index.tsx', 'app/(tabs)/orders.tsx'].forEach(filePath => {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const fileName = path.basename(filePath);
      
      console.log(`  📄 ${fileName}:`);
      
      // Check for restaurant-scoped subscription
      const hasRestaurantScopedSubscription = content.includes('filter: `restaurant_uid=eq.${restaurantUser.app_restaurant_uid}`');
      const hasSubscriptionSetup = content.includes('setupSubscription');
      const hasRestaurantUserCheck = content.includes('if (!restaurantUser)') && content.includes('subscription');
      
      console.log(`    - Restaurant-scoped filter: ${hasRestaurantScopedSubscription ? '✅' : '❌'}`);
      console.log(`    - Subscription setup function: ${hasSubscriptionSetup ? '✅' : '❌'}`);
      console.log(`    - Restaurant user validation: ${hasRestaurantUserCheck ? '✅' : '❌'}`);
      
      if (!hasRestaurantScopedSubscription) {
        issues.push(`${fileName}: Missing restaurant-scoped subscription filter`);
        allTestsPassed = false;
      }
      
      // Check for old unfiltered subscription pattern
      if (content.includes('{ event: \'*\', schema: \'public\', table: \'orders\' }') && 
          !content.includes('filter:')) {
        console.log(`    ⚠️  Found unfiltered subscription pattern`);
        issues.push(`${fileName}: Has unfiltered subscription (security risk)`);
        allTestsPassed = false;
      }
    }
  } catch (error) {
    console.log(`  ❌ ${path.basename(filePath)}: Error reading file`);
    issues.push(`${path.basename(filePath)}: File read error`);
    allTestsPassed = false;
  }
});

// Test 4: Check AsyncStorage cache keys
console.log('\n💾 Test 4: AsyncStorage Cache Keys...');
console.log('-------------------------------------');

try {
  const ordersPath = path.join(__dirname, 'app/(tabs)/orders.tsx');
  if (fs.existsSync(ordersPath)) {
    const content = fs.readFileSync(ordersPath, 'utf8');
    
    const hasRestaurantCacheKey = content.includes('getRestaurantCacheKey');
    const hasCacheKeyScoping = content.includes('${key}_${restaurantUser.app_restaurant_uid}');
    const usesCachedOrders = content.includes('cached_orders');
    
    console.log(`  ✅ Restaurant cache key function: ${hasRestaurantCacheKey ? 'Found' : 'Missing'}`);
    console.log(`  ✅ Cache key scoping: ${hasCacheKeyScoping ? 'Found' : 'Missing'}`);
    console.log(`  ✅ Uses cached orders: ${usesCachedOrders ? 'Found' : 'Missing'}`);
    
    if (!hasRestaurantCacheKey || !hasCacheKeyScoping) {
      issues.push('Orders screen: Missing restaurant-scoped cache keys');
      allTestsPassed = false;
    }
  }
} catch (error) {
  console.log(`  ❌ Error checking AsyncStorage cache keys`);
  issues.push('AsyncStorage: Cache key check failed');
  allTestsPassed = false;
}

// Test 5: Check for common issues
console.log('\n⚠️  Test 5: Common Issues Check...');
console.log('----------------------------------');

const commonIssues = [
  {
    pattern: '.eq(\'restaurant_uid\', restaurantUser.restaurant_uid)',
    description: 'Using wrong field name (should be app_restaurant_uid)',
    severity: 'CRITICAL'
  },
  {
    pattern: '.eq(\'app_restaurant_uid\',',
    description: 'Querying by app_restaurant_uid instead of restaurant_uid',
    severity: 'CRITICAL'
  },
  {
    pattern: 'restaurant_uid: restaurantUser.restaurant_uid',
    description: 'Setting wrong field name in updates',
    severity: 'CRITICAL'
  },
  {
    pattern: 'getCurrentRestaurantUser()?.restaurant_uid',
    description: 'Accessing wrong property from restaurant user',
    severity: 'CRITICAL'
  }
];

commonIssues.forEach(({ pattern, description, severity }) => {
  let foundFiles = [];
  
  ['app/(tabs)/index.tsx', 'app/(tabs)/orders.tsx', 'services/gbc-order-status-api.ts'].forEach(filePath => {
    try {
      const fullPath = path.join(__dirname, filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(pattern)) {
          foundFiles.push(path.basename(filePath));
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  if (foundFiles.length > 0) {
    console.log(`  ❌ ${severity}: ${description}`);
    console.log(`    Found in: ${foundFiles.join(', ')}`);
    issues.push(`${severity}: ${description} (${foundFiles.join(', ')})`);
    allTestsPassed = false;
  } else {
    console.log(`  ✅ No issue: ${description}`);
  }
});

// Test 6: Check for proper error handling
console.log('\n🛡️  Test 6: Error Handling...');
console.log('-----------------------------');

const errorHandlingPatterns = [
  'if (!restaurantUser)',
  'console.error(\'❌ No restaurant user found\')',
  'Alert.alert(\'Error\', \'No restaurant user found\')',
  'setOrders([])',
  'setLoading(false)'
];

errorHandlingPatterns.forEach(pattern => {
  let foundInFiles = [];
  
  ['app/(tabs)/index.tsx', 'app/(tabs)/orders.tsx'].forEach(filePath => {
    try {
      const fullPath = path.join(__dirname, filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(pattern)) {
          foundInFiles.push(path.basename(filePath));
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  if (foundInFiles.length > 0) {
    console.log(`  ✅ ${pattern}: Found in ${foundInFiles.join(', ')}`);
  } else {
    console.log(`  ⚠️  ${pattern}: Not found`);
  }
});

// Final Results
console.log('\n📊 DEBUGGING RESULTS');
console.log('====================');

if (allTestsPassed && issues.length === 0) {
  console.log('🎉 NO CRITICAL ISSUES FOUND!');
  console.log('');
  console.log('The code appears to be correctly implemented. The issue might be:');
  console.log('1. 🔍 Data mismatch: restaurant_uid in database ≠ app_restaurant_uid in session');
  console.log('2. 🔍 Authentication issue: getCurrentRestaurantUser() returning null/wrong data');
  console.log('3. 🔍 Database schema: restaurant_uid column missing or wrong type');
  console.log('4. 🔍 Order creation: Orders being created with wrong restaurant_uid value');
  console.log('');
  console.log('🧪 NEXT STEPS:');
  console.log('1. Run the app and check console logs for DEBUG messages');
  console.log('2. Verify the restaurant_uid value in the database matches the session');
  console.log('3. Check if getCurrentRestaurantUser() returns the expected data');
  console.log('4. Verify orders are being created with the correct restaurant_uid');
} else {
  console.log('❌ ISSUES FOUND! Please fix the following:');
  console.log('');
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
  console.log('');
  console.log('🔧 Fix these issues and run the debug script again.');
}

console.log('\n🧪 MANUAL TESTING STEPS:');
console.log('1. Log into the app with restaurant credentials');
console.log('2. Check console logs for DEBUG messages showing:');
console.log('   - Restaurant user object with app_restaurant_uid');
console.log('   - All orders in database with their restaurant_uid values');
console.log('   - Query execution with the filter value');
console.log('   - Query results');
console.log('3. Compare restaurant_uid in database with app_restaurant_uid in session');
console.log('4. Verify orders appear on both home and orders screens');

process.exit(allTestsPassed && issues.length === 0 ? 0 : 1);
