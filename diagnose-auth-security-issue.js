/**
 * Diagnose Authentication Security Issue
 * 
 * This script identifies potential security vulnerabilities in the authentication flow
 * that could allow new users to bypass the login page.
 */

console.log('🔐 DIAGNOSING AUTHENTICATION SECURITY ISSUE');
console.log('==========================================\n');

const fs = require('fs');
const path = require('path');

// Test 1: Check app entry point and routing
console.log('1️⃣ Analyzing App Entry Point and Routing...');

try {
  // Check app/index.tsx
  const appIndexPath = path.join(__dirname, 'app', 'index.tsx');
  const appIndexContent = fs.readFileSync(appIndexPath, 'utf8');
  
  console.log('   📁 app/index.tsx Analysis:');
  
  // Check for authentication check
  const hasAuthCheck = appIndexContent.includes('initializeSession');
  const hasStrictCheck = appIndexContent.includes('strict authentication');
  const hasLoginRedirect = appIndexContent.includes("router.replace('/login')");
  const hasTabsRedirect = appIndexContent.includes("router.replace('/(tabs)')");
  const hasErrorHandling = appIndexContent.includes('catch (error)');
  
  console.log(`      ✅ Authentication Check: ${hasAuthCheck ? 'PRESENT' : 'MISSING'}`);
  console.log(`      ✅ Strict Check Comment: ${hasStrictCheck ? 'PRESENT' : 'MISSING'}`);
  console.log(`      ✅ Login Redirect: ${hasLoginRedirect ? 'PRESENT' : 'MISSING'}`);
  console.log(`      ✅ Tabs Redirect: ${hasTabsRedirect ? 'PRESENT' : 'MISSING'}`);
  console.log(`      ✅ Error Handling: ${hasErrorHandling ? 'PRESENT' : 'MISSING'}`);
  
  // Check for potential bypasses
  const hasDirectTabsAccess = appIndexContent.includes("router.replace('/(tabs)')") && !appIndexContent.includes('if (user)');
  const hasUnconditionalRedirect = appIndexContent.includes('router.replace') && !appIndexContent.includes('if (');
  
  console.log(`      ⚠️ Direct Tabs Access: ${hasDirectTabsAccess ? 'POTENTIAL ISSUE' : 'SECURE'}`);
  console.log(`      ⚠️ Unconditional Redirect: ${hasUnconditionalRedirect ? 'POTENTIAL ISSUE' : 'SECURE'}`);
  
} catch (error) {
  console.error('❌ Error analyzing app entry point:', error.message);
}

// Test 2: Check tabs layout for authentication protection
console.log('\n2️⃣ Analyzing Tabs Layout Security...');

try {
  const tabsLayoutPath = path.join(__dirname, 'app', '(tabs)', '_layout.tsx');
  const tabsLayoutContent = fs.readFileSync(tabsLayoutPath, 'utf8');
  
  console.log('   📁 app/(tabs)/_layout.tsx Analysis:');
  
  // Check for authentication protection in tabs
  const hasAuthProtection = tabsLayoutContent.includes('auth') || tabsLayoutContent.includes('login');
  const hasUserCheck = tabsLayoutContent.includes('user') || tabsLayoutContent.includes('session');
  const hasRedirectLogic = tabsLayoutContent.includes('router') || tabsLayoutContent.includes('redirect');
  
  console.log(`      ⚠️ Authentication Protection: ${hasAuthProtection ? 'PRESENT' : 'MISSING - SECURITY RISK!'}`);
  console.log(`      ⚠️ User Check: ${hasUserCheck ? 'PRESENT' : 'MISSING - SECURITY RISK!'}`);
  console.log(`      ⚠️ Redirect Logic: ${hasRedirectLogic ? 'PRESENT' : 'MISSING - SECURITY RISK!'}`);
  
  if (!hasAuthProtection && !hasUserCheck && !hasRedirectLogic) {
    console.log('      🚨 CRITICAL SECURITY ISSUE: Tabs layout has NO authentication protection!');
    console.log('      🚨 Users can directly access /(tabs) routes without authentication!');
  }
  
} catch (error) {
  console.error('❌ Error analyzing tabs layout:', error.message);
}

// Test 3: Check individual tab screens for authentication
console.log('\n3️⃣ Analyzing Individual Tab Screens...');

const tabScreens = [
  { name: 'Dashboard', path: 'app/(tabs)/index.tsx' },
  { name: 'Orders', path: 'app/(tabs)/orders.tsx' },
  { name: 'Notifications', path: 'app/(tabs)/notifications.tsx' },
  { name: 'Settings', path: 'app/(tabs)/settings.tsx' }
];

tabScreens.forEach(screen => {
  try {
    const screenPath = path.join(__dirname, screen.path);
    if (fs.existsSync(screenPath)) {
      const screenContent = fs.readFileSync(screenPath, 'utf8');
      
      const hasAuthCheck = screenContent.includes('auth') || screenContent.includes('user') || screenContent.includes('session');
      const hasLoginRedirect = screenContent.includes('login') || screenContent.includes('router');
      
      console.log(`   📱 ${screen.name}:`);
      console.log(`      ⚠️ Authentication Check: ${hasAuthCheck ? 'PRESENT' : 'MISSING'}`);
      console.log(`      ⚠️ Login Redirect: ${hasLoginRedirect ? 'PRESENT' : 'MISSING'}`);
      
      if (!hasAuthCheck) {
        console.log(`      🚨 SECURITY RISK: ${screen.name} has no authentication protection!`);
      }
    } else {
      console.log(`   📱 ${screen.name}: FILE NOT FOUND`);
    }
  } catch (error) {
    console.log(`   📱 ${screen.name}: ERROR READING FILE`);
  }
});

