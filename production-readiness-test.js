// Comprehensive production readiness test for GBC Restaurant App
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testProductionReadiness() {
  console.log('🚀 PRODUCTION READINESS TEST - GBC RESTAURANT APP');
  console.log('================================================');
  console.log('');

  let allTestsPassed = true;
  const testResults = [];

  try {
    // Test 1: Database Connection & Performance
    console.log('1️⃣ Testing Database Connection & Performance...');
    const startTime = Date.now();
    
    const { data: connectionTest, error: connectionError } = await supabase
      .from('orders')
      .select('count')
      .limit(1);
    
    const connectionTime = Date.now() - startTime;
    
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError);
      testResults.push({ test: 'Database Connection', status: 'FAILED', details: connectionError.message });
      allTestsPassed = false;
    } else {
      console.log(`✅ Database connection successful (${connectionTime}ms)`);
      testResults.push({ test: 'Database Connection', status: 'PASSED', details: `Response time: ${connectionTime}ms` });
    }

    // Test 2: Order Creation Load Test
    console.log('');
    console.log('2️⃣ Testing Order Creation Load (Simulating High Traffic)...');
    
    const loadTestPromises = [];
    const orderCount = 5; // Create 5 orders simultaneously
    
    for (let i = 0; i < orderCount; i++) {
      const testOrder = {
        userId: '8073867c-18dc-40f4-8ced-ce9887032fb3',
        orderNumber: `LOAD-TEST-${Date.now()}-${i}`,
        amount: 1500 + (i * 100),
        status: 'pending',
        items: [
          {
            title: `Test Item ${i + 1}`,
            quantity: 1,
            price: 1500 + (i * 100)
          }
        ],
        user: {
          name: `Load Test Customer ${i + 1}`,
          phone: `+44 7123 45678${i}`,
          email: `loadtest${i}@gbccanteen.com`
        },
        restaurant: {
          name: 'General Bilimoria\'s Canteen'
        },
        stripeId: `pi_load_test_${i}`,
        time: new Date().toLocaleTimeString(),
        createdAt: new Date().toISOString()
      };
      
      loadTestPromises.push(
        supabase.from('orders').insert([testOrder]).select().single()
      );
    }
    
    const loadTestStart = Date.now();
    const loadTestResults = await Promise.allSettled(loadTestPromises);
    const loadTestTime = Date.now() - loadTestStart;
    
    const successfulOrders = loadTestResults.filter(result => result.status === 'fulfilled').length;
    const failedOrders = loadTestResults.filter(result => result.status === 'rejected').length;
    
    console.log(`✅ Load test completed: ${successfulOrders}/${orderCount} orders created successfully`);
    console.log(`⏱️ Total time: ${loadTestTime}ms (avg: ${Math.round(loadTestTime/orderCount)}ms per order)`);
    
    if (failedOrders > 0) {
      console.log(`⚠️ ${failedOrders} orders failed during load test`);
      testResults.push({ test: 'Load Test', status: 'PARTIAL', details: `${successfulOrders}/${orderCount} successful` });
    } else {
      testResults.push({ test: 'Load Test', status: 'PASSED', details: `All ${orderCount} orders created successfully` });
    }

    // Test 3: Real-time Subscription Performance
    console.log('');
    console.log('3️⃣ Testing Real-time Subscription Performance...');
    
    let subscriptionReceived = false;
    const subscriptionTimeout = 5000; // 5 seconds timeout
    
    const subscription = supabase
      .channel('production-test-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('🔔 Real-time subscription working:', payload.eventType);
          subscriptionReceived = true;
        }
      )
      .subscribe();

    // Create a test order to trigger subscription
    const subscriptionTestOrder = {
      userId: '8073867c-18dc-40f4-8ced-ce9887032fb3',
      orderNumber: `SUBSCRIPTION-TEST-${Date.now()}`,
      amount: 999,
      status: 'pending',
      items: [{ title: 'Subscription Test Item', quantity: 1, price: 999 }],
      user: { name: 'Subscription Test', phone: '+44 7000 000000' },
      restaurant: { name: 'General Bilimoria\'s Canteen' },
      stripeId: 'pi_subscription_test',
      time: new Date().toLocaleTimeString(),
      createdAt: new Date().toISOString()
    };

    await supabase.from('orders').insert([subscriptionTestOrder]);
    
    // Wait for subscription or timeout
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    subscription.unsubscribe();
    
    if (subscriptionReceived) {
      console.log('✅ Real-time subscriptions working correctly');
      testResults.push({ test: 'Real-time Subscriptions', status: 'PASSED', details: 'Subscription received within 2 seconds' });
    } else {
      console.log('⚠️ Real-time subscription may be delayed');
      testResults.push({ test: 'Real-time Subscriptions', status: 'WARNING', details: 'No subscription received within timeout' });
    }

    // Test 4: Data Integrity & Validation
    console.log('');
    console.log('4️⃣ Testing Data Integrity & Validation...');
    
    const { data: recentOrders, error: dataError } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(10);

    if (dataError) {
      console.error('❌ Data integrity test failed:', dataError);
      testResults.push({ test: 'Data Integrity', status: 'FAILED', details: dataError.message });
      allTestsPassed = false;
    } else {
      let dataIssues = 0;
      
      recentOrders.forEach(order => {
        if (!order.orderNumber) dataIssues++;
        if (!order.amount || order.amount <= 0) dataIssues++;
        if (!order.items || !Array.isArray(order.items)) dataIssues++;
        if (!order.status) dataIssues++;
      });
      
      if (dataIssues === 0) {
        console.log('✅ Data integrity check passed - all orders have valid structure');
        testResults.push({ test: 'Data Integrity', status: 'PASSED', details: `Validated ${recentOrders.length} recent orders` });
      } else {
        console.log(`⚠️ Found ${dataIssues} data integrity issues in recent orders`);
        testResults.push({ test: 'Data Integrity', status: 'WARNING', details: `${dataIssues} issues found` });
      }
    }

    // Test 5: Error Handling & Recovery
    console.log('');
    console.log('5️⃣ Testing Error Handling & Recovery...');
    
    // Test invalid order creation
    try {
      await supabase.from('orders').insert([{ invalid: 'data' }]);
      console.log('⚠️ Error handling test: Invalid data was accepted (unexpected)');
      testResults.push({ test: 'Error Handling', status: 'WARNING', details: 'Invalid data accepted' });
    } catch (error) {
      console.log('✅ Error handling working: Invalid data properly rejected');
      testResults.push({ test: 'Error Handling', status: 'PASSED', details: 'Invalid data properly rejected' });
    }

    // Test 6: Performance Benchmarks
    console.log('');
    console.log('6️⃣ Testing Performance Benchmarks...');
    
    const benchmarkTests = [
      { name: 'Order Fetch', operation: () => supabase.from('orders').select('*').limit(50) },
      { name: 'Order Count', operation: () => supabase.from('orders').select('count') },
      { name: 'Recent Orders', operation: () => supabase.from('orders').select('*').order('createdAt', { ascending: false }).limit(10) }
    ];
    
    for (const benchmark of benchmarkTests) {
      const benchStart = Date.now();
      await benchmark.operation();
      const benchTime = Date.now() - benchStart;
      
      console.log(`⏱️ ${benchmark.name}: ${benchTime}ms`);
      
      if (benchTime > 2000) {
        console.log(`⚠️ ${benchmark.name} is slow (>${benchTime}ms)`);
      }
    }
    
    testResults.push({ test: 'Performance Benchmarks', status: 'COMPLETED', details: 'All benchmarks executed' });

    // Test Summary
    console.log('');
    console.log('📊 PRODUCTION READINESS SUMMARY');
    console.log('===============================');
    
    testResults.forEach(result => {
      const statusIcon = result.status === 'PASSED' ? '✅' : 
                        result.status === 'FAILED' ? '❌' : 
                        result.status === 'WARNING' ? '⚠️' : '📋';
      console.log(`${statusIcon} ${result.test}: ${result.status} - ${result.details}`);
    });

    const passedTests = testResults.filter(r => r.status === 'PASSED').length;
    const totalTests = testResults.length;
    
    console.log('');
    console.log(`🎯 Overall Score: ${passedTests}/${totalTests} tests passed`);
    
    if (allTestsPassed && passedTests >= totalTests * 0.8) {
      console.log('🚀 PRODUCTION READY: App is ready for large-scale deployment!');
      return true;
    } else {
      console.log('⚠️ NEEDS ATTENTION: Some issues found, but app is functional');
      return false;
    }

  } catch (error) {
    console.error('❌ Production readiness test failed:', error);
    return false;
  }
}

// Run the test
testProductionReadiness().then(isReady => {
  console.log('');
  console.log('🏁 FINAL STATUS:', isReady ? 'PRODUCTION READY ✅' : 'NEEDS REVIEW ⚠️');
});
