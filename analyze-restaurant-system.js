// Comprehensive analysis of restaurant registration and mapping system
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeRestaurantSystem() {
  console.log('🔍 Comprehensive Restaurant System Analysis...\n');
  
  try {
    // 1. Check all restaurants in registered_restaurants
    console.log('1️⃣ REGISTERED RESTAURANTS ANALYSIS:');
    const { data: allRestaurants, error: restError } = await supabase
      .from('registered_restaurants')
      .select('*')
      .order('created_at', { ascending: false });

    if (restError) {
      console.error('❌ Error fetching registered restaurants:', restError.message);
    } else {
      console.log(`📊 Found ${allRestaurants.length} registered restaurants:`);
      
      allRestaurants.forEach((restaurant, index) => {
        console.log(`\n   ${index + 1}. ${restaurant.restaurant_name}`);
        console.log(`      app_restaurant_uid: ${restaurant.app_restaurant_uid}`);
        console.log(`      website_restaurant_id: ${restaurant.website_restaurant_id}`);
        console.log(`      email: ${restaurant.restaurant_email}`);
        console.log(`      phone: ${restaurant.restaurant_phone}`);
        console.log(`      is_active: ${restaurant.is_active}`);
        console.log(`      created_at: ${restaurant.created_at}`);
      });
    }

    // 2. Check all mappings in website_restaurant_mappings
    console.log('\n\n2️⃣ WEBSITE RESTAURANT MAPPINGS ANALYSIS:');
    const { data: allMappings, error: mappingError } = await supabase
      .from('website_restaurant_mappings')
      .select('*')
      .order('created_at', { ascending: false });

    if (mappingError) {
      console.error('❌ Error fetching mappings:', mappingError.message);
    } else {
      console.log(`📊 Found ${allMappings.length} website restaurant mappings:`);
      
      allMappings.forEach((mapping, index) => {
        console.log(`\n   ${index + 1}. Mapping ID: ${mapping.id}`);
        console.log(`      website_restaurant_id: ${mapping.website_restaurant_id}`);
        console.log(`      app_restaurant_uid: ${mapping.app_restaurant_uid}`);
        console.log(`      is_active: ${mapping.is_active}`);
        console.log(`      callback_url: ${mapping.callback_url}`);
        console.log(`      handshake_request_id: ${mapping.handshake_request_id || 'NULL'}`);
        console.log(`      created_at: ${mapping.created_at}`);
      });
    }

    // 3. Find restaurants without mappings
    console.log('\n\n3️⃣ RESTAURANTS WITHOUT MAPPINGS:');
    if (allRestaurants && allMappings) {
      const restaurantsWithoutMappings = allRestaurants.filter(restaurant => {
        return !allMappings.some(mapping => 
          mapping.app_restaurant_uid === restaurant.app_restaurant_uid && 
          mapping.is_active === true
        );
      });

      console.log(`📊 Found ${restaurantsWithoutMappings.length} restaurants without active mappings:`);
      
      restaurantsWithoutMappings.forEach((restaurant, index) => {
        console.log(`\n   ${index + 1}. ${restaurant.restaurant_name}`);
        console.log(`      app_restaurant_uid: ${restaurant.app_restaurant_uid}`);
        console.log(`      website_restaurant_id: ${restaurant.website_restaurant_id}`);
        console.log(`      ⚠️  NEEDS MAPPING CREATION`);
      });
    }

    // 4. Find mappings without restaurants
    console.log('\n\n4️⃣ MAPPINGS WITHOUT RESTAURANTS:');
    if (allRestaurants && allMappings) {
      const mappingsWithoutRestaurants = allMappings.filter(mapping => {
        return !allRestaurants.some(restaurant => 
          restaurant.app_restaurant_uid === mapping.app_restaurant_uid
        );
      });

      console.log(`📊 Found ${mappingsWithoutRestaurants.length} mappings without restaurants:`);
      
      mappingsWithoutRestaurants.forEach((mapping, index) => {
        console.log(`\n   ${index + 1}. Mapping ID: ${mapping.id}`);
        console.log(`      website_restaurant_id: ${mapping.website_restaurant_id}`);
        console.log(`      app_restaurant_uid: ${mapping.app_restaurant_uid}`);
        console.log(`      ⚠️  ORPHANED MAPPING`);
      });
    }

    // 5. Check handshake requests
    console.log('\n\n5️⃣ HANDSHAKE REQUESTS ANALYSIS:');
    const { data: handshakeRequests, error: handshakeError } = await supabase
      .from('handshake_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (handshakeError) {
      console.error('❌ Error fetching handshake requests:', handshakeError.message);
    } else {
      console.log(`📊 Found ${handshakeRequests.length} recent handshake requests:`);
      
      handshakeRequests.forEach((request, index) => {
        console.log(`\n   ${index + 1}. Request ID: ${request.id}`);
        console.log(`      website_restaurant_id: ${request.website_restaurant_id}`);
        console.log(`      status: ${request.status}`);
        console.log(`      target_restaurant_uid: ${request.target_restaurant_uid || 'NULL'}`);
        console.log(`      created_at: ${request.created_at}`);
      });
    }

    // 6. Check restaurant_registrations table (if exists)
    console.log('\n\n6️⃣ RESTAURANT REGISTRATIONS TABLE:');
    const { data: registrations, error: regError } = await supabase
      .from('restaurant_registrations')
      .select('*')
      .limit(5);

    if (regError) {
      console.log('❌ restaurant_registrations table does not exist or is empty');
      console.log('   This table is expected by the handshake system but missing');
    } else {
      console.log(`📊 Found ${registrations.length} restaurant registrations:`);
      registrations.forEach((reg, index) => {
        console.log(`\n   ${index + 1}. Registration ID: ${reg.id}`);
        console.log(`      restaurant_uid: ${reg.restaurant_uid}`);
        console.log(`      user_id: ${reg.user_id}`);
        console.log(`      device_label: ${reg.device_label}`);
      });
    }

    // 7. Summary and recommendations
    console.log('\n\n📊 SYSTEM ANALYSIS SUMMARY:');
    console.log('=====================================');
    
    if (allRestaurants && allMappings) {
      const totalRestaurants = allRestaurants.length;
      const totalMappings = allMappings.length;
      const activeMappings = allMappings.filter(m => m.is_active).length;
      const restaurantsWithMappings = allRestaurants.filter(restaurant => 
        allMappings.some(mapping => 
          mapping.app_restaurant_uid === restaurant.app_restaurant_uid && 
          mapping.is_active === true
        )
      ).length;

      console.log(`📈 Total Restaurants: ${totalRestaurants}`);
      console.log(`📈 Total Mappings: ${totalMappings}`);
      console.log(`📈 Active Mappings: ${activeMappings}`);
      console.log(`📈 Restaurants with Mappings: ${restaurantsWithMappings}`);
      console.log(`📈 Restaurants without Mappings: ${totalRestaurants - restaurantsWithMappings}`);

      if (totalRestaurants - restaurantsWithMappings > 0) {
        console.log('\n⚠️  ISSUES FOUND:');
        console.log(`   - ${totalRestaurants - restaurantsWithMappings} restaurants need mapping creation`);
        console.log('   - These restaurants cannot receive orders from websites');
        console.log('   - Manual intervention required to create mappings');
      } else {
        console.log('\n✅ ALL RESTAURANTS HAVE MAPPINGS');
      }
    }

    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('1. Create automatic mapping generation for manually added restaurants');
    console.log('2. Update cloud-order-receive to auto-create mappings when missing');
    console.log('3. Implement fallback logic for restaurants without handshake');
    console.log('4. Add validation to ensure data consistency');

    console.log('\n📊 ANALYSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

analyzeRestaurantSystem();
