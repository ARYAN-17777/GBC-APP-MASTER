// Check all restaurant mappings to understand the current state
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMappings() {
  console.log('🔍 Checking restaurant mappings...\n');
  
  try {
    // 1. Check all mappings
    console.log('1️⃣ All restaurant mappings:');
    const { data: allMappings, error: allError } = await supabase
      .from('website_restaurant_mappings')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Error fetching mappings:', allError.message);
      return;
    }

    console.log(`📊 Found ${allMappings.length} total mappings:`);
    allMappings.forEach((mapping, index) => {
      console.log(`\n   ${index + 1}. Mapping ID: ${mapping.id}`);
      console.log(`      website_restaurant_id: "${mapping.website_restaurant_id}"`);
      console.log(`      app_restaurant_uid: "${mapping.app_restaurant_uid}"`);
      console.log(`      is_active: ${mapping.is_active}`);
      console.log(`      callback_url: ${mapping.callback_url || 'NULL'}`);
      console.log(`      created_at: ${mapping.created_at}`);
    });

    // 2. Check specific mapping for website_restaurant_id = '165'
    console.log('\n2️⃣ Checking for website_restaurant_id = "165":');
    const { data: specificMappings, error: specificError } = await supabase
      .from('website_restaurant_mappings')
      .select('*')
      .eq('website_restaurant_id', '165');

    if (specificError) {
      console.error('❌ Error:', specificError.message);
    } else {
      console.log(`📊 Found ${specificMappings.length} mappings for website_restaurant_id "165"`);
      specificMappings.forEach(mapping => {
        console.log(`   - app_restaurant_uid: ${mapping.app_restaurant_uid}`);
        console.log(`   - is_active: ${mapping.is_active}`);
      });
    }

    // 3. Check specific mapping for app_restaurant_uid = '6e8fadce-f46b-48b2-b69c-86f5746cddaa'
    console.log('\n3️⃣ Checking for app_restaurant_uid = "6e8fadce-f46b-48b2-b69c-86f5746cddaa":');
    const { data: uidMappings, error: uidError } = await supabase
      .from('website_restaurant_mappings')
      .select('*')
      .eq('app_restaurant_uid', '6e8fadce-f46b-48b2-b69c-86f5746cddaa');

    if (uidError) {
      console.error('❌ Error:', uidError.message);
    } else {
      console.log(`📊 Found ${uidMappings.length} mappings for app_restaurant_uid "6e8fadce-f46b-48b2-b69c-86f5746cddaa"`);
      uidMappings.forEach(mapping => {
        console.log(`   - website_restaurant_id: ${mapping.website_restaurant_id}`);
        console.log(`   - is_active: ${mapping.is_active}`);
      });
    }

    // 4. Check restaurant registrations
    console.log('\n4️⃣ Checking restaurant registrations:');
    const { data: registrations, error: regError } = await supabase
      .from('restaurant_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (regError) {
      console.error('❌ Error fetching registrations:', regError.message);
    } else {
      console.log(`📊 Found ${registrations.length} restaurant registrations:`);
      registrations.forEach((reg, index) => {
        console.log(`\n   ${index + 1}. Registration:`);
        console.log(`      restaurant_uid: ${reg.restaurant_uid}`);
        console.log(`      user_id: ${reg.user_id}`);
        console.log(`      device_label: ${reg.device_label}`);
        console.log(`      is_online: ${reg.is_online}`);
        console.log(`      created_at: ${reg.created_at}`);
      });
    }

    // 5. Check handshake requests
    console.log('\n5️⃣ Checking handshake requests:');
    const { data: handshakes, error: handshakeError } = await supabase
      .from('handshake_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (handshakeError) {
      console.error('❌ Error fetching handshakes:', handshakeError.message);
    } else {
      console.log(`📊 Found ${handshakes.length} recent handshake requests:`);
      handshakes.forEach((req, index) => {
        console.log(`\n   ${index + 1}. Handshake:`);
        console.log(`      website_restaurant_id: ${req.website_restaurant_id}`);
        console.log(`      callback_url: ${req.callback_url}`);
        console.log(`      status: ${req.status}`);
        console.log(`      created_at: ${req.created_at}`);
      });
    }

    console.log('\n📊 ANALYSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkMappings();
