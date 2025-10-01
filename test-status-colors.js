// Test script to create sample orders and verify status colors and history functionality
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestOrders() {
  console.log('🧪 Creating test orders to verify status colors and history functionality...');
  
  try {
    // Create test orders with different statuses
    const testOrders = [
      {
        userId: '36730b7c-18dc-40f4-8ced-ce9887032fb3',
        orderNumber: 'TEST-APPROVED-001',
        stripeId: 'test-stripe-approved',
        amount: 2599, // $25.99
        status: 'approved',
        items: [
          { title: 'Test Burger (Approved)', quantity: 1, price: 1599 },
          { title: 'Test Fries (Approved)', quantity: 1, price: 599 },
          { title: 'Test Drink (Approved)', quantity: 1, price: 399 }
        ],
        user: { name: 'Test Customer (Approved)', phone: '+1234567890' },
        restaurant: { name: 'GBC Test Restaurant' },
        time: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        userId: '36730b7c-18dc-40f4-8ced-ce9887032fb3',
        orderNumber: 'TEST-CANCELLED-002',
        stripeId: 'test-stripe-cancelled',
        amount: 1899, // $18.99
        status: 'cancelled',
        items: [
          { title: 'Test Pizza (Cancelled)', quantity: 1, price: 1899 }
        ],
        user: { name: 'Test Customer (Cancelled)', phone: '+1234567891' },
        restaurant: { name: 'GBC Test Restaurant' },
        time: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        userId: '36730b7c-18dc-40f4-8ced-ce9887032fb3',
        orderNumber: 'TEST-PENDING-003',
        stripeId: 'test-stripe-pending',
        amount: 1299, // $12.99
        status: 'pending',
        items: [
          { title: 'Test Sandwich (Pending)', quantity: 1, price: 1299 }
        ],
        user: { name: 'Test Customer (Pending)', phone: '+1234567892' },
        restaurant: { name: 'GBC Test Restaurant' },
        time: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    console.log('\n📝 Creating test orders...');
    
    for (const order of testOrders) {
      const { data, error } = await supabase
        .from('orders')
        .insert(order)
        .select();
      
      if (error) {
        console.error(`❌ Failed to create order ${order.orderNumber}:`, error);
      } else {
        console.log(`✅ Created order ${order.orderNumber} with status: ${order.status}`);
      }
    }

    // Verify orders were created
    console.log('\n🔍 Verifying created orders...');
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .like('orderNumber', 'TEST-%')
      .order('createdAt', { ascending: false });

    if (fetchError) {
      console.error('❌ Failed to fetch test orders:', fetchError);
      return;
    }

    console.log(`📊 Found ${orders?.length || 0} test orders`);
    
    if (orders && orders.length > 0) {
      console.log('\n📋 Test Orders Summary:');
      orders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.orderNumber}`);
        console.log(`   Status: ${order.status} (Should show ${getExpectedColor(order.status)} in app)`);
        console.log(`   Amount: $${(order.amount / 100).toFixed(2)}`);
        console.log(`   Items: ${order.items.length} items`);
        console.log(`   Tab: Should appear in "${getExpectedTab(order.status)}" tab`);
        console.log('   ---');
      });

      console.log('\n🎨 Expected Status Colors:');
      console.log('✅ Approved orders: GREEN (#4CAF50)');
      console.log('❌ Cancelled orders: RED (#F44336)');
      console.log('⏳ Pending orders: GREY (#9E9E9E)');

      console.log('\n📂 Expected Tab Filtering:');
      console.log('• "All" tab: Shows all orders');
      console.log('• "Active" tab: Shows approved, preparing, ready orders');
      console.log('• "History" tab: Shows approved, cancelled, completed orders');
      console.log('• "New" tab: Shows pending, new orders');

      console.log('\n📱 Profile Metrics Test:');
      console.log('• When you approve a pending order in the app:');
      console.log('  - "Orders Today" count should increase by 1');
      console.log('  - "Today\'s Revenue" should increase by order amount');
      console.log('  - Changes should be visible immediately (real-time)');
    }

    console.log('\n🧪 Test Instructions:');
    console.log('1. Install the new APK on your device');
    console.log('2. Open the app and go to Home screen');
    console.log('3. Check that:');
    console.log('   - Approved orders show GREEN status badge');
    console.log('   - Cancelled orders show RED status badge');
    console.log('   - Pending orders show GREY status badge');
    console.log('4. Test tab filtering:');
    console.log('   - "History" tab should show approved and cancelled orders');
    console.log('   - "Active" tab should show approved orders');
    console.log('   - "New" tab should show pending orders');
    console.log('5. Test real-time metrics:');
    console.log('   - Go to Profile screen and note current metrics');
    console.log('   - Go back to Home and approve a pending order');
    console.log('   - Return to Profile and verify metrics increased');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

function getExpectedColor(status) {
  switch (status?.toLowerCase()) {
    case 'approved': return 'GREEN';
    case 'cancelled': return 'RED';
    case 'pending': return 'GREY';
    default: return 'GREY';
  }
}

function getExpectedTab(status) {
  switch (status?.toLowerCase()) {
    case 'approved': return 'Active & History';
    case 'cancelled': return 'History';
    case 'pending': return 'New';
    default: return 'All';
  }
}

createTestOrders().then(() => {
  console.log('\n✅ Test order creation completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
