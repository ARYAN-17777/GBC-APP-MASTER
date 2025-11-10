// Test the exact query that the edge function is doing
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testExactQuery() {
  console.log('🔍 Testing exact edge function query...\n');
  
  const targetUid = '6e8fadce-f46b-48b2-b69c-86f5746cddaa';
  
  try {
    console.log('1️⃣ Testing the exact query from edge function:');
    console.log(`   SELECT id, app_restaurant_uid, restaurant_name`);
    console.log(`   FROM registered_restaurants`);
    console.log(`   WHERE app_restaurant_uid = '${targetUid}'`);
    console.log(`   SINGLE()`);
    
    const { data: registration, error: regError } = await supabase
      .from('registered_restaurants')
      .select('id, app_restaurant_uid, restaurant_name')
      .eq('app_restaurant_uid', targetUid)
      .single();

    if (regError) {
      console.error('❌ Query failed:', regError.message);
      console.log('   Error code:', regError.code);
      console.log('   Error details:', regError.details);
      
      // Try without .single()
      console.log('\n2️⃣ Trying without .single():');
      const { data: multipleResults, error: multiError } = await supabase
        .from('registered_restaurants')
        .select('id, app_restaurant_uid, restaurant_name')
        .eq('app_restaurant_uid', targetUid);

      if (multiError) {
        console.error('❌ Still failed:', multiError.message);
      } else {
        console.log(`✅ Found ${multipleResults.length} results without .single()`);
        if (multipleResults.length > 0) {
          multipleResults.forEach((result, index) => {
            console.log(`   ${index + 1}. ${result.restaurant_name}`);
            console.log(`      id: ${result.id}`);
            console.log(`      app_restaurant_uid: ${result.app_restaurant_uid}`);
          });
          
          if (multipleResults.length === 1) {
            console.log('\n✅ Perfect! Exactly one result found');
            console.log('   The .single() should work, but there might be a caching issue');
          } else {
            console.log('\n❌ Multiple results found - this would cause .single() to fail');
          }
        } else {
          console.log('❌ No results found - the restaurant doesn\'t exist');
        }
      }
    } else {
      console.log('✅ Query succeeded with .single()!');
      console.log('   Restaurant name:', registration.restaurant_name);
      console.log('   ID:', registration.id);
      console.log('   App restaurant UID:', registration.app_restaurant_uid);
      
      console.log('\n🎉 SUCCESS! The edge function should work now');
    }

    // 3. Test the mapping query too
    console.log('\n3️⃣ Testing mapping query:');
    const { data: mapping, error: mappingError } = await supabase
      .from('website_restaurant_mappings')
      .select('*')
      .eq('website_restaurant_id', '165')
      .eq('app_restaurant_uid', targetUid)
      .eq('is_active', true)
      .single();

    if (mappingError) {
      console.error('❌ Mapping query failed:', mappingError.message);
    } else {
      console.log('✅ Mapping query succeeded!');
      console.log('   Mapping ID:', mapping.id);
      console.log('   Website restaurant ID:', mapping.website_restaurant_id);
      console.log('   App restaurant UID:', mapping.app_restaurant_uid);
      console.log('   Is active:', mapping.is_active);
    }

    console.log('\n📊 QUERY TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testExactQuery();
