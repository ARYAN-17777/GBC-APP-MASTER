// Direct schema fix using SQL commands
const fetch = require('node-fetch');

const supabaseUrl = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

async function executeSQL(sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      },
      body: JSON.stringify({ sql_query: sql })
    });

    const result = await response.text();
    console.log('📊 SQL Response:', response.status, result);
    return { success: response.ok, result };
  } catch (error) {
    console.error('❌ SQL Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function fixSchema() {
  console.log('🔧 Starting schema fix...');
  
  // Step 1: Check current schema
  console.log('\n1️⃣ Checking current schema...');
  await executeSQL(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'orders' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);
  
  // Step 2: Add missing columns
  console.log('\n2️⃣ Adding missing columns...');
  
  const alterCommands = [
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);",
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paymentMethod TEXT DEFAULT 'app_order';",
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';",
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;",
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS time TEXT;"
  ];
  
  for (const cmd of alterCommands) {
    console.log(`Executing: ${cmd}`);
    await executeSQL(cmd);
  }
  
  // Step 3: Update any null amounts
  console.log('\n3️⃣ Updating null amounts...');
  await executeSQL("UPDATE public.orders SET amount = 0 WHERE amount IS NULL;");
  
  // Step 4: Make amount NOT NULL
  console.log('\n4️⃣ Making amount NOT NULL...');
  await executeSQL("ALTER TABLE public.orders ALTER COLUMN amount SET NOT NULL;");
  
  // Step 5: Verify final schema
  console.log('\n5️⃣ Verifying final schema...');
  await executeSQL(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'orders' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);
  
  console.log('\n✅ Schema fix completed!');
}

fixSchema();
