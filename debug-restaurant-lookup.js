// Debug the exact restaurant lookup that the edge function is doing
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugRestaurantLookup() {
  console.log('🔍 Debugging restaurant lookup...\n');
  
  const targetUid = '6e8fadce-f46b-48b2-b69c-86f5746cddaa';
  
  try {
    // 1. Check all restaurants in registered_restaurants
    console.log('1️⃣ All restaurants in registered_restaurants:');
    const { data: allRests, error: allError } = await supabase
      .from('registered_restaurants')
      .select('app_restaurant_uid, restaurant_name, website_restaurant_id')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Error:', allError.message);
      return;
    }

    console.log(`📊 Found ${allRests.length} restaurants:`);
    allRests.forEach((rest, index) => {
      console.log(`   ${index + 1}. ${rest.restaurant_name}`);
      console.log(`      app_restaurant_uid: "${rest.app_restaurant_uid}"`);
      console.log(`      website_restaurant_id: "${rest.website_restaurant_id}"`);
      console.log(`      UID matches target: ${rest.app_restaurant_uid === targetUid}`);
      console.log('');
    });

    // 2. Exact query that edge function is doing
    console.log('2️⃣ Exact edge function query:');
    console.log(`   Looking for app_restaurant_uid = "${targetUid}"`);
    
    const { data: registration, error: regError } = await supabase
      .from('registered_restaurants')
      .select('id as user_id, app_restaurant_uid, restaurant_name')
      .eq('app_restaurant_uid', targetUid)
      .single();

    if (regError) {
      console.error('❌ Query failed:', regError.message);
      console.log('   Error code:', regError.code);
      console.log('   Error details:', regError.details);
      
      // Try without .single() to see if there are multiple results
      console.log('\n   Trying without .single()...');
      const { data: multipleResults, error: multiError } = await supabase
        .from('registered_restaurants')
        .select('id as user_id, app_restaurant_uid, restaurant_name')
        .eq('app_restaurant_uid', targetUid);

      if (multiError) {
        console.error('   ❌ Still failed:', multiError.message);
      } else {
        console.log(`   ✅ Found ${multipleResults.length} results without .single()`);
        multipleResults.forEach((result, index) => {
          console.log(`      ${index + 1}. ${result.restaurant_name}`);
          console.log(`         user_id: ${result.user_id}`);
          console.log(`         app_restaurant_uid: ${result.app_restaurant_uid}`);
        });
      }
    } else {
      console.log('✅ Query succeeded!');
      console.log('   Restaurant name:', registration.restaurant_name);
      console.log('   User ID:', registration.user_id);
      console.log('   App restaurant UID:', registration.app_restaurant_uid);
    }

    // 3. Check data types
    console.log('\n3️⃣ Checking data types...');
    const targetRestaurant = allRests.find(r => r.app_restaurant_uid === targetUid);
    if (targetRestaurant) {
      console.log('✅ Found target restaurant in list');
      console.log('   Type of stored UID:', typeof targetRestaurant.app_restaurant_uid);
      console.log('   Type of target UID:', typeof targetUid);
      console.log('   Stored UID length:', targetRestaurant.app_restaurant_uid.length);
      console.log('   Target UID length:', targetUid.length);
      console.log('   Exact match:', targetRestaurant.app_restaurant_uid === targetUid);
      
      // Check for hidden characters
      const storedBytes = Buffer.from(targetRestaurant.app_restaurant_uid, 'utf8');
      const targetBytes = Buffer.from(targetUid, 'utf8');
      console.log('   Stored bytes:', storedBytes);
      console.log('   Target bytes:', targetBytes);
    } else {
      console.log('❌ Target restaurant NOT found in list');
      console.log('   This means the UID doesn\'t match any restaurant');
    }

    // 4. Try case-insensitive search
    console.log('\n4️⃣ Trying case-insensitive search...');
    const { data: caseInsensitive, error: caseError } = await supabase
      .from('registered_restaurants')
      .select('id as user_id, app_restaurant_uid, restaurant_name')
      .ilike('app_restaurant_uid', targetUid);

    if (caseError) {
      console.error('❌ Case-insensitive search failed:', caseError.message);
    } else {
      console.log(`✅ Case-insensitive search found ${caseInsensitive.length} results`);
    }

    // 5. Check if the UID is stored as UUID vs TEXT
    console.log('\n5️⃣ Checking UUID vs TEXT storage...');
    
    // Try treating as UUID
    const { data: uuidResult, error: uuidError } = await supabase
      .from('registered_restaurants')
      .select('id as user_id, app_restaurant_uid, restaurant_name')
      .eq('app_restaurant_uid', `${targetUid}::uuid`);

    if (uuidError) {
      console.log('❌ UUID cast failed:', uuidError.message);
    } else {
      console.log(`✅ UUID cast found ${uuidResult.length} results`);
    }

    console.log('\n📊 DEBUG COMPLETE');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

debugRestaurantLookup();
