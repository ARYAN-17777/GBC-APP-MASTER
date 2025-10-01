// Script to clear all existing orders from the database
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllOrders() {
  console.log('🗑️ Clearing all orders from database...');
  console.log('📡 Supabase URL:', supabaseUrl);
  
  try {
    // First, check how many orders exist
    console.log('\n1️⃣ Checking existing orders...');
    const { data: existingOrders, error: countError } = await supabase
      .from('orders')
      .select('id, orderNumber, status, createdAt')
      .order('createdAt', { ascending: false });
    
    if (countError) {
      console.error('❌ Failed to fetch existing orders:', countError);
      return;
    }
    
    console.log(`📊 Found ${existingOrders?.length || 0} orders to delete`);
    
    if (existingOrders && existingOrders.length > 0) {
      console.log('\n📝 Orders to be deleted:');
      existingOrders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.orderNumber || order.id} - ${order.status} (${order.createdAt})`);
      });
      
      // Delete all orders
      console.log('\n2️⃣ Deleting all orders...');
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all orders (using a condition that matches all)
      
      if (deleteError) {
        console.error('❌ Failed to delete orders:', deleteError);
        return;
      }
      
      console.log('✅ All orders deleted successfully');
      
      // Verify deletion
      console.log('\n3️⃣ Verifying deletion...');
      const { data: remainingOrders, error: verifyError } = await supabase
        .from('orders')
        .select('count', { count: 'exact', head: true });
      
      if (verifyError) {
        console.error('❌ Failed to verify deletion:', verifyError);
        return;
      }
      
      console.log(`📊 Remaining orders: ${remainingOrders || 0}`);
      
      if (remainingOrders === 0) {
        console.log('🎉 Database successfully cleared of all orders!');
      } else {
        console.log(`⚠️ ${remainingOrders} orders still remain in database`);
      }
      
    } else {
      console.log('📭 No orders found in database - already clean!');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Confirm before deletion
console.log('⚠️ WARNING: This will delete ALL orders from the database!');
console.log('This action cannot be undone.');
console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...');

setTimeout(() => {
  clearAllOrders().then(() => {
    console.log('\n✅ Order clearing operation completed');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Order clearing failed:', error);
    process.exit(1);
  });
}, 5000);
