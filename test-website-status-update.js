/**
 * Test script to verify if website status updates are reflected in Supabase
 * This will help diagnose if the website is updating the Supabase database
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testWebsiteStatusUpdate() {
  console.log('🔍 WEBSITE STATUS UPDATE VERIFICATION TEST');
  console.log('==========================================\n');

  try {
    // Step 1: Check if order #150132 exists in Supabase
    console.log('1️⃣ Checking if order #150132 exists in Supabase...');
    
    const { data: orderByHash, error: hashError } = await supabase
      .from('orders')
      .select('*')
      .eq('orderNumber', '#150132')
      .single();

    const { data: orderByDigits, error: digitsError } = await supabase
      .from('orders')
      .select('*')
      .eq('orderNumber', '150132')
      .single();

    const order = orderByHash || orderByDigits;
    const error = hashError && digitsError ? hashError : null;

    if (error || !order) {
      console.log('❌ Order #150132 NOT FOUND in Supabase');
      console.log('   This means the website is NOT updating Supabase database');
      console.log('\n📋 Available orders in Supabase:');
      
      const { data: allOrders } = await supabase
        .from('orders')
        .select('orderNumber, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      allOrders?.forEach((o, i) => {
        console.log(`   ${i + 1}. ${o.orderNumber} - ${o.status} - ${o.created_at}`);
      });
      
      console.log('\n⚠️ ISSUE IDENTIFIED:');
      console.log('   The website is NOT writing orders to Supabase database.');
      console.log('   The kitchen app can only receive updates via Supabase real-time.');
      console.log('\n💡 SOLUTION:');
      console.log('   The website must update Supabase when it receives status updates.');
      return;
    }

    console.log('✅ Order found in Supabase!');
    console.log(`   Order Number: ${order.orderNumber}`);
    console.log(`   Current Status: ${order.status}`);
    console.log(`   Last Updated: ${order.updated_at || order.created_at}`);

    // Step 2: Set up real-time subscription to monitor changes
    console.log('\n2️⃣ Setting up real-time subscription to monitor changes...');
    
    let updateReceived = false;
    
    const subscription = supabase
      .channel('test-status-update')
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `orderNumber=eq.${order.orderNumber}`
        },
        (payload) => {
          console.log('\n🔔 REAL-TIME UPDATE RECEIVED!');
          console.log('   Previous status:', payload.old.status);
          console.log('   New status:', payload.new.status);
          console.log('   Updated at:', payload.new.updated_at);
          updateReceived = true;
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active');
          console.log('\n📡 Waiting for status updates from website...');
          console.log('   (Send a status update from Postman now)');
        }
      });

    // Step 3: Wait for 60 seconds to see if update comes through
    console.log('\n3️⃣ Monitoring for 60 seconds...');
    
    await new Promise(resolve => setTimeout(resolve, 60000));

    // Step 4: Check final status
    console.log('\n4️⃣ Checking final status...');
    
    const { data: finalOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('orderNumber', order.orderNumber)
      .single();

    console.log(`   Final Status: ${finalOrder?.status}`);
    console.log(`   Last Updated: ${finalOrder?.updated_at || finalOrder?.created_at}`);

    if (updateReceived) {
      console.log('\n✅ SUCCESS! Website is updating Supabase correctly!');
      console.log('   The kitchen app should receive updates in real-time.');
    } else {
      console.log('\n❌ NO UPDATE RECEIVED!');
      console.log('   The website is NOT updating Supabase database.');
      console.log('\n💡 SOLUTION NEEDED:');
      console.log('   The website /api/order-status-update endpoint must:');
      console.log('   1. Update its own database (MySQL) ✅ (already working)');
      console.log('   2. ALSO update Supabase database ❌ (missing)');
      console.log('\n   Example code for website:');
      console.log('   ```php');
      console.log('   // After updating MySQL database');
      console.log('   $supabase_url = "https://evqmvmjnfeefeeizeljq.supabase.co";');
      console.log('   $supabase_key = "YOUR_SERVICE_ROLE_KEY";');
      console.log('   ');
      console.log('   $ch = curl_init("$supabase_url/rest/v1/orders?orderNumber=eq.$order_number");');
      console.log('   curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PATCH");');
      console.log('   curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([');
      console.log('     "status" => $new_status,');
      console.log('     "updated_at" => date("c")');
      console.log('   ]));');
      console.log('   curl_setopt($ch, CURLOPT_HTTPHEADER, [');
      console.log('     "apikey: $supabase_key",');
      console.log('     "Authorization: Bearer $supabase_key",');
      console.log('     "Content-Type: application/json",');
      console.log('     "Prefer: return=minimal"');
      console.log('   ]);');
      console.log('   curl_exec($ch);');
      console.log('   ```');
    }

    // Cleanup
    await supabase.removeChannel(subscription);
    console.log('\n🧹 Cleaned up subscription');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }

  process.exit(0);
}

testWebsiteStatusUpdate();

