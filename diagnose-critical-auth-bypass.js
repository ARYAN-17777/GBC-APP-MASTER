/**
 * Diagnose Critical Authentication Bypass
 * 
 * This script identifies why the login page is still not appearing on fresh installs
 * despite the security fixes implemented.
 */

console.log('🚨 DIAGNOSING CRITICAL AUTHENTICATION BYPASS');
console.log('============================================\n');

const fs = require('fs');
const path = require('path');

// Check 1: Expo Router Configuration and Initial Route
console.log('1️⃣ Analyzing Expo Router Configuration...');

try {
  // Check app.json for initial route configuration
  const appJsonPath = path.join(__dirname, 'app.json');
  const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
  const appConfig = JSON.parse(appJsonContent);
  
  console.log('   📁 app.json Analysis:');
  
  const hasInitialRoute = appConfig.expo?.router?.initialRouteName;
  const hasDeepLinking = appConfig.expo?.linking;
  
  console.log(`      ⚠️ Initial Route Name: ${hasInitialRoute || 'NOT SET'}`);
  console.log(`      ⚠️ Deep Linking Config: ${hasDeepLinking ? 'PRESENT' : 'NOT SET'}`);
  
  if (hasInitialRoute && hasInitialRoute !== 'index') {
    console.log('      🚨 CRITICAL ISSUE: Initial route is not set to index!');
    console.log(`      🚨 Current initial route: ${hasInitialRoute}`);
  }
  
} catch (error) {
  console.error('❌ Error analyzing app.json:', error.message);
}

// Check 2: Root Layout Configuration
console.log('\n2️⃣ Analyzing Root Layout Configuration...');

try {
  const rootLayoutPath = path.join(__dirname, 'app', '_layout.tsx');
  const rootLayoutContent = fs.readFileSync(rootLayoutPath, 'utf8');
  
  console.log('   📁 app/_layout.tsx Analysis:');
  
  // Check for initial route configuration in Stack
  const hasInitialRouteName = rootLayoutContent.includes('initialRouteName');
  const hasStackScreenOrder = rootLayoutContent.includes('<Stack.Screen name="index"');
  const hasTabsFirst = rootLayoutContent.indexOf('<Stack.Screen name="(tabs)"') < rootLayoutContent.indexOf('<Stack.Screen name="login"');
  
  console.log(`      ⚠️ Initial Route Name in Stack: ${hasInitialRouteName ? 'SET' : 'NOT SET'}`);
  console.log(`      ⚠️ Index Screen Defined: ${hasStackScreenOrder ? 'YES' : 'NO'}`);
  console.log(`      ⚠️ Tabs Screen Before Login: ${hasTabsFirst ? 'YES - POTENTIAL ISSUE' : 'NO'}`);
  
  if (hasTabsFirst) {
    console.log('      🚨 CRITICAL ISSUE: Tabs screen is defined before login screen!');
    console.log('      🚨 This may cause Expo Router to prioritize tabs route!');
  }
  
  if (!hasStackScreenOrder) {
    console.log('      🚨 CRITICAL ISSUE: No index screen defined in Stack!');
    console.log('      🚨 app/index.tsx may not be the entry point!');
  }
  
} catch (error) {
  console.error('❌ Error analyzing root layout:', error.message);
}

// Check 3: App Index Entry Point
console.log('\n3️⃣ Analyzing App Index Entry Point...');

try {
  const appIndexPath = path.join(__dirname, 'app', 'index.tsx');
  const appIndexContent = fs.readFileSync(appIndexPath, 'utf8');
  
  console.log('   📁 app/index.tsx Analysis:');
  
  // Check for immediate execution and timing issues
  const hasImmediateExecution = appIndexContent.includes('useEffect(() => {');
  const hasAsyncCheck = appIndexContent.includes('checkAuthStatus');
  const hasLoadingState = appIndexContent.includes('loading') || appIndexContent.includes('Loading');
  const hasDefaultExport = appIndexContent.includes('export default');
  
  console.log(`      ✅ useEffect Hook: ${hasImmediateExecution ? 'PRESENT' : 'MISSING'}`);
  console.log(`      ✅ Async Auth Check: ${hasAsyncCheck ? 'PRESENT' : 'MISSING'}`);
  console.log(`      ⚠️ Loading State: ${hasLoadingState ? 'PRESENT' : 'MISSING - POTENTIAL FLASH'}`);
  console.log(`      ✅ Default Export: ${hasDefaultExport ? 'PRESENT' : 'MISSING'}`);
  
  // Check for potential race conditions
  const hasDelayOrTimeout = appIndexContent.includes('setTimeout') || appIndexContent.includes('delay');
  const hasPromiseChain = appIndexContent.includes('.then(') || appIndexContent.includes('await');
  
  console.log(`      ⚠️ Timing Delays: ${hasDelayOrTimeout ? 'PRESENT' : 'NONE'}`);
  console.log(`      ✅ Promise Handling: ${hasPromiseChain ? 'PRESENT' : 'MISSING'}`);
  
  if (!hasLoadingState) {
    console.log('      🚨 POTENTIAL ISSUE: No loading state may cause UI flash!');
    console.log('      🚨 User might see tabs before authentication completes!');
  }
  
} catch (error) {
  console.error('❌ Error analyzing app index:', error.message);
}

// Check 4: Expo Router File Structure
console.log('\n4️⃣ Analyzing Expo Router File Structure...');

