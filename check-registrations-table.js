// Simple check for restaurant_registrations table
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRegistrationsTable() {
  console.log('🔍 Checking restaurant_registrations table status...\n');
  
  try {
    // Try to query the table
    const { data, error } = await supabase
      .from('restaurant_registrations')
      .select('*')
      .limit(5);

    if (error) {
      console.log('❌ restaurant_registrations table does NOT exist');
      console.log('   Error:', error.message);
      console.log('\n🔧 The table needs to be created manually in Supabase dashboard');
      console.log('   Or the handshake system needs to be updated to work without it');
    } else {
      console.log('✅ restaurant_registrations table EXISTS');
      console.log(`📊 Found ${data.length} registrations (showing first 5)`);
      
      data.forEach((reg, index) => {
        console.log(`\n   ${index + 1}. Registration ID: ${reg.id}`);
        console.log(`      restaurant_uid: ${reg.restaurant_uid}`);
        console.log(`      device_label: ${reg.device_label}`);
        console.log(`      platform: ${reg.platform}`);
        console.log(`      is_online: ${reg.is_online}`);
      });
    }

    // Also check registered_restaurants for comparison
    console.log('\n📊 Checking registered_restaurants for comparison...');
    const { data: restaurants, error: restError } = await supabase
      .from('registered_restaurants')
      .select('app_restaurant_uid, restaurant_name')
      .eq('is_active', true)
      .limit(5);

    if (restError) {
      console.error('❌ Error fetching restaurants:', restError.message);
    } else {
      console.log(`✅ Found ${restaurants.length} active restaurants (showing first 5)`);
      restaurants.forEach((rest, index) => {
        console.log(`   ${index + 1}. ${rest.restaurant_name} - ${rest.app_restaurant_uid}`);
      });
    }

    console.log('\n📊 TABLE CHECK COMPLETE');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkRegistrationsTable();
