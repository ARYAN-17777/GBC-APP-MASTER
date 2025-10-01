/**
 * Create Test Orders for Button Functionality Testing
 * This script creates test orders with different statuses to verify button functionality
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

console.log('🧪 CREATING TEST ORDERS FOR BUTTON FUNCTIONALITY');
console.log('===============================================');

async function createTestOrders() {
  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('✅ Connected to Supabase');
    
    // Clear existing test orders first
    console.log('\n🧹 Clearing existing test orders...');
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .like('orderNumber', 'BUTTON-TEST-%');
    
    if (deleteError) {
      console.log('⚠️ Warning: Could not clear existing test orders:', deleteError.message);
    } else {
      console.log('✅ Existing test orders cleared');
    }
    
    // Create test orders with different statuses
    const testOrders = [
      {
        orderNumber: 'BUTTON-TEST-001',
        amount: 1250, // $12.50
        status: 'pending',
        items: [
          { title: 'Test Burger', quantity: 1, price: 1250 }
        ],
        user: { name: 'Test User 1', phone: '1234567890', email: 'test1@example.com' },
        restaurant: { name: 'GBC Test Restaurant' },
        userId: '36730b7c-18dc-40f4-8ced-ce9887032fb3',
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleTimeString()
      },
      {
        orderNumber: 'BUTTON-TEST-002',
        amount: 850, // $8.50
        status: 'pending',
        items: [
          { title: 'Test Pizza', quantity: 1, price: 850 }
        ],
        user: { name: 'Test User 2', phone: '0987654321', email: 'test2@example.com' },
        restaurant: { name: 'GBC Test Restaurant' },
        userId: '36730b7c-18dc-40f4-8ced-ce9887032fb3',
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleTimeString()
      },
      {
        orderNumber: 'BUTTON-TEST-003',
        amount: 650, // $6.50
        status: 'pending',
        items: [
          { title: 'Test Salad', quantity: 1, price: 650 }
        ],
        user: { name: 'Test User 3', phone: '5555555555', email: 'test3@example.com' },
        restaurant: { name: 'GBC Test Restaurant' },
        userId: '36730b7c-18dc-40f4-8ced-ce9887032fb3',
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleTimeString()
      }
    ];
    
    console.log('\n📝 Creating test orders...');
    
    for (let i = 0; i < testOrders.length; i++) {
      const order = testOrders[i];
      console.log(`\n🔄 Creating order ${i + 1}/3: ${order.orderNumber}`);
      
      const { data, error } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Failed to create ${order.orderNumber}:`, error.message);
      } else {
        console.log(`✅ Created ${order.orderNumber} with ID: ${data.id}`);
        console.log(`   Status: ${data.status}, Amount: $${(data.amount / 100).toFixed(2)}`);
      }
    }
    
    console.log('\n📊 Verifying created orders...');
    
    // Verify the orders were created
    const { data: createdOrders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .like('orderNumber', 'BUTTON-TEST-%')
      .order('createdAt', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Failed to verify orders:', fetchError.message);
    } else {
      console.log(`✅ Verified ${createdOrders.length} test orders created:`);
      createdOrders.forEach(order => {
        console.log(`   ${order.orderNumber}: ${order.status} - $${(order.amount / 100).toFixed(2)}`);
      });
    }
    
    console.log('\n🎯 TEST ORDERS READY FOR BUTTON TESTING');
    console.log('=====================================');
    console.log('📱 Instructions for testing:');
    console.log('1. Open the GBC Canteen app');
    console.log('2. Go to the "New" tab - you should see 3 test orders');
    console.log('3. Click "Approve" on BUTTON-TEST-001');
    console.log('4. Click "Cancel" on BUTTON-TEST-002');
    console.log('5. Click "Print" on BUTTON-TEST-003');
    console.log('6. Check console logs for debugging output');
    console.log('7. Verify orders move to correct tabs (Active/History)');
    console.log('8. Check Profile page for updated metrics');
    
    console.log('\n🔍 Expected Results:');
    console.log('✅ BUTTON-TEST-001: Should move to Active + History tabs');
    console.log('✅ BUTTON-TEST-002: Should move to History tab only');
    console.log('✅ BUTTON-TEST-003: Should trigger print function');
    console.log('✅ Profile metrics should increment for approved order');
    console.log('✅ Console should show detailed debugging output');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
createTestOrders();
