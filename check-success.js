// Check if the order was actually created successfully
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSuccess() {
  console.log('🔍 Checking if orders are now working...\n');
  
  try {
    // 1. Check recent orders with restaurant_uid
    console.log('1️⃣ Checking recent orders with restaurant_uid:');
    const { data: recentOrders, error: recentError } = await supabase
      .from('orders')
      .select('orderNumber, restaurant_uid, website_restaurant_id, amount, status, createdAt')
      .order('createdAt', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('❌ Error fetching recent orders:', recentError.message);
      return;
    }

    console.log(`📦 Found ${recentOrders.length} recent orders:`);
    recentOrders.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.orderNumber}`);
      console.log(`      restaurant_uid: ${order.restaurant_uid || 'NULL'}`);
      console.log(`      website_restaurant_id: ${order.website_restaurant_id || 'NULL'}`);
      console.log(`      amount: ${order.amount}`);
      console.log(`      status: ${order.status}`);
      console.log(`      created: ${order.createdAt}`);
      console.log('');
    });

    // 2. Check orders filtered by our restaurant_uid
    console.log('2️⃣ Checking orders filtered by restaurant_uid:');
    const targetUid = '6e8fadce-f46b-48b2-b69c-86f5746cddaa';
    const { data: filteredOrders, error: filterError } = await supabase
      .from('orders')
      .select('orderNumber, restaurant_uid, amount, status, createdAt')
      .eq('restaurant_uid', targetUid)
      .order('createdAt', { ascending: false })
      .limit(10);

    if (filterError) {
      console.error('❌ Error fetching filtered orders:', filterError.message);
    } else {
      console.log(`📊 Found ${filteredOrders.length} orders for restaurant_uid '${targetUid}':`);
      if (filteredOrders.length === 0) {
        console.log('❌ NO ORDERS found for this restaurant_uid');
        console.log('   This means orders are still not appearing in the app');
      } else {
        console.log('✅ Orders found! These should appear in the app:');
        filteredOrders.forEach((order, index) => {
          console.log(`   ${index + 1}. ${order.orderNumber} - £${order.amount} - ${order.status}`);
          console.log(`      Created: ${order.createdAt}`);
        });
      }
    }

    // 3. Test creating a new order
    console.log('\n3️⃣ Testing new order creation:');
    
    const testPayload = {
      website_restaurant_id: '165',
      app_restaurant_uid: '6e8fadce-f46b-48b2-b69c-86f5746cddaa',
      orderNumber: '#SUCCESS-TEST-' + Date.now(),
      amount: 25.99,
      currency: 'GBP',
      status: 'pending',
      items: [
        {
          title: 'Success Test Item',
          quantity: 1,
          unitPrice: '25.99',
          customizations: []
        }
      ],
      user: {
        name: 'Success Test User',
        phone: '+447769906123'
      },
      restaurant: {
        name: 'General Billionaire\'s Canteen'
      },
      time: new Date().toISOString(),
      notes: 'Final success test',
      paymentMethod: 'website_order',
      callback_url: 'https://your-website.com/api/orders/callback',
      idempotency_key: 'success-test-' + Date.now()
    };

    console.log('📤 Creating test order...');
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

    if (response.status === 200 || response.status === 201) {
      console.log('\n✅ Order creation successful!');
      
      // Check the created order
      setTimeout(async () => {
        const { data: newOrder, error: newOrderError } = await supabase
          .from('orders')
          .select('orderNumber, restaurant_uid, website_restaurant_id, amount')
          .eq('orderNumber', testPayload.orderNumber)
          .single();

        if (newOrderError) {
          console.error('❌ Error fetching new order:', newOrderError.message);
        } else {
          console.log('✅ New order verified:');
          console.log('   Order Number:', newOrder.orderNumber);
          console.log('   Restaurant UID:', newOrder.restaurant_uid);
          console.log('   Website Restaurant ID:', newOrder.website_restaurant_id);
          console.log('   Amount:', newOrder.amount);
          
          if (newOrder.restaurant_uid === targetUid) {
            console.log('\n🎉 PERFECT! Order has correct restaurant_uid');
            console.log('🎉 ORDERS SHOULD NOW APPEAR IN THE RESTAURANT APP!');
          } else {
            console.log('\n❌ Order has wrong restaurant_uid');
          }
        }
        
        // Clean up
        await supabase.from('orders').delete().eq('orderNumber', testPayload.orderNumber);
        console.log('🧹 Test order cleaned up');
        
        console.log('\n📊 SUCCESS CHECK COMPLETE');
      }, 1000);
      
    } else {
      console.log('\n❌ Order creation failed');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkSuccess();
