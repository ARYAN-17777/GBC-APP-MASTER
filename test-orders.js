// Test script to check order fetching
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderFetching() {
  console.log('🔍 Testing order fetching...');
  console.log('📡 Supabase URL:', supabaseUrl);
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('\n1️⃣ Testing Supabase connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('orders')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.error('❌ Connection failed:', healthError);
      return;
    }
    
    console.log('✅ Connected to Supabase successfully');
    console.log('📊 Total orders in database:', healthCheck);
    
    // Test 2: Fetch all orders
    console.log('\n2️⃣ Fetching all orders...');
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(10);
    
    if (fetchError) {
      console.error('❌ Failed to fetch orders:', fetchError);
      return;
    }
    
    console.log('✅ Orders fetched successfully');
    console.log('📋 Number of orders:', orders?.length || 0);
    
    if (orders && orders.length > 0) {
      console.log('\n📝 Sample orders:');
      orders.slice(0, 3).forEach((order, index) => {
        console.log(`${index + 1}. Order ID: ${order.id}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Amount: ${order.amount}`);
        console.log(`   Created: ${order.createdAt}`);
        console.log(`   Items: ${JSON.stringify(order.items)}`);
        console.log('   ---');
      });
    } else {
      console.log('📭 No orders found in database');
    }
    
    // Test 3: Test real-time subscription
    console.log('\n3️⃣ Testing real-time subscription...');
    const channel = supabase
      .channel('test-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        console.log('🔔 Real-time update received:', payload);
      })
      .subscribe();
    
    console.log('✅ Real-time subscription set up');
    
    // Clean up after 5 seconds
    setTimeout(() => {
      supabase.removeChannel(channel);
      console.log('🧹 Cleaned up subscription');
      process.exit(0);
    }, 5000);
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testOrderFetching();