const routeFiles = [
  { path: 'app/index.tsx', required: true, description: 'Main entry point' },
  { path: 'app/_layout.tsx', required: true, description: 'Root layout' },
  { path: 'app/login.tsx', required: true, description: 'Login screen' },
  { path: 'app/(tabs)/_layout.tsx', required: true, description: 'Tabs layout' },
  { path: 'app/(tabs)/index.tsx', required: true, description: 'Dashboard tab' }
];

console.log('   📁 Route File Structure:');

routeFiles.forEach(route => {
  const routePath = path.join(__dirname, route.path);
  const exists = fs.existsSync(routePath);
  
  console.log(`      ${exists ? '✅' : '❌'} ${route.path} - ${route.description}`);
  
  if (!exists && route.required) {
    console.log(`      🚨 CRITICAL: Required route file missing!`);
  }
});

// Check 5: Potential Expo Router Bypass Mechanisms
console.log('\n5️⃣ Checking for Expo Router Bypass Mechanisms...');

try {
  // Check if there are any direct navigation calls that bypass the index
  const filesToCheck = [
    'app/_layout.tsx',
    'app/(tabs)/_layout.tsx',
    'components/NotificationProvider.tsx'
  ];
  
  let hasDirectNavigation = false;
  let hasAutoRedirect = false;
  
  filesToCheck.forEach(file => {
    try {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes("router.replace('/(tabs)')") && !content.includes('if (')) {
          hasDirectNavigation = true;
          console.log(`      🚨 FOUND: Direct navigation to tabs in ${file}`);
        }
        
        if (content.includes('router.push') || content.includes('router.navigate')) {
          hasAutoRedirect = true;
          console.log(`      ⚠️ FOUND: Auto-redirect logic in ${file}`);
        }
      }
    } catch (error) {
      // Ignore file read errors
    }
  });
  
  console.log(`      ⚠️ Direct Navigation to Tabs: ${hasDirectNavigation ? 'FOUND - CRITICAL ISSUE' : 'NONE'}`);
  console.log(`      ⚠️ Auto-Redirect Logic: ${hasAutoRedirect ? 'FOUND' : 'NONE'}`);
  
} catch (error) {
  console.error('❌ Error checking bypass mechanisms:', error.message);
}

// Check 6: AsyncStorage and Session Persistence Issues
console.log('\n6️⃣ Checking AsyncStorage and Session Issues...');

try {
  const authServicePath = path.join(__dirname, 'services', 'supabase-auth.ts');
  const authContent = fs.readFileSync(authServicePath, 'utf8');
  
  // Check for potential session persistence issues
  const hasAsyncStorageCheck = authContent.includes('AsyncStorage.getItem');
  const hasSessionClear = authContent.includes('AsyncStorage.removeItem') || authContent.includes('AsyncStorage.clear');
  const hasStrictValidation = authContent.includes('verifySessionValidity');
  
  console.log(`      ✅ AsyncStorage Check: ${hasAsyncStorageCheck ? 'PRESENT' : 'MISSING'}`);
  console.log(`      ✅ Session Clear Logic: ${hasSessionClear ? 'PRESENT' : 'MISSING'}`);
  console.log(`      ✅ Strict Validation: ${hasStrictValidation ? 'PRESENT' : 'MISSING'}`);
  
  // Check for potential auto-login from storage
  const hasAutoLoginFromStorage = authContent.includes('auto') && authContent.includes('storage');
  const hasDefaultUser = authContent.includes('defaultUser') || authContent.includes('guestUser');
  
  console.log(`      ⚠️ Auto-Login from Storage: ${hasAutoLoginFromStorage ? 'POTENTIAL ISSUE' : 'NONE'}`);
  console.log(`      ⚠️ Default User Logic: ${hasDefaultUser ? 'POTENTIAL ISSUE' : 'NONE'}`);
  
} catch (error) {
  console.error('❌ Error checking AsyncStorage logic:', error.message);
}

console.log('\n🔍 ROOT CAUSE ANALYSIS');
console.log('======================');
console.log('');
console.log('🚨 MOST LIKELY CAUSES OF AUTHENTICATION BYPASS:');
console.log('');
console.log('1. 📱 EXPO ROUTER ROUTE PRIORITY:');
console.log('   - Expo Router may be prioritizing /(tabs) route over index route');
console.log('   - Stack screen order in _layout.tsx affects route priority');
console.log('   - Missing initialRouteName configuration');
console.log('');
console.log('2. ⚡ RACE CONDITION:');
console.log('   - Authentication check in app/index.tsx may be too slow');
console.log('   - User sees tabs before authentication completes');
console.log('   - Missing loading state allows UI flash');
console.log('');
console.log('3. 🔄 NAVIGATION TIMING:');
console.log('   - Async authentication check allows other routes to load first');
console.log('   - No synchronous blocking mechanism');
console.log('   - Router navigation happens before auth check completes');
console.log('');
console.log('🎯 REQUIRED FIXES:');
console.log('1. Add explicit initialRouteName to force index as entry point');
console.log('2. Add loading state to prevent UI flash during auth check');
console.log('3. Implement synchronous authentication blocking');
console.log('4. Reorder Stack screens to prioritize index route');
console.log('5. Add additional navigation guards');
console.log('');
console.log('🚨 IMPLEMENTING BULLETPROOF AUTHENTICATION FLOW...');
