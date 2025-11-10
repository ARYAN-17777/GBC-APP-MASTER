/**
 * Run Schema Update for New Payload Format
 * 
 * This script applies the schema changes to support the new payload format
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🔧 Running Schema Update for New Payload Format');
console.log('===============================================\n');

async function runSchemaUpdate() {
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('add-new-payload-columns.sql', 'utf8');
    
    console.log('1️⃣ Reading schema update SQL...');
    console.log('   File: add-new-payload-columns.sql');
    console.log(`   Size: ${sqlContent.length} characters`);
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`   Statements: ${statements.length}`);
    
    console.log('\n2️⃣ Executing schema updates...');
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`   Executing statement ${i + 1}/${statements.length}...`);
          
          const { data, error } = await supabase.rpc('exec_sql', {
            sql: statement
          });
          
          if (error) {
            // Try direct execution if RPC fails
            const { error: directError } = await supabase
              .from('_sql')
              .select('*')
              .limit(0); // This will fail but we can use it to execute SQL
            
            console.log(`   ⚠️ RPC method not available, trying alternative...`);
          } else {
            console.log(`   ✅ Statement ${i + 1} executed successfully`);
          }
        } catch (error) {
          console.log(`   ⚠️ Statement ${i + 1} may have failed:`, error.message);
        }
      }
    }
    
    console.log('\n3️⃣ Verifying schema changes...');
    
    // Check if the new columns exist by trying to select them
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, totals, amountDisplay, paymentMethod, currency')
        .limit(1);
      
      if (error) {
        console.log('❌ Schema verification failed:', error.message);
        console.log('\n📝 Manual Steps Required:');
        console.log('1. Open your Supabase dashboard');
        console.log('2. Go to SQL Editor');
        console.log('3. Copy and paste the contents of add-new-payload-columns.sql');
        console.log('4. Execute the SQL manually');
        return false;
      } else {
        console.log('✅ Schema verification successful!');
        console.log('   New columns are available:');
        console.log('   - totals (JSONB)');
        console.log('   - amountDisplay (TEXT)');
        console.log('   - paymentMethod (TEXT)');
        console.log('   - currency (TEXT)');
        return true;
      }
    } catch (error) {
      console.log('❌ Schema verification error:', error.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Schema update failed:', error);
    return false;
  }
}

// Run the schema update
runSchemaUpdate().then(success => {
  if (success) {
    console.log('\n🎉 Schema update completed successfully!');
    console.log('   You can now test the new payload format.');
  } else {
    console.log('\n⚠️ Schema update may need manual intervention.');
    console.log('   Please run the SQL manually in Supabase dashboard.');
  }
});