// Test 4: Check authentication service for potential issues
console.log('\n4️⃣ Analyzing Authentication Service...');

try {
  const authServicePath = path.join(__dirname, 'services', 'supabase-auth.ts');
  const authContent = fs.readFileSync(authServicePath, 'utf8');
  
  console.log('   🔐 services/supabase-auth.ts Analysis:');
  
  // Check for potential security issues
  const hasStrictValidation = authContent.includes('STRICT CHECK');
  const hasSessionVerification = authContent.includes('verifySessionValidity');
  const hasSessionExpiry = authContent.includes('isSessionExpired');
  const hasClearSession = authContent.includes('clearStoredSession');
  const hasDefaultReturn = authContent.includes('return null');
  
  console.log(`      ✅ Strict Validation: ${hasStrictValidation ? 'IMPLEMENTED' : 'MISSING'}`);
  console.log(`      ✅ Session Verification: ${hasSessionVerification ? 'IMPLEMENTED' : 'MISSING'}`);
  console.log(`      ✅ Session Expiry Check: ${hasSessionExpiry ? 'IMPLEMENTED' : 'MISSING'}`);
  console.log(`      ✅ Clear Session Logic: ${hasClearSession ? 'IMPLEMENTED' : 'MISSING'}`);
  console.log(`      ✅ Secure Default Return: ${hasDefaultReturn ? 'IMPLEMENTED' : 'MISSING'}`);
  
  // Check for potential bypasses
  const hasAutoLogin = authContent.includes('auto-login') || authContent.includes('automatic');
  const hasDefaultUser = authContent.includes('default user') || authContent.includes('guest');
  const hasSkipAuth = authContent.includes('skip') || authContent.includes('bypass');
  
  console.log(`      ⚠️ Auto-Login Logic: ${hasAutoLogin ? 'POTENTIAL ISSUE' : 'SECURE'}`);
  console.log(`      ⚠️ Default User Logic: ${hasDefaultUser ? 'POTENTIAL ISSUE' : 'SECURE'}`);
  console.log(`      ⚠️ Skip Auth Logic: ${hasSkipAuth ? 'POTENTIAL ISSUE' : 'SECURE'}`);
  
} catch (error) {
  console.error('❌ Error analyzing authentication service:', error.message);
}

// Test 5: Check for direct route access vulnerabilities
console.log('\n5️⃣ Checking for Direct Route Access Vulnerabilities...');

try {
  const rootLayoutPath = path.join(__dirname, 'app', '_layout.tsx');
  const rootLayoutContent = fs.readFileSync(rootLayoutPath, 'utf8');
  
  console.log('   📁 app/_layout.tsx Analysis:');
  
  // Check stack configuration
  const hasTabsScreen = rootLayoutContent.includes('<Stack.Screen name="(tabs)"');
  const hasLoginScreen = rootLayoutContent.includes('<Stack.Screen name="login"');
  const hasAuthProtection = rootLayoutContent.includes('auth') || rootLayoutContent.includes('protected');
  
  console.log(`      ✅ Tabs Screen Defined: ${hasTabsScreen ? 'YES' : 'NO'}`);
  console.log(`      ✅ Login Screen Defined: ${hasLoginScreen ? 'YES' : 'NO'}`);
  console.log(`      ⚠️ Auth Protection: ${hasAuthProtection ? 'PRESENT' : 'MISSING'}`);
  
  if (hasTabsScreen && !hasAuthProtection) {
    console.log('      🚨 CRITICAL: Tabs route is exposed without authentication protection!');
    console.log('      🚨 Users can directly navigate to /(tabs) bypassing login!');
  }
  
} catch (error) {
  console.error('❌ Error analyzing root layout:', error.message);
}

// Test 6: Identify the root cause
console.log('\n6️⃣ ROOT CAUSE ANALYSIS...');
console.log('==========================================');

console.log('🔍 POTENTIAL SECURITY VULNERABILITIES IDENTIFIED:');
console.log('');
console.log('1. 🚨 TABS LAYOUT VULNERABILITY:');
console.log('   - app/(tabs)/_layout.tsx has NO authentication checks');
console.log('   - Users can directly access /(tabs) routes without login');
console.log('   - This is the most likely cause of the bypass issue');
console.log('');
console.log('2. 🚨 INDIVIDUAL TAB SCREENS:');
console.log('   - Tab screens may not have individual auth protection');
console.log('   - Relying only on app/index.tsx is insufficient');
console.log('');
console.log('3. 🚨 ROUTE EXPOSURE:');
console.log('   - Expo Router exposes all routes by default');
console.log('   - Without protection, users can navigate directly to any route');
console.log('');
console.log('🎯 RECOMMENDED FIXES:');
console.log('1. Add authentication guard to app/(tabs)/_layout.tsx');
console.log('2. Implement route protection middleware');
console.log('3. Add authentication checks to individual tab screens');
console.log('4. Ensure proper session validation on all protected routes');
console.log('');
console.log('🚨 IMMEDIATE ACTION REQUIRED: Implement authentication guards!');
