// Create the missing restaurant mapping to fix order visibility
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMapping() {
  console.log('🔧 Creating restaurant mapping...\n');
  
  try {
    // Create the mapping
    const mappingData = {
      website_restaurant_id: '165',
      app_restaurant_uid: '6e8fadce-f46b-48b2-b69c-86f5746cddaa',
      is_active: true,
      callback_url: 'https://your-website.com/api/orders/callback',
      created_at: new Date().toISOString()
    };

    console.log('📝 Creating mapping with data:');
    console.log('   website_restaurant_id:', mappingData.website_restaurant_id);
    console.log('   app_restaurant_uid:', mappingData.app_restaurant_uid);
    console.log('   is_active:', mappingData.is_active);
    console.log('   callback_url:', mappingData.callback_url);

    const { data: newMapping, error: createError } = await supabase
      .from('website_restaurant_mappings')
      .insert(mappingData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating mapping:', createError.message);
      return;
    }

    console.log('\n✅ Mapping created successfully!');
    console.log('   Mapping ID:', newMapping.id);
    console.log('   Created at:', newMapping.created_at);

    // Verify the mapping was created
    console.log('\n🔍 Verifying mapping...');
    const { data: verifyMapping, error: verifyError } = await supabase
      .from('website_restaurant_mappings')
      .select('*')
      .eq('website_restaurant_id', '165')
      .eq('app_restaurant_uid', '6e8fadce-f46b-48b2-b69c-86f5746cddaa')
      .eq('is_active', true)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying mapping:', verifyError.message);
    } else {
      console.log('✅ Mapping verified successfully!');
      console.log('   ID:', verifyMapping.id);
      console.log('   website_restaurant_id:', verifyMapping.website_restaurant_id);
      console.log('   app_restaurant_uid:', verifyMapping.app_restaurant_uid);
      console.log('   is_active:', verifyMapping.is_active);
    }

    // Now test the cloud-order-receive endpoint
    console.log('\n🧪 Testing cloud-order-receive endpoint...');
    
    const testPayload = {
      website_restaurant_id: '165',
      app_restaurant_uid: '6e8fadce-f46b-48b2-b69c-86f5746cddaa',
      orderNumber: '#TEST-' + Date.now(),
      amount: 25.50,
      currency: 'GBP',
      status: 'pending',
      items: [
        {
          title: 'Test Item',
          quantity: 1,
          unitPrice: '25.50',
          customizations: []
        }
      ],
      user: {
        name: 'Test User',
        phone: '+447769906123'
      },
      restaurant: {
        name: 'General Billionaire\'s Canteen'
      },
      time: new Date().toISOString(),
      notes: null,
      paymentMethod: 'website_order',
      callback_url: 'https://your-website.com/api/orders/callback',
      idempotency_key: 'test-' + Date.now()
    };

    console.log('📤 Sending test order to cloud-order-receive...');
    
    const response = await fetch('https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-order-receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify(testPayload)
    });

    const responseText = await response.text();
    console.log('📥 Response status:', response.status);
    console.log('📥 Response body:', responseText);

    if (response.status === 201) {
      console.log('\n✅ SUCCESS! Order created successfully');
      
      // Check if the order appears with correct restaurant_uid
      console.log('\n🔍 Checking if order has correct restaurant_uid...');
      const { data: testOrder, error: orderError } = await supabase
        .from('orders')
        .select('orderNumber, restaurant_uid, website_restaurant_id')
        .eq('orderNumber', testPayload.orderNumber)
        .single();

      if (orderError) {
        console.error('❌ Error fetching test order:', orderError.message);
      } else {
        console.log('✅ Test order found:');
        console.log('   orderNumber:', testOrder.orderNumber);
        console.log('   restaurant_uid:', testOrder.restaurant_uid);
        console.log('   website_restaurant_id:', testOrder.website_restaurant_id);
        
        if (testOrder.restaurant_uid === '6e8fadce-f46b-48b2-b69c-86f5746cddaa') {
          console.log('\n🎉 PERFECT! Order has correct restaurant_uid');
          console.log('   Orders should now appear in the restaurant app!');
        } else {
          console.log('\n❌ ERROR: Order has wrong restaurant_uid');
        }
      }
      
      // Clean up test order
      await supabase
        .from('orders')
        .delete()
        .eq('orderNumber', testPayload.orderNumber);
      console.log('🧹 Test order cleaned up');
      
    } else {
      console.log('\n❌ FAILED! Order creation failed');
      console.log('   Check the response above for details');
    }

    console.log('\n📊 MAPPING CREATION COMPLETE');
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Use the correct endpoint: https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-order-receive');
    console.log('2. Use the payload structure from the documentation');
    console.log('3. Orders should now appear in the restaurant app!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createMapping();
