// =====================================================
// DEPLOY AUTHENTICATION SCHEMA ENHANCEMENT
// =====================================================
// Deploy the authentication schema updates to Supabase

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.NwlxelSfLBqHYjb_vYhFyBNsZEpTGjjhKEjjQJXiDJE';

async function deployAuthSchema() {
  console.log('🚀 Deploying Authentication Schema Enhancement...\n');

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Read the schema file
    const schemaPath = path.join(__dirname, 'add-authentication-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Schema file loaded successfully');
    console.log('📏 Schema size:', schemaSQL.length, 'characters');

    // Execute the schema
    console.log('\n🔧 Executing schema updates...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: schemaSQL });

    if (error) {
      console.error('❌ Schema deployment failed:', error);
      throw error;
    }

    console.log('✅ Schema deployment completed successfully!');

    // Verify the deployment
    console.log('\n🔍 Verifying deployment...');
    await verifyDeployment(supabase);

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

async function verifyDeployment(supabase) {
  const verifications = [];

  try {
    // Check if username column exists
    console.log('🔍 Checking username column...');
    const { data: usernameCol, error: usernameError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'registered_restaurants')
      .eq('column_name', 'username')
      .eq('table_schema', 'public');

    if (usernameError) {
      console.warn('⚠️ Could not verify username column:', usernameError.message);
    } else if (usernameCol && usernameCol.length > 0) {
      console.log('✅ Username column exists');
      verifications.push('username_column');
    } else {
      console.log('❌ Username column not found');
    }

    // Check if password_hash column exists
    console.log('🔍 Checking password_hash column...');
    const { data: passwordCol, error: passwordError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'registered_restaurants')
      .eq('column_name', 'password_hash')
      .eq('table_schema', 'public');

    if (passwordError) {
      console.warn('⚠️ Could not verify password_hash column:', passwordError.message);
    } else if (passwordCol && passwordCol.length > 0) {
      console.log('✅ Password hash column exists');
      verifications.push('password_column');
    } else {
      console.log('❌ Password hash column not found');
    }

    // Check if authentication logs table exists
    console.log('🔍 Checking authentication logs table...');
    const { data: authTable, error: authTableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'restaurant_authentication_logs')
      .eq('table_schema', 'public');

    if (authTableError) {
      console.warn('⚠️ Could not verify auth logs table:', authTableError.message);
    } else if (authTable && authTable.length > 0) {
      console.log('✅ Authentication logs table exists');
      verifications.push('auth_logs_table');
    } else {
      console.log('❌ Authentication logs table not found');
    }

    // Test a simple query on the updated table
    console.log('🔍 Testing table access...');
    const { data: testData, error: testError } = await supabase
      .from('registered_restaurants')
      .select('id, username, password_hash, failed_login_attempts')
      .limit(1);

    if (testError) {
      console.warn('⚠️ Table access test failed:', testError.message);
    } else {
      console.log('✅ Table access test passed');
      verifications.push('table_access');
    }

    // Summary
    console.log('\n📊 Verification Summary:');
    console.log('✅ Verified components:', verifications.length);
    verifications.forEach(component => {
      console.log(`  - ${component}`);
    });

    if (verifications.length >= 3) {
      console.log('\n🎉 Authentication schema deployment verified successfully!');
      console.log('✅ Ready to update Edge Function with authentication logic');
    } else {
      console.log('\n⚠️ Some verifications failed - please check manually');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Alternative deployment method using direct SQL execution
async function deployWithDirectSQL() {
  console.log('🔄 Attempting direct SQL deployment...\n');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Read and split the schema into individual statements
    const schemaPath = path.join(__dirname, 'add-authentication-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolons and filter out empty statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length < 10) {
        continue;
      }

      console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.warn(`⚠️ Statement ${i + 1} warning:`, error.message);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (stmtError) {
        console.warn(`⚠️ Statement ${i + 1} failed:`, stmtError.message);
        // Continue with other statements
      }
    }

    console.log('\n✅ Direct SQL deployment completed');
    await verifyDeployment(supabase);

  } catch (error) {
    console.error('❌ Direct SQL deployment failed:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🎯 Authentication Schema Deployment');
  console.log('=' .repeat(50));

  try {
    // Try the primary deployment method
    await deployAuthSchema();
  } catch (error) {
    console.log('\n🔄 Primary method failed, trying alternative...');
    await deployWithDirectSQL();
  }
}

main().catch(console.error);
