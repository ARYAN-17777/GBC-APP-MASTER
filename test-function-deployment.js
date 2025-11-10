// Quick test to verify Edge Function deployment
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

async function testFunctionDeployment() {
  console.log('🧪 Testing Edge Function Deployment...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cloud-register-restaurant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({}) // Empty body to trigger validation errors
    });

    const result = await response.json();
    console.log('✅ Function is accessible!');
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (result.error && result.error.includes('validation')) {
      console.log('✅ Function is working - validation errors expected with empty body');
      return true;
    } else if (result.error && result.error.includes('relation') && result.error.includes('does not exist')) {
      console.log('⚠️  Function is working but database tables are missing');
      console.log('📋 Need to deploy database schema');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Function test failed:', error.message);
    return false;
  }
}

testFunctionDeployment();
