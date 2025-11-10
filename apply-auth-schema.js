// =====================================================
// APPLY AUTHENTICATION SCHEMA TO SUPABASE
// =====================================================
// This script applies the authentication schema to the Supabase database

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyAuthSchema() {
  console.log('🔐 Applying authentication schema to database...');
  
  try {
    // Read the authentication schema SQL
    const authSql = fs.readFileSync('add-authentication-schema.sql', 'utf8');
    
    // Split SQL into individual statements
    const statements = authSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('DO $$') || statement.includes('BEGIN') || statement.includes('END $$')) {
        // Skip verification blocks for now
        console.log(`⏭️  Skipping verification block ${i + 1}`);
        continue;
      }
      
      try {
        console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err);
        // Continue with other statements
      }
    }
    
    console.log('✅ Authentication schema application completed');
    return true;
  } catch (error) {
    console.error('❌ Schema application failed:', error);
    return false;
  }
}

async function verifySchema() {
  console.log('🔍 Verifying authentication schema...');
  
  try {
    // Check if username column exists
    const { data: usernameCol, error: usernameError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'registered_restaurants')
      .eq('column_name', 'username')
      .eq('table_schema', 'public');
    
    if (usernameError || !usernameCol || usernameCol.length === 0) {
      console.log('❌ Username column not found, applying schema...');
      return false;
    }
    
    // Check if password_hash column exists
    const { data: passwordCol, error: passwordError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'registered_restaurants')
      .eq('column_name', 'password_hash')
      .eq('table_schema', 'public');
    
    if (passwordError || !passwordCol || passwordCol.length === 0) {
      console.log('❌ Password hash column not found, applying schema...');
      return false;
    }
    
    // Check if authentication logs table exists
    const { data: authTable, error: authTableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'restaurant_authentication_logs')
      .eq('table_schema', 'public');
    
    if (authTableError || !authTable || authTable.length === 0) {
      console.log('❌ Authentication logs table not found, applying schema...');
      return false;
    }
    
    console.log('✅ Authentication schema is already applied');
    return true;
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting authentication schema deployment...\n');
  
  // First verify if schema is already applied
  const schemaExists = await verifySchema();
  
  if (!schemaExists) {
    // Apply the schema
    const applied = await applyAuthSchema();
    
    if (applied) {
      // Verify again
      const verified = await verifySchema();
      if (verified) {
        console.log('\n🎉 Authentication schema successfully applied and verified!');
      } else {
        console.log('\n❌ Schema application may have failed. Please check manually.');
      }
    }
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Test restaurant registration with username/password');
  console.log('2. Test restaurant login functionality');
  console.log('3. Update mobile app to use restaurant authentication');
}

main().catch(console.error);
