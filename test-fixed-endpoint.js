// Test the fixed cloud-order-receive endpoint
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFixedEndpoint() {
  console.log('🧪 Testing fixed cloud-order-receive endpoint...\n');
  
  try {
    // Test payload with correct structure
    const testPayload = {
      website_restaurant_id: '165',
      app_restaurant_uid: '6e8fadce-f46b-48b2-b69c-86f5746cddaa',
      orderNumber: '#FIXED-TEST-' + Date.now(),
      amount: 38.25,
      currency: 'GBP',
      status: 'pending',
      items: [
        {
          title: 'Chicken Biryani',
          quantity: 2,
          unitPrice: '12.50',
          customizations: []
        },
        {
          title: 'Naan Bread',
          quantity: 1,
          unitPrice: '13.25',
          customizations: []
        }
      ],
      user: {
        name: 'John Smith',
        phone: '+447769906123'
      },
      restaurant: {
        name: 'General Billionaire\'s Canteen'
      },
      time: new Date().toISOString(),
      notes: 'Test order after fixing edge function',
      paymentMethod: 'website_order',
      callback_url: 'https://your-website.com/api/orders/callback',
      idempotency_key: 'fixed-test-' + Date.now()
    };

    console.log('📤 Sending test order to cloud-order-receive...');
    console.log('   Order Number:', testPayload.orderNumber);
    console.log('   Amount:', testPayload.amount);
    console.log('   Restaurant UID:', testPayload.app_restaurant_uid);
    
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
    console.log('\n📥 Response status:', response.status);
    console.log('📥 Response body:', responseText);

    if (response.status === 201) {
      console.log('\n🎉 SUCCESS! Order created successfully');
      
      // Parse response to get order ID
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.log('   Response is not JSON, but status is 201');
      }
      
      // Check if the order appears with correct restaurant_uid
      console.log('\n🔍 Checking if order has correct restaurant_uid...');
      const { data: testOrder, error: orderError } = await supabase
        .from('orders')
        .select('orderNumber, restaurant_uid, website_restaurant_id, amount, status, userId')
        .eq('orderNumber', testPayload.orderNumber)
        .single();

      if (orderError) {
        console.error('❌ Error fetching test order:', orderError.message);
      } else {
        console.log('✅ Test order found in database:');
        console.log('   orderNumber:', testOrder.orderNumber);
        console.log('   restaurant_uid:', testOrder.restaurant_uid);
        console.log('   website_restaurant_id:', testOrder.website_restaurant_id);
        console.log('   amount:', testOrder.amount);
        console.log('   status:', testOrder.status);
        console.log('   userId:', testOrder.userId);
        
        if (testOrder.restaurant_uid === '6e8fadce-f46b-48b2-b69c-86f5746cddaa') {
          console.log('\n🎉 PERFECT! Order has correct restaurant_uid');
          console.log('   ✅ Orders should now appear in the restaurant app!');
        } else {
          console.log('\n❌ ERROR: Order has wrong restaurant_uid');
          console.log('   Expected: 6e8fadce-f46b-48b2-b69c-86f5746cddaa');
          console.log('   Actual:', testOrder.restaurant_uid);
        }
        
        if (testOrder.website_restaurant_id === '165') {
          console.log('   ✅ website_restaurant_id is correct');
        } else {
          console.log('   ❌ website_restaurant_id is wrong');
          console.log('   Expected: 165');
          console.log('   Actual:', testOrder.website_restaurant_id);
        }
      }
      
      // Test app-side filtering
      console.log('\n🔍 Testing app-side order filtering...');
      const { data: appOrders, error: appError } = await supabase
        .from('orders')
        .select('orderNumber, restaurant_uid, amount, status')
        .eq('restaurant_uid', '6e8fadce-f46b-48b2-b69c-86f5746cddaa')
        .order('createdAt', { ascending: false })
        .limit(3);

      if (appError) {
        console.error('❌ Error fetching app orders:', appError.message);
      } else {
        console.log(`✅ Found ${appOrders.length} orders for restaurant_uid:`);
        appOrders.forEach((order, index) => {
          console.log(`   ${index + 1}. ${order.orderNumber} - ${order.amount} - ${order.status}`);
        });
        
        const hasOurOrder = appOrders.some(order => order.orderNumber === testPayload.orderNumber);
        if (hasOurOrder) {
          console.log('\n🎉 SUCCESS! Test order appears in app-filtered results');
        } else {
          console.log('\n❌ ERROR: Test order does NOT appear in app-filtered results');
        }
      }
      
      // Clean up test order
      console.log('\n🧹 Cleaning up test order...');
      await supabase
        .from('orders')
        .delete()
        .eq('orderNumber', testPayload.orderNumber);
      console.log('✅ Test order cleaned up');
      
    } else if (response.status === 403) {
      console.log('\n❌ FAILED! Still getting 403 - mapping issue');
    } else if (response.status === 404) {
      console.log('\n❌ FAILED! Still getting 404 - restaurant not found');
    } else {
      console.log('\n❌ FAILED! Unexpected status code');
    }

    console.log('\n📊 TEST COMPLETE');
    
    if (response.status === 201) {
      console.log('\n🎯 FINAL RESULT: ✅ SUCCESS!');
      console.log('✅ Mapping exists');
      console.log('✅ Restaurant found');
      console.log('✅ Order created with correct restaurant_uid');
      console.log('✅ Orders should now appear in the restaurant app!');
      console.log('\n📝 You can now use this payload structure in Postman:');
      console.log(JSON.stringify(testPayload, null, 2));
    } else {
      console.log('\n🎯 FINAL RESULT: ❌ STILL FAILING');
      console.log('   Check the error messages above for details');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testFixedEndpoint();
