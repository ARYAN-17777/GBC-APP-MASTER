#!/usr/bin/env node

/**
 * 🔄 REAL-TIME ORDER DELIVERY TEST
 *
 * This script tests real-time order delivery to ensure:
 * - Orders appear immediately in the correct restaurant app
 * - Real-time subscriptions are restaurant-scoped
 * - No cross-restaurant order delivery occurs
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🔄 REAL-TIME ORDER DELIVERY TEST');
console.log('=================================');

let allTestsPassed = true;
const issues = [];

async function testRealTimeDelivery() {
  try {
    console.log('\n1️⃣ Testing Real-Time Subscription Setup...');
    console.log('-------------------------------------------');

    const testRestaurantUID = `realtime-test-${Date.now()}`;
    let receivedOrders = [];
    let subscriptionActive = false;

    // Set up real-time subscription (simulating app behavior)
    const subscription = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_uid=eq.${testRestaurantUID}`
        },
        (payload) => {
          console.log('📨 Real-time order received:', payload.new.orderNumber);
          receivedOrders.push(payload.new);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          subscriptionActive = true;
          console.log('✅ Real-time subscription active');
        }
      });

    // Wait for subscription to be active
    await new Promise(resolve => {
      const checkSubscription = setInterval(() => {
        if (subscriptionActive) {
          clearInterval(checkSubscription);
          resolve();
        }
      }, 100);
    });

    console.log('\n2️⃣ Creating Test Order for Real-Time Delivery...');
    console.log('--------------------------------------------------');

    // Create test order that should trigger real-time delivery
    const testOrder = {
      orderNumber: `REALTIME-TEST-${Date.now()}`,
      amount: 35.75,
      status: 'pending',
      items: [
        {
          title: 'Real-Time Test Item',
          quantity: 1,
          price: 35.75
        }
      ],
      user: {
        name: 'Real-Time Test Customer',
        phone: '+44 123 456 7890',
        email: 'realtime@test.com'
      },
      restaurant: {
        name: 'Real-Time Test Restaurant'
      },
      restaurant_uid: testRestaurantUID,
      website_restaurant_id: 'realtime-website-test',
      paymentMethod: 'website_order',
      currency: 'GBP'
    };

    const { data: createdOrder, error: createError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select()
      .single();

    if (createError) {
      console.log('❌ Failed to create real-time test order:', createError.message);
      allTestsPassed = false;
      issues.push(`Real-time test order creation failed: ${createError.message}`);
    } else {
      console.log('✅ Real-time test order created successfully');
      console.log(`   Order ID: ${createdOrder.id}`);
      console.log(`   Restaurant UID: ${createdOrder.restaurant_uid}`);
    }

    console.log('\n3️⃣ Waiting for Real-Time Delivery...');
    console.log('--------------------------------------');

    // Wait for real-time delivery (up to 5 seconds)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check if order was received via real-time subscription
    const receivedOrder = receivedOrders.find(order => order.id === createdOrder.id);

    if (receivedOrder) {
      console.log('✅ Order delivered via real-time subscription!');
      console.log(`   Delivered Order: ${receivedOrder.orderNumber}`);
      console.log(`   Restaurant UID: ${receivedOrder.restaurant_uid}`);
      console.log(`   Delivery Time: < 5 seconds`);
    } else {
      console.log('❌ Order NOT delivered via real-time subscription');
      allTestsPassed = false;
      issues.push('Real-time order delivery failed - order not received via subscription');
    }

    // Clean up
    await supabase.from('orders').delete().eq('id', createdOrder.id);
    subscription.unsubscribe();
    console.log('✅ Test order cleaned up and subscription closed');

    console.log('\n4️⃣ Testing Cross-Restaurant Isolation...');
    console.log('-----------------------------------------');

    // Test that orders for different restaurants don't cross-contaminate
    const restaurant1UID = `isolation-test-1-${Date.now()}`;
    const restaurant2UID = `isolation-test-2-${Date.now()}`;

    let restaurant1Orders = [];
    let restaurant2Orders = [];

    // Set up subscriptions for both restaurants
    const sub1 = supabase
      .channel('restaurant-1-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_uid=eq.${restaurant1UID}`
      }, (payload) => {
        restaurant1Orders.push(payload.new);
      })
      .subscribe();

    const sub2 = supabase
      .channel('restaurant-2-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_uid=eq.${restaurant2UID}`
      }, (payload) => {
        restaurant2Orders.push(payload.new);
      })
      .subscribe();

    // Wait for subscriptions to be active
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create order for restaurant 1
    const order1 = {
      orderNumber: `ISOLATION-R1-${Date.now()}`,
      amount: 20.00,
      status: 'pending',
      items: [],
      user: {},
      restaurant: {},
      restaurant_uid: restaurant1UID,
      website_restaurant_id: 'isolation-website-1',
      paymentMethod: 'website_order',
      currency: 'GBP'
    };

    // Create order for restaurant 2
    const order2 = {
      orderNumber: `ISOLATION-R2-${Date.now()}`,
      amount: 30.00,
      status: 'pending',
      items: [],
      user: {},
      restaurant: {},
      restaurant_uid: restaurant2UID,
      website_restaurant_id: 'isolation-website-2',
      paymentMethod: 'website_order',
      currency: 'GBP'
    };

    const [result1, result2] = await Promise.all([
      supabase.from('orders').insert([order1]).select().single(),
      supabase.from('orders').insert([order2]).select().single()
    ]);

    // Wait for real-time delivery
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify isolation
    console.log(`   Restaurant 1 received: ${restaurant1Orders.length} orders`);
    console.log(`   Restaurant 2 received: ${restaurant2Orders.length} orders`);

    const restaurant1GotCorrectOrder = restaurant1Orders.some(order => order.restaurant_uid === restaurant1UID);
    const restaurant1GotWrongOrder = restaurant1Orders.some(order => order.restaurant_uid === restaurant2UID);
    const restaurant2GotCorrectOrder = restaurant2Orders.some(order => order.restaurant_uid === restaurant2UID);
    const restaurant2GotWrongOrder = restaurant2Orders.some(order => order.restaurant_uid === restaurant1UID);

    if (restaurant1GotCorrectOrder && !restaurant1GotWrongOrder &&
        restaurant2GotCorrectOrder && !restaurant2GotWrongOrder) {
      console.log('✅ Real-time isolation working correctly');
      console.log('   Each restaurant received only their own orders');
    } else {
      console.log('❌ Real-time isolation FAILED');
      allTestsPassed = false;
      issues.push('Real-time subscription isolation failed - cross-restaurant contamination detected');
    }

    // Clean up isolation test
    if (result1.data) await supabase.from('orders').delete().eq('id', result1.data.id);
    if (result2.data) await supabase.from('orders').delete().eq('id', result2.data.id);
    sub1.unsubscribe();
    sub2.unsubscribe();

    // Final Results
    console.log('\n📊 REAL-TIME DELIVERY TEST RESULTS');
    console.log('===================================');

    if (allTestsPassed && issues.length === 0) {
      console.log('🎉 ALL REAL-TIME TESTS PASSED!');
      console.log('');
      console.log('✅ Real-time subscriptions working correctly');
      console.log('✅ Orders delivered immediately to correct restaurant');
      console.log('✅ Restaurant isolation maintained in real-time');
      console.log('✅ No cross-restaurant order contamination');
      console.log('✅ System ready for production real-time usage');
      console.log('');
      console.log('🚀 REAL-TIME ORDER DELIVERY IS PRODUCTION READY!');
    } else {
      console.log('❌ REAL-TIME TESTS FAILED! Issues found:');
      console.log('');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }

  } catch (error) {
    console.error('❌ Real-time test execution failed:', error);
    allTestsPassed = false;
  }

  process.exit(allTestsPassed && issues.length === 0 ? 0 : 1);
}

// Run the real-time delivery tests
testRealTimeDelivery();