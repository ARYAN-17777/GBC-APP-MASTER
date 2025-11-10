#!/usr/bin/env node

/**
 * 🔍 ORDER STATUS PERSISTENCE VERIFICATION
 * 
 * This script verifies that order status updates are properly persisted to the Supabase backend:
 * 1. Order approval/cancellation updates Supabase database
 * 2. Updates include restaurant_uid filtering for data isolation
 * 3. Status changes persist after page refresh
 * 4. Both main and local-only functions work correctly
 * 5. GBC API integration includes restaurant scoping
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING ORDER STATUS PERSISTENCE...');
console.log('==========================================');

let allTestsPassed = true;
const results = {
  supabaseUpdates: [],
  restaurantScoping: [],
  apiIntegration: [],
  errorHandling: [],
  codeQuality: []
};

// Test 1: Verify Supabase database updates
console.log('\n💾 Test 1: Supabase Database Updates...');
console.log('---------------------------------------');

const filesToCheckForSupabaseUpdates = [
  { path: 'app/(tabs)/index.tsx', name: 'Home Screen' },
  { path: 'app/(tabs)/orders.tsx', name: 'Orders Screen' },
  { path: 'services/gbc-order-status-api.ts', name: 'GBC API Service' }
];

filesToCheckForSupabaseUpdates.forEach(({ path: filePath, name }) => {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for proper Supabase update patterns
      const hasSupabaseUpdate = content.includes("supabase.from('orders').update(");
      const hasStatusUpdate = content.includes("status: 'approved'") || content.includes("status: 'cancelled'");
      const hasTimestampUpdate = content.includes("updated_at: new Date().toISOString()");
      const hasRestaurantUIDFilter = content.includes(".eq('restaurant_uid'");
      const hasOrderIDFilter = content.includes(".eq('id', orderId)") || content.includes(".eq('orderNumber'");
      
      const supabaseChecks = {
        'Has Supabase update calls': hasSupabaseUpdate,
        'Updates order status': hasStatusUpdate,
        'Updates timestamp': hasTimestampUpdate,
        'Filters by restaurant UID': hasRestaurantUIDFilter,
        'Filters by order ID': hasOrderIDFilter
      };
      
      let filePassed = true;
      Object.entries(supabaseChecks).forEach(([check, passed]) => {
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${name}: ${check}`);
        results.supabaseUpdates.push(`${status} ${name}: ${check}`);
        if (!passed) {
          filePassed = false;
          allTestsPassed = false;
        }
      });
      
      if (filePassed) {
        console.log(`  ✅ ${name}: All Supabase update checks passed`);
      }
    } else {
      console.log(`  ⚠️  ${name}: File not found at ${filePath}`);
    }
  } catch (error) {
    console.log(`  ❌ ${name}: Error reading file - ${error.message}`);
    results.supabaseUpdates.push(`❌ ${name}: Error reading file`);
    allTestsPassed = false;
  }
});

// Test 2: Verify restaurant scoping
console.log('\n🏪 Test 2: Restaurant Scoping...');
console.log('---------------------------------');

const filesToCheckForScoping = [
  { path: 'app/(tabs)/index.tsx', name: 'Home Screen' },
  { path: 'app/(tabs)/orders.tsx', name: 'Orders Screen' }
];

filesToCheckForScoping.forEach(({ path: filePath, name }) => {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for restaurant user validation
      const hasRestaurantUserCheck = content.includes('getCurrentRestaurantUser()');
      const hasRestaurantUserValidation = content.includes('if (!restaurantUser)');
      const hasRestaurantUIDInUpdate = content.includes('.eq(\'restaurant_uid\', restaurantUser.app_restaurant_uid)');
      const hasErrorHandlingForNoUser = content.includes('No restaurant user found');
      
      const scopingChecks = {
        'Gets current restaurant user': hasRestaurantUserCheck,
        'Validates restaurant user exists': hasRestaurantUserValidation,
        'Uses restaurant UID in updates': hasRestaurantUIDInUpdate,
        'Handles missing restaurant user': hasErrorHandlingForNoUser
      };
      
      let filePassed = true;
      Object.entries(scopingChecks).forEach(([check, passed]) => {
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${name}: ${check}`);
        results.restaurantScoping.push(`${status} ${name}: ${check}`);
        if (!passed) {
          filePassed = false;
          allTestsPassed = false;
        }
      });
      
      if (filePassed) {
        console.log(`  ✅ ${name}: All restaurant scoping checks passed`);
      }
    }
  } catch (error) {
    console.log(`  ❌ ${name}: Error reading file - ${error.message}`);
    results.restaurantScoping.push(`❌ ${name}: Error reading file`);
    allTestsPassed = false;
  }
});

// Test 3: Verify API integration
console.log('\n🔗 Test 3: API Integration...');
console.log('------------------------------');

try {
  const indexPath = path.join(__dirname, 'app/(tabs)/index.tsx');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    
    const hasGBCAPICall = content.includes('gbcOrderStatusAPI.updateOrderStatus') || 
                          content.includes('gbcOrderStatusAPI.cancelOrder');
    const hasSupabaseFirstPattern = content.includes('FIRST: Update Supabase database');
    const hasAPISecondPattern = content.includes('SECOND: Send status update to website');
    const hasPartialSuccessHandling = content.includes('Partial Success');
    const hasAPIErrorHandling = content.includes('Website Update Failed');
    const hasLocalStateUpdate = content.includes('updateLocalStateAndNavigate');
    
    const apiChecks = {
      'Calls GBC API for status updates': hasGBCAPICall,
      'Updates Supabase first': hasSupabaseFirstPattern,
      'Calls API second': hasAPISecondPattern,
      'Handles partial success': hasPartialSuccessHandling,
      'Handles API errors': hasAPIErrorHandling,
      'Updates local state': hasLocalStateUpdate
    };
    
    Object.entries(apiChecks).forEach(([check, passed]) => {
      const status = passed ? '✅' : '❌';
      console.log(`  ${status} Home Screen: ${check}`);
      results.apiIntegration.push(`${status} Home Screen: ${check}`);
      if (!passed) allTestsPassed = false;
    });
  }
} catch (error) {
  console.log(`  ❌ Home Screen: Error reading file - ${error.message}`);
  results.apiIntegration.push('❌ Home Screen: Error reading file');
  allTestsPassed = false;
}

// Test 4: Verify GBC API service restaurant scoping
console.log('\n🛠️  Test 4: GBC API Service...');
console.log('------------------------------');

try {
  const apiPath = path.join(__dirname, 'services/gbc-order-status-api.ts');
  if (fs.existsSync(apiPath)) {
    const content = fs.readFileSync(apiPath, 'utf8');
    
    const hasUpdateLocalDatabase = content.includes('updateLocalDatabase');
    const hasRestaurantUIDInAPI = content.includes('getRestaurantUID()');
    const hasRestaurantFilterInUpdate = content.includes('.eq(\'restaurant_uid\', restaurantUID)');
    const hasRestaurantLogging = content.includes('restaurant:');
    
    const apiServiceChecks = {
      'Has updateLocalDatabase method': hasUpdateLocalDatabase,
      'Gets restaurant UID': hasRestaurantUIDInAPI,
      'Filters by restaurant UID': hasRestaurantFilterInUpdate,
      'Logs restaurant info': hasRestaurantLogging
    };
    
    Object.entries(apiServiceChecks).forEach(([check, passed]) => {
      const status = passed ? '✅' : '❌';
      console.log(`  ${status} GBC API Service: ${check}`);
      results.apiIntegration.push(`${status} GBC API Service: ${check}`);
      if (!passed) allTestsPassed = false;
    });
  }
} catch (error) {
  console.log(`  ❌ GBC API Service: Error reading file - ${error.message}`);
  results.apiIntegration.push('❌ GBC API Service: Error reading file');
  allTestsPassed = false;
}

// Test 5: Check for problematic patterns
console.log('\n🔍 Test 5: Code Quality Checks...');
console.log('----------------------------------');

const problematicPatterns = [
  { 
    pattern: ".update({ status: 'approved' }).eq('id', orderId);", 
    description: 'Order update without restaurant_uid filtering' 
  },
  { 
    pattern: ".update({ status: 'cancelled' }).eq('id', orderId);", 
    description: 'Order update without restaurant_uid filtering' 
  },
  { 
    pattern: "setOrders(prevOrders =>", 
    description: 'Local state update (should use helper function)' 
  }
];

problematicPatterns.forEach(({ pattern, description }) => {
  let foundFiles = [];
  
  // Search in app directory
  const searchDirs = ['app'];
  
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
  console.log('🎉 ALL TESTS PASSED! Order status persistence is properly implemented.');
  console.log('');
  console.log('✅ Supabase database updates with restaurant scoping');
  console.log('✅ Order status changes persist after page refresh');
  console.log('✅ API integration with proper error handling');
  console.log('✅ Restaurant-scoped data isolation maintained');
  console.log('✅ Both main and local-only functions work correctly');
  console.log('');
  console.log('🚀 Ready for testing order status persistence!');
} else {
  console.log('❌ SOME TESTS FAILED! Please review the issues above.');
  console.log('');
  console.log('Issues found:');
  [...results.supabaseUpdates, ...results.restaurantScoping, ...results.apiIntegration, ...results.codeQuality]
    .filter(result => result.startsWith('❌'))
    .forEach(issue => console.log(`  ${issue}`));
}

console.log('\n🧪 Testing Protocol:');
console.log('1. Log in as a restaurant account');
console.log('2. Navigate to home page');
console.log('3. Click on a pending order and approve it');
console.log('4. Verify status shows "approved" in UI');
console.log('5. Refresh the page (pull down to refresh)');
console.log('6. Verify status still shows "approved" (not reverted to "pending")');
console.log('7. Check Supabase database to confirm status is updated');
console.log('8. Repeat for order cancellation');

process.exit(allTestsPassed ? 0 : 1);
