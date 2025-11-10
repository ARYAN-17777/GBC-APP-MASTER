const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🗄️ DATABASE CLEANUP - REMOVING TEST/DEMO ORDERS\n');

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupTestOrders() {
  try {
    console.log('🔍 Step 1: Connecting to Supabase database...');
    console.log(`   Database URL: ${supabaseUrl}`);
    
    // Test connection by fetching database info
    const { count: totalCount, error: connectionError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (connectionError) {
      console.error('❌ Failed to connect to database:', connectionError.message);
      process.exit(1);
    }

    console.log('✅ Successfully connected to Supabase database');
    console.log(`   Total orders in database: ${totalCount || 0}`);
    
    console.log('\n🔍 Step 2: Identifying all orders in the database...');

    // First, let's check the table structure
    const { data: schemaTest, error: schemaError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.error('❌ Failed to check table schema:', schemaError.message);
      process.exit(1);
    }

    if (schemaTest && schemaTest.length > 0) {
      console.log('📋 Table schema (first order columns):');
      console.log('   Available columns:', Object.keys(schemaTest[0]).join(', '));
    }

    // Fetch all orders to analyze them
    const { data: allOrders, error: fetchError } = await supabase
      .from('orders')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Failed to fetch orders:', fetchError.message);
      process.exit(1);
    }
    
    if (!allOrders || allOrders.length === 0) {
      console.log('✅ Database is already clean - no orders found');
      return;
    }
    
    console.log(`📋 Found ${allOrders.length} orders in database:`);
    
    // Analyze each order to determine if it's test data
    const testOrders = [];
    const potentialRealOrders = [];
    
    allOrders.forEach((order, index) => {
      console.log(`\n   Order ${index + 1}:`);
      console.log(`     ID: ${order.id}`);
      console.log(`     Order Number: ${order.orderNumber || 'N/A'}`);
      console.log(`     Customer: ${order.customerName || order.user?.name || 'N/A'}`);
      console.log(`     Total: £${order.total || order.amount || 0}`);
      console.log(`     Status: ${order.status || 'N/A'}`);
      console.log(`     Created: ${order.timestamp || order.created_at || 'N/A'}`);
      console.log(`     Items: ${order.items ? order.items.length : 0} items`);
      
      // Identify test orders based on common patterns
      const isTestOrder = (
        // Test customer names
        (order.customerName && (
          order.customerName.includes('test') ||
          order.customerName.includes('Test') ||
          order.customerName.includes('demo') ||
          order.customerName.includes('Demo') ||
          order.customerName.includes('example') ||
          order.customerName.includes('sample') ||
          order.customerName === 'Demo Customer' ||
          order.customerName === 'Test Customer' ||
          order.customerName === 'Kitchen Order'
        )) ||
        
        // Test order numbers
        (order.orderNumber && (
          order.orderNumber.includes('test') ||
          order.orderNumber.includes('TEST') ||
          order.orderNumber.includes('demo') ||
          order.orderNumber.includes('DEMO') ||
          order.orderNumber.includes('GBC-TEST') ||
          order.orderNumber.includes('POSTMAN') ||
          order.orderNumber.includes('LOAD-TEST') ||
          order.orderNumber.includes('SCHEMA-TEST') ||
          order.orderNumber.includes('SUBSCRIPTION-TEST') ||
          order.orderNumber.includes('COMPREHENSIVE') ||
          order.orderNumber.includes('REALTIME') ||
          order.orderNumber === '1234' ||
          order.orderNumber === '2692' ||
          order.orderNumber === 'TEST'
        )) ||
        
        // Test item names
        (order.items && order.items.some(item => 
          item.name && (
            item.name.includes('Test') ||
            item.name.includes('test') ||
            item.name.includes('Demo') ||
            item.name.includes('demo') ||
            item.name.includes('Sample') ||
            item.name === 'Short Item' ||
            item.name === 'Another Item' ||
            item.name.includes('Very Long Item Name')
          )
        )) ||
        
        // Test notes
        (order.notes && (
          order.notes.includes('test') ||
          order.notes.includes('Test') ||
          order.notes.includes('demo') ||
          order.notes.includes('verification')
        )) ||
        
        // Orders with suspicious patterns (very recent, round numbers, etc.)
        (order.total && (order.total === 23.34 || order.total === 62.24)) ||

        // Orders with zero total (likely test orders)
        (order.amount === 0 || order.total === 0) ||
        
        // Orders created during development (you can adjust this date)
        ((order.created_at && new Date(order.created_at) > new Date('2024-12-01')) ||
         (order.timestamp && new Date(order.timestamp) > new Date('2024-12-01')))
      );
      
      if (isTestOrder) {
        console.log(`     🔴 IDENTIFIED AS TEST ORDER`);
        testOrders.push(order);
      } else {
        console.log(`     🟢 Potentially real order`);
        potentialRealOrders.push(order);
      }
    });
    
    console.log(`\n📊 Analysis Results:`);
    console.log(`   🔴 Test/Demo orders identified: ${testOrders.length}`);
    console.log(`   🟢 Potentially real orders: ${potentialRealOrders.length}`);
    
    if (potentialRealOrders.length > 0) {
      console.log(`\n⚠️  WARNING: Found ${potentialRealOrders.length} potentially real orders:`);
      potentialRealOrders.forEach((order, index) => {
        console.log(`     ${index + 1}. Order ${order.orderNumber} - ${order.customerName} - £${order.total}`);
      });
      
      console.log('\n❓ These orders will NOT be deleted. Please review manually if needed.');
    }
    
    if (testOrders.length === 0) {
      console.log('\n✅ No test orders found to delete. Database is clean!');
      return;
    }
    
    console.log(`\n🗑️  Step 3: Deleting ${testOrders.length} test/demo orders...`);
    
    // Delete test orders one by one for better error handling
    let deletedCount = 0;
    let failedCount = 0;
    
    for (const order of testOrders) {
      try {
        const { error: deleteError } = await supabase
          .from('orders')
          .delete()
          .eq('id', order.id);
        
        if (deleteError) {
          console.log(`   ❌ Failed to delete order ${order.id}: ${deleteError.message}`);
          failedCount++;
        } else {
          console.log(`   ✅ Deleted order ${order.orderNumber || order.id} (${order.customerName})`);
          deletedCount++;
        }
      } catch (error) {
        console.log(`   ❌ Error deleting order ${order.id}: ${error.message}`);
        failedCount++;
      }
    }
    
    console.log(`\n📊 Deletion Results:`);
    console.log(`   ✅ Successfully deleted: ${deletedCount} orders`);
    console.log(`   ❌ Failed to delete: ${failedCount} orders`);
    
    // Verify cleanup
    console.log('\n🔍 Step 4: Verifying database cleanup...');
    
    const { count: remainingCount, error: verifyError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (verifyError) {
      console.error('❌ Failed to verify cleanup:', verifyError.message);
    } else {
      console.log(`✅ Database verification complete`);
      console.log(`   Remaining orders in database: ${remainingCount || 0}`);

      if (remainingCount === potentialRealOrders.length) {
        console.log('✅ Cleanup successful - only real orders remain');
      } else {
        console.log('⚠️  Order count mismatch - please verify manually');
      }
    }
    
    console.log('\n🎉 DATABASE CLEANUP COMPLETED!');
    
    if (deletedCount > 0) {
      console.log(`\n📋 Summary:`);
      console.log(`   🗑️  Deleted ${deletedCount} test/demo orders`);
      console.log(`   💾 Preserved ${potentialRealOrders.length} real orders`);
      console.log(`   🎯 Database is now clean and ready for production`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupTestOrders();
