// Verify the database schema directly
const fetch = require('node-fetch');

const supabaseUrl = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

async function verifySchema() {
  try {
    console.log('🔍 Verifying database schema...');
    
    // Try to get orders table info via PostgREST
    const response = await fetch(`${supabaseUrl}/rest/v1/orders?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Orders table accessible via PostgREST');
      console.log('📋 Sample data:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Orders table not accessible:', errorText);
    }

    // Try to insert a test record
    console.log('\n🧪 Testing direct insert...');
    const testOrder = {
      id: '12345678-1234-1234-1234-123456789013',
      userId: '36730b7c-18dc-40f4-8ced-ce9887032fb3',
      orderNumber: 'SCHEMA-VERIFY-002',
      amount: 29.99,
      status: 'pending',
      items: [{ title: 'Test Item', quantity: 1, price: 29.99 }],
      user: { customer_name: 'Schema Test User', customer_phone: '1234567890' },
      restaurant: { name: 'GBC Restaurant' },
      paymentMethod: 'app_order',
      currency: 'INR'
    };

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testOrder)
    });

    console.log('📊 Insert response status:', insertResponse.status);
    
    if (insertResponse.ok) {
      const insertedData = await insertResponse.json();
      console.log('✅ Test insert successful:', insertedData);
    } else {
      const insertErrorText = await insertResponse.text();
      console.log('❌ Test insert failed:', insertErrorText);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

verifySchema();
