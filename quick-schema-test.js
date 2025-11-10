// Quick test after schema deployment
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

async function quickTest() {
  console.log('🧪 Quick Schema Test...');
  
  const testData = {
    website_restaurant_id: `quick_test_${Date.now()}`,
    restaurant_name: 'Quick Test Restaurant',
    restaurant_phone: '+44 123 456 7890',
    restaurant_email: `quicktest_${Date.now()}@restaurant.com`,
    restaurant_address: '123 Quick Test Street, London, UK',
    callback_url: 'https://quicktest.com/callback'
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cloud-register-restaurant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.status === 201 && result.success) {
      console.log('✅ SCHEMA DEPLOYED SUCCESSFULLY!');
      console.log('✅ Registration system is working!');
      console.log(`   Generated UID: ${result.app_restaurant_uid}`);
      console.log('\n🎉 Ready for Postman testing!');
      return true;
    } else {
      console.log('❌ Schema deployment issue:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

quickTest();
