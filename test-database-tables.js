// Test to check if database tables exist by attempting a registration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

async function testDatabaseTables() {
  console.log('🗄️  Testing Database Tables...');
  
  try {
    const testData = {
      website_restaurant_id: `test_db_${Date.now()}`,
      restaurant_name: 'Database Test Restaurant',
      restaurant_phone: '+44 123 456 7890',
      restaurant_email: `dbtest_${Date.now()}@restaurant.com`,
      restaurant_address: '123 Database Test Street, London, UK',
      callback_url: 'https://database-test.com/callback'
    };

    const response = await fetch(`${SUPABASE_URL}/functions/v1/cloud-register-restaurant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'User-Agent': 'DatabaseTest/1.0'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (response.status === 201 && result.success) {
      console.log('✅ Database tables exist and registration works!');
      console.log(`   Generated UID: ${result.app_restaurant_uid}`);
      return true;
    } else if (result.error && result.error.includes('relation') && result.error.includes('does not exist')) {
      console.log('❌ Database tables are missing');
      console.log('📋 Need to deploy database schema manually');
      return false;
    } else if (result.error && result.error.includes('duplicate')) {
      console.log('✅ Database tables exist (duplicate error expected)');
      return true;
    } else {
      console.log('⚠️  Unexpected response - check logs');
      return false;
    }
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

async function main() {
  const tablesExist = await testDatabaseTables();
  
  if (!tablesExist) {
    console.log('\n📋 MANUAL DATABASE SCHEMA DEPLOYMENT REQUIRED');
    console.log('==============================================');
    console.log('The database tables need to be created manually.');
    console.log('Please run the SQL from cloud-restaurant-registration-schema.sql');
    console.log('in the Supabase dashboard SQL editor.');
    console.log('\nSteps:');
    console.log('1. Go to https://supabase.com/dashboard/project/evqmvmjnfeefeeizeljq/sql');
    console.log('2. Copy the contents of cloud-restaurant-registration-schema.sql');
    console.log('3. Paste and run the SQL in the editor');
    console.log('4. Re-run this test to verify');
  } else {
    console.log('\n✅ DATABASE READY FOR TESTING');
    console.log('============================');
    console.log('Database tables exist and are working correctly.');
    console.log('You can now run the full test suite:');
    console.log('node test-cloud-restaurant-registration.js');
  }
}

main();
