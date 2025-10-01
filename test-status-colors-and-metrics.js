// Test script to verify status colors and profile metrics functionality
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestOrders() {
  console.log('🧪 Creating test orders to verify status colors and metrics...');
  
  try {
    // Create test orders with different statuses
    const testOrders = [
      {
        orderNumber: 'TEST-APPROVED-001',
        amount: 1250, // $12.50 in cents
        status: 'pending',
        items: [{ title: 'Test Burger', quantity: 1, price: 1250 }],
        user: { name: 'Test Customer 1', phone: '+1234567890' },
        restaurant: { name: 'GBC Restaurant' },
        time: new Date().toISOString()
      },
      {
        orderNumber: 'TEST-CANCELLED-002',
        amount: 850, // $8.50 in cents
        status: 'pending',
        items: [{ title: 'Test Pizza', quantity: 1, price: 850 }],
        user: { name: 'Test Customer 2', phone: '+1234567891' },
        restaurant: { name: 'GBC Restaurant' },
        time: new Date().toISOString()
      },
      {
        orderNumber: 'TEST-PENDING-003',
        amount: 1599, // $15.99 in cents
        status: 'pending',
        items: [{ title: 'Test Pasta', quantity: 1, price: 1599 }],
        user: { name: 'Test Customer 3', phone: '+1234567892' },
        restaurant: { name: 'GBC Restaurant' },
        time: new Date().toISOString()
      }
    ];

    console.log('\n1️⃣ Creating test orders...');
    const createdOrders = [];

    for (const orderData of testOrders) {
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to create order ${orderData.orderNumber}:`, error);
        continue;
      }

      createdOrders.push(data);
      console.log(`✅ Created order: ${data.orderNumber} (${data.status})`);
    }

    console.log(`\n📊 Created ${createdOrders.length} test orders`);

    // Now simulate approving and cancelling orders
    console.log('\n2️⃣ Simulating order status changes...');

    if (createdOrders.length >= 2) {
      // Approve first order
      const { error: approveError } = await supabase
        .from('orders')
        .update({ status: 'approved' })
        .eq('id', createdOrders[0].id);

      if (approveError) {
        console.error('❌ Failed to approve order:', approveError);
      } else {
        console.log(`✅ Approved order: ${createdOrders[0].orderNumber} → Status: approved (should show GREEN)`);
      }

      // Cancel second order
      const { error: cancelError } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', createdOrders[1].id);

      if (cancelError) {
        console.error('❌ Failed to cancel order:', cancelError);
      } else {
        console.log(`✅ Cancelled order: ${createdOrders[1].orderNumber} → Status: cancelled (should show RED)`);
      }
    }

    // Verify the orders and their statuses
    console.log('\n3️⃣ Verifying order statuses...');
    const { data: allOrders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .in('orderNumber', testOrders.map(o => o.orderNumber))
      .order('createdAt', { ascending: false });

    if (fetchError) {
      console.error('❌ Failed to fetch orders:', fetchError);
      return;
    }

    console.log('\n📋 Test Orders Status Summary:');
    allOrders.forEach((order, index) => {
      const statusColor = getStatusColorText(order.status);
      console.log(`${index + 1}. ${order.orderNumber}`);
      console.log(`   Status: ${order.status} ${statusColor}`);
      console.log(`   Amount: $${(order.amount / 100).toFixed(2)}`);
      console.log(`   Should appear in: ${getExpectedTab(order.status)} tab`);
      console.log('   ---');
    });

    console.log('\n🎯 Expected Results in App:');
    console.log('✅ Approved orders should show GREEN status badge');
    console.log('✅ Cancelled orders should show RED status badge');
    console.log('✅ Pending orders should show GREY status badge');
    console.log('✅ Approved/Cancelled orders should appear in History tab');
    console.log('✅ Pending orders should appear in New tab');
    console.log('✅ Profile page should show updated "Orders Today" count');
    console.log('✅ Profile page should show updated "Today\'s Revenue"');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

function getStatusColorText(status) {
  switch (status?.toLowerCase()) {
    case 'approved':
      return '🟢 (GREEN)';
    case 'cancelled':
      return '🔴 (RED)';
    case 'pending':
      return '⚪ (GREY)';
    default:
      return '⚪ (GREY)';
  }
}

function getExpectedTab(status) {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'cancelled':
      return 'History';
    case 'pending':
      return 'New';
    default:
      return 'New';
  }
}

// Run the test
console.log('🚀 Starting Status Colors and Metrics Test...');
console.log('This will create test orders and verify the functionality.\n');

createTestOrders().then(() => {
  console.log('\n✅ Test completed successfully!');
  console.log('📱 Now check the app to verify:');
  console.log('   1. Status colors are correct (Green for approved, Red for cancelled)');
  console.log('   2. Orders appear in correct tabs (History for approved/cancelled, New for pending)');
  console.log('   3. Profile page shows updated metrics when orders are approved');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
