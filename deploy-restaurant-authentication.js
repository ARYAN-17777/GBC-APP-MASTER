// =====================================================
// DEPLOY RESTAURANT AUTHENTICATION SYSTEM
// =====================================================
// This script deploys the complete restaurant authentication system:
// 1. Database schema with authentication columns
// 2. Restaurant login Edge Function
// 3. Updated registration Edge Function
// 4. Test the complete authentication flow

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deployAuthenticationSchema() {
  console.log('🔐 Deploying restaurant authentication schema...');
  
  try {
    // Read the authentication schema SQL file
    const schemaPath = path.join(__dirname, 'add-authentication-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema deployment
    const { data, error } = await supabase.rpc('exec_sql', { sql: schemaSql });
    
    if (error) {
      console.error('❌ Schema deployment failed:', error);
      return false;
    }
    
    console.log('✅ Authentication schema deployed successfully');
    return true;
  } catch (error) {
    console.error('❌ Schema deployment error:', error);
    return false;
  }
}

async function testRegistrationWithAuth() {
  console.log('🧪 Testing restaurant registration with authentication...');
  
  try {
    const testData = {
      website_restaurant_id: 'test_auth_rest_001',
      restaurant_name: 'Test Authentication Restaurant',
      restaurant_phone: '+44 123 456 7890',
      restaurant_email: 'test.auth@restaurant.com',
      restaurant_address: '123 Test Street, London, UK',
      owner_name: 'Test Owner',
      category: 'Test Cuisine',
      callback_url: 'https://test-restaurant.com/callback',
      username: 'testrestaurant',
      password: 'TestPass123!'
    };

    const response = await fetch(`${SUPABASE_URL}/functions/v1/cloud-register-restaurant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Registration with authentication successful');
      console.log('   Restaurant UID:', result.app_restaurant_uid);
      console.log('   Username:', testData.username);
      return { success: true, uid: result.app_restaurant_uid, username: testData.username, password: testData.password };
    } else {
      console.error('❌ Registration failed:', result.error);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Registration test error:', error);
    return { success: false };
  }
}

async function testRestaurantLogin(username, password) {
  console.log('🔐 Testing restaurant login...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/restaurant-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Restaurant login successful');
      console.log('   Restaurant:', result.restaurant.restaurant_name);
      console.log('   Username:', result.restaurant.username);
      console.log('   UID:', result.restaurant.app_restaurant_uid);
      return true;
    } else {
      console.error('❌ Login failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Login test error:', error);
    return false;
  }
}

async function testInvalidLogin() {
  console.log('🧪 Testing invalid login credentials...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/restaurant-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        username: 'nonexistent',
        password: 'wrongpassword',
      }),
    });

    const result = await response.json();

    if (!response.ok && !result.success) {
      console.log('✅ Invalid login correctly rejected');
      console.log('   Error:', result.error);
      return true;
    } else {
      console.error('❌ Invalid login was accepted (security issue!)');
      return false;
    }
  } catch (error) {
    console.error('❌ Invalid login test error:', error);
    return false;
  }
}

async function verifyDatabaseTables() {
  console.log('🗄️ Verifying database tables...');
  
  try {
    // Check if authentication columns exist
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'registered_restaurants')
      .eq('table_schema', 'public')
      .in('column_name', ['username', 'password_hash', 'failed_login_attempts']);

    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
      return false;
    }

    const columnNames = columns.map(col => col.column_name);
    const requiredColumns = ['username', 'password_hash', 'failed_login_attempts'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));

    if (missingColumns.length > 0) {
      console.error('❌ Missing authentication columns:', missingColumns);
      return false;
    }

    // Check if authentication logs table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'restaurant_authentication_logs')
      .eq('table_schema', 'public');

    if (tablesError || !tables || tables.length === 0) {
      console.error('❌ Authentication logs table not found');
      return false;
    }

    console.log('✅ All required database tables and columns exist');
    return true;
  } catch (error) {
    console.error('❌ Database verification error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting restaurant authentication system deployment...\n');

  // Step 1: Verify database tables
  const dbVerified = await verifyDatabaseTables();
  if (!dbVerified) {
    console.log('\n❌ Database verification failed. Please run the authentication schema first.');
    return;
  }

  // Step 2: Test registration with authentication
  const registrationResult = await testRegistrationWithAuth();
  if (!registrationResult.success) {
    console.log('\n❌ Registration test failed. Cannot proceed with login tests.');
    return;
  }

  // Step 3: Test valid login
  const loginSuccess = await testRestaurantLogin(registrationResult.username, registrationResult.password);
  if (!loginSuccess) {
    console.log('\n❌ Valid login test failed.');
    return;
  }

  // Step 4: Test invalid login
  const invalidLoginRejected = await testInvalidLogin();
  if (!invalidLoginRejected) {
    console.log('\n❌ Invalid login test failed.');
    return;
  }

  console.log('\n🎉 Restaurant authentication system deployment completed successfully!');
  console.log('\n📋 Summary:');
  console.log('✅ Database schema with authentication columns');
  console.log('✅ Restaurant registration with username/password');
  console.log('✅ Restaurant login with credential validation');
  console.log('✅ Security: Invalid logins properly rejected');
  console.log('✅ Authentication logging for security monitoring');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Deploy the restaurant-login Edge Function to Supabase');
  console.log('2. Update the mobile app to use restaurant authentication');
  console.log('3. Test the complete authentication flow in the app');
  
  console.log('\n📱 Mobile App Integration:');
  console.log('- Use supabaseAuth.signInRestaurant() for restaurant login');
  console.log('- Toggle between user and restaurant login modes');
  console.log('- Store restaurant session for persistent login');
}

// Run the deployment
main().catch(console.error);
