// Check current database schema to verify restaurant_uid column exists
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking current database schema...');
  
  try {
    // Check orders table structure by trying to select from it
    console.log('\n1️⃣ Checking orders table structure...');

    // Try to select a single order to see what columns exist
    const { data: sampleOrder, error: sampleError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    let hasRestaurantUid = false;
    let hasWebsiteRestaurantId = false;

    if (sampleError) {
      console.error('❌ Error accessing orders table:', sampleError);
    } else {
      console.log('✅ Orders table accessible');
      if (sampleOrder && sampleOrder.length > 0) {
        const columns = Object.keys(sampleOrder[0]);
        console.log('📋 Orders table columns:');
        columns.forEach(col => {
          console.log(`   - ${col}`);
        });

        hasRestaurantUid = columns.includes('restaurant_uid');
        hasWebsiteRestaurantId = columns.includes('website_restaurant_id');
      } else {
        // Try to insert a test order to see what columns are expected
        console.log('📋 No existing orders found, checking expected columns...');
        const testOrder = {
          orderNumber: 'SCHEMA-TEST-' + Date.now(),
          amount: 25.50,
          status: 'pending',
          items: [{"title": "Test Item", "quantity": 1, "price": 25.50}],
          user: {"name": "Test User", "phone": "1234567890"},
          restaurant: {"name": "Test Restaurant"},
          paymentMethod: 'website_order',
          currency: 'GBP'
        };

        // Try with restaurant_uid
        const { error: insertError } = await supabase
          .from('orders')
          .insert({...testOrder, restaurant_uid: 'test-uid'})
          .select();

        if (!insertError) {
          hasRestaurantUid = true;
          console.log('✅ restaurant_uid column exists (test insert successful)');

          // Clean up test order
          await supabase
            .from('orders')
            .delete()
            .eq('orderNumber', testOrder.orderNumber);
        } else {
          console.log('❌ restaurant_uid column missing or other error:', insertError.message);
        }
      }
    }

    console.log(`\n🔍 restaurant_uid column exists: ${hasRestaurantUid ? '✅ YES' : '❌ NO'}`);
    console.log(`🔍 website_restaurant_id column exists: ${hasWebsiteRestaurantId ? '✅ YES' : '❌ NO'}`);

    // Check existing orders
    console.log('\n2️⃣ Checking existing orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, orderNumber, restaurant_uid, website_restaurant_id, status, createdAt')
      .order('createdAt', { ascending: false })
      .limit(5);

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
    } else {
      console.log(`📦 Found ${orders.length} recent orders:`);
      orders.forEach(order => {
        console.log(`   - ${order.orderNumber}: restaurant_uid=${order.restaurant_uid || 'NULL'}, website_restaurant_id=${order.website_restaurant_id || 'NULL'}`);
      });
    }

    // Check restaurant mappings
    console.log('\n3️⃣ Checking restaurant mappings...');
    const { data: mappings, error: mappingsError } = await supabase
      .from('website_restaurant_mappings')
      .select('*')
      .eq('website_restaurant_id', '165')
      .eq('is_active', true);

    if (mappingsError) {
      console.error('❌ Error checking mappings:', mappingsError);
    } else {
      console.log(`🔗 Found ${mappings.length} active mappings for website_restaurant_id '165':`);
      mappings.forEach(mapping => {
        console.log(`   - app_restaurant_uid: ${mapping.app_restaurant_uid}`);
        console.log(`   - callback_url: ${mapping.callback_url}`);
        console.log(`   - is_active: ${mapping.is_active}`);
        console.log(`   - created_at: ${mapping.created_at}`);
      });
    }

    // Check restaurant registrations
    console.log('\n4️⃣ Checking restaurant registrations...');
    const { data: registrations, error: regError } = await supabase
      .from('restaurant_registrations')
      .select('*')
      .eq('restaurant_uid', '6e8fadce-f46b-48b2-b69c-86f5746cddaa');

    if (regError) {
      console.error('❌ Error checking registrations:', regError);
    } else {
      console.log(`🏪 Found ${registrations.length} registrations for restaurant_uid '6e8fadce-f46b-48b2-b69c-86f5746cddaa':`);
      registrations.forEach(reg => {
        console.log(`   - user_id: ${reg.user_id}`);
        console.log(`   - device_label: ${reg.device_label}`);
        console.log(`   - is_online: ${reg.is_online}`);
        console.log(`   - last_seen: ${reg.last_seen}`);
      });
    }

    // Summary
    console.log('\n📊 DIAGNOSIS SUMMARY:');
    if (!hasRestaurantUid) {
      console.log('❌ CRITICAL: restaurant_uid column is MISSING from orders table');
      console.log('   This is why orders are not appearing in the app!');
      console.log('   The app filters orders by restaurant_uid, but the column doesn\'t exist.');
    } else {
      console.log('✅ restaurant_uid column exists');
    }

    if (!hasWebsiteRestaurantId) {
      console.log('❌ WARNING: website_restaurant_id column is MISSING from orders table');
    } else {
      console.log('✅ website_restaurant_id column exists');
    }

    if (mappings && mappings.length === 0) {
      console.log('❌ CRITICAL: No active mapping found for website_restaurant_id "165"');
      console.log('   You need to complete the handshake process first!');
    }

    if (registrations && registrations.length === 0) {
      console.log('❌ CRITICAL: No restaurant registration found for app_restaurant_uid');
      console.log('   The restaurant needs to be registered in the app first!');
    }

  } catch (error) {
    console.error('❌ Error checking database schema:', error);
  }
}

checkDatabaseSchema();
