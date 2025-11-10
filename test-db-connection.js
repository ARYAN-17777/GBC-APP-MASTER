// Test database connection and check current schema
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.NwlxelSfLBqHYjb_vYhFyBNsZEpTGjjhKEjjQJXiDJE';

async function testConnection() {
  console.log('🔌 Testing database connection...\n');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Test basic connection
    console.log('📊 Checking registered_restaurants table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'registered_restaurants')
      .eq('table_schema', 'public')
      .order('column_name');

    if (columnsError) {
      console.error('❌ Failed to get table structure:', columnsError);
      return;
    }

    console.log('✅ Current table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if authentication columns already exist
    const authColumns = ['username', 'password_hash', 'failed_login_attempts', 'account_locked_until', 'last_login_at'];
    const existingAuthColumns = columns.filter(col => authColumns.includes(col.column_name));

    console.log('\n🔐 Authentication columns status:');
    authColumns.forEach(authCol => {
      const exists = existingAuthColumns.find(col => col.column_name === authCol);
      if (exists) {
        console.log(`  ✅ ${authCol}: EXISTS (${exists.data_type})`);
      } else {
        console.log(`  ❌ ${authCol}: MISSING`);
      }
    });

    // Check if authentication logs table exists
    console.log('\n📋 Checking authentication logs table...');
    const { data: authTable, error: authTableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'restaurant_authentication_logs')
      .eq('table_schema', 'public');

    if (authTableError) {
      console.error('❌ Failed to check auth logs table:', authTableError);
    } else if (authTable && authTable.length > 0) {
      console.log('✅ restaurant_authentication_logs table EXISTS');
    } else {
      console.log('❌ restaurant_authentication_logs table MISSING');
    }

    // Test a simple query
    console.log('\n🧪 Testing table access...');
    const { data: testData, error: testError } = await supabase
      .from('registered_restaurants')
      .select('id, website_restaurant_id, restaurant_name')
      .limit(3);

    if (testError) {
      console.error('❌ Table access test failed:', testError);
    } else {
      console.log(`✅ Table access test passed (${testData.length} records found)`);
      if (testData.length > 0) {
        console.log('Sample record:', testData[0]);
      }
    }

    console.log('\n🎯 Next Steps:');
    if (existingAuthColumns.length === 0) {
      console.log('📝 Need to add authentication columns to registered_restaurants table');
      console.log('📝 Need to create restaurant_authentication_logs table');
      console.log('📝 Copy and run simple-auth-schema.sql in Supabase SQL Editor');
    } else {
      console.log('✅ Authentication schema appears to be already deployed');
      console.log('✅ Ready to update Edge Function with authentication logic');
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testConnection();
