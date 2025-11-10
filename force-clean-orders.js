// Force clean all orders from database
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function forceCleanOrders() {
  console.log('🧹 FORCE CLEANING ALL ORDERS FROM DATABASE');
  console.log('==========================================\n');

  try {
    // First, let's see what columns exist in the orders table
    console.log('🔍 STEP 1: CHECKING ORDERS TABLE STRUCTURE');
    console.log('==========================================');
    
    const { data: sampleOrder, error: sampleError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log('❌ Error accessing orders table:', sampleError.message);
      return false;
    }
    
    if (sampleOrder && sampleOrder.length > 0) {
      console.log('📋 Orders table columns:', Object.keys(sampleOrder[0]));
      console.log('📊 Sample order:', JSON.stringify(sampleOrder[0], null, 2));
    }

    // Get total count
    console.log('\n📊 STEP 2: GETTING CURRENT ORDER COUNT');
    console.log('======================================');
    
    const { count, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Error counting orders:', countError.message);
      return false;
    }
    
    console.log(`📋 Total orders in database: ${count}`);

    if (count === 0) {
      console.log('✅ Database is already clean - no orders to delete');
      return true;
    }

    // Force delete all orders
    console.log('\n🗑️  STEP 3: FORCE DELETING ALL ORDERS');
    console.log('=====================================');
    
    console.log(`🔄 Attempting to delete all ${count} orders...`);
    
    // Try different deletion approaches
    let deleteSuccess = false;
    
    // Approach 1: Delete with a condition that matches all rows
    try {
      const { error: deleteError1 } = await supabase
        .from('orders')
        .delete()
        .not('id', 'is', null); // This should match all rows since id is never null
      
      if (!deleteError1) {
        console.log('✅ Method 1: Successfully deleted all orders');
        deleteSuccess = true;
      } else {
        console.log('⚠️  Method 1 failed:', deleteError1.message);
      }
    } catch (error) {
      console.log('⚠️  Method 1 error:', error.message);
    }

    // Approach 2: If method 1 failed, try deleting in batches
    if (!deleteSuccess) {
      try {
        console.log('🔄 Trying batch deletion...');
        
        // Get all order IDs
        const { data: allOrders, error: getAllError } = await supabase
          .from('orders')
          .select('id');
        
        if (getAllError) {
          console.log('❌ Could not get order IDs:', getAllError.message);
        } else if (allOrders && allOrders.length > 0) {
          console.log(`📋 Found ${allOrders.length} orders to delete`);
          
          // Delete in batches of 100
          const batchSize = 100;
          for (let i = 0; i < allOrders.length; i += batchSize) {
            const batch = allOrders.slice(i, i + batchSize);
            const batchIds = batch.map(order => order.id);
            
            console.log(`🔄 Deleting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allOrders.length/batchSize)} (${batch.length} orders)...`);
            
            const { error: batchDeleteError } = await supabase
              .from('orders')
              .delete()
              .in('id', batchIds);
            
            if (batchDeleteError) {
              console.log(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, batchDeleteError.message);
            } else {
              console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} deleted successfully`);
            }
          }
          deleteSuccess = true;
        }
      } catch (error) {
        console.log('⚠️  Batch deletion error:', error.message);
      }
    }

    // Verify deletion
    console.log('\n✅ STEP 4: VERIFYING DELETION');
    console.log('=============================');
    
    const { count: finalCount, error: finalCountError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    if (finalCountError) {
      console.log('❌ Error verifying deletion:', finalCountError.message);
      return false;
    }
    
    console.log(`📊 Orders remaining after cleanup: ${finalCount}`);
    
    if (finalCount === 0) {
      console.log('🎉 SUCCESS: All orders deleted successfully!');
      console.log('✅ Database is now clean and ready for fresh APK build');
      console.log('📱 The app will show an empty order panel');
      return true;
    } else {
      console.log(`⚠️  Warning: ${finalCount} orders still remain in database`);
      console.log('   This might require manual cleanup in Supabase dashboard');
      return false;
    }

  } catch (error) {
    console.error('❌ Force cleanup failed:', error.message);
    return false;
  }
}

// Run the force cleanup
forceCleanOrders();
