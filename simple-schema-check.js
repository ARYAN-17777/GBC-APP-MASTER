// Simple schema check to verify restaurant_uid column exists
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');
  
  try {
    // 1. Check if we can access orders table
    console.log('1️⃣ Testing orders table access...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (ordersError) {
      console.error('❌ Cannot access orders table:', ordersError.message);
      return;
    }
    
    console.log('✅ Orders table accessible');
    
    // 2. Check columns by examining existing data
    if (orders && orders.length > 0) {
      const columns = Object.keys(orders[0]);
      console.log('\n📋 Available columns:');
      columns.forEach(col => console.log(`   - ${col}`));
      
      const hasRestaurantUid = columns.includes('restaurant_uid');
      const hasWebsiteRestaurantId = columns.includes('website_restaurant_id');
      
      console.log(`\n🔍 restaurant_uid: ${hasRestaurantUid ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`🔍 website_restaurant_id: ${hasWebsiteRestaurantId ? '✅ EXISTS' : '❌ MISSING'}`);
      
      if (!hasRestaurantUid) {
        console.log('\n❌ CRITICAL ISSUE: restaurant_uid column is missing!');
        console.log('   This is why orders are not appearing in the app.');
        console.log('   The app filters by restaurant_uid but the column doesn\'t exist.');
      }
    } else {
      console.log('\n📋 No existing orders found. Testing column existence...');
      
      // Try to insert with restaurant_uid to test if column exists
      const testOrder = {
        orderNumber: 'TEST-' + Date.now(),
        amount: 1.00,
        status: 'pending',
        items: [{"title": "Test", "quantity": 1, "price": 1.00}],
        user: {"name": "Test", "phone": "123"},
        restaurant: {"name": "Test"},
        restaurant_uid: 'test-uid-123'
      };
      
      const { error: insertError } = await supabase
        .from('orders')
        .insert(testOrder);
      
      if (insertError) {
        if (insertError.message.includes('restaurant_uid')) {
          console.log('❌ restaurant_uid column does NOT exist');
        } else {
          console.log('❌ Insert error:', insertError.message);
        }
      } else {
        console.log('✅ restaurant_uid column exists');
        // Clean up
        await supabase.from('orders').delete().eq('orderNumber', testOrder.orderNumber);
      }
    }
    
    // 3. Check restaurant mappings
    console.log('\n2️⃣ Checking restaurant mappings...');
    const { data: mappings, error: mappingError } = await supabase
      .from('website_restaurant_mappings')
      .select('*')
      .eq('website_restaurant_id', '165');
    
    if (mappingError) {
      console.error('❌ Cannot access mappings table:', mappingError.message);
    } else {
      console.log(`📊 Found ${mappings.length} mappings for website_restaurant_id '165'`);
      if (mappings.length === 0) {
        console.log('❌ No mapping found! You need to complete handshake first.');
      } else {
        mappings.forEach(m => {
          console.log(`   - app_restaurant_uid: ${m.app_restaurant_uid}`);
          console.log(`   - is_active: ${m.is_active}`);
        });
      }
    }
    
    // 4. Check recent orders with restaurant_uid
    console.log('\n3️⃣ Checking recent orders...');
    const { data: recentOrders, error: recentError } = await supabase
      .from('orders')
      .select('orderNumber, restaurant_uid, website_restaurant_id, status, createdAt')
      .order('createdAt', { ascending: false })
      .limit(3);
    
    if (recentError) {
      console.error('❌ Cannot fetch recent orders:', recentError.message);
    } else {
      console.log(`📦 Found ${recentOrders.length} recent orders:`);
      recentOrders.forEach(order => {
        console.log(`   - ${order.orderNumber}: restaurant_uid=${order.restaurant_uid || 'NULL'}`);
      });
    }
    
    console.log('\n📊 DIAGNOSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkSchema();
