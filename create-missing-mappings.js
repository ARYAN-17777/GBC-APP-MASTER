// Automatic mapping generator for manually added restaurants
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMissingMappings() {
  console.log('🔧 Creating missing mappings for manually added restaurants...\n');
  
  try {
    // 1. Get all restaurants
    console.log('1️⃣ Fetching all registered restaurants...');
    const { data: allRestaurants, error: restError } = await supabase
      .from('registered_restaurants')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (restError) {
      console.error('❌ Error fetching restaurants:', restError.message);
      return;
    }

    console.log(`📊 Found ${allRestaurants.length} active restaurants`);

    // 2. Get all existing mappings
    console.log('\n2️⃣ Fetching all existing mappings...');
    const { data: allMappings, error: mappingError } = await supabase
      .from('website_restaurant_mappings')
      .select('*')
      .eq('is_active', true);

    if (mappingError) {
      console.error('❌ Error fetching mappings:', mappingError.message);
      return;
    }

    console.log(`📊 Found ${allMappings.length} active mappings`);

    // 3. Find restaurants without mappings
    console.log('\n3️⃣ Identifying restaurants without mappings...');
    const restaurantsWithoutMappings = allRestaurants.filter(restaurant => {
      return !allMappings.some(mapping => 
        mapping.app_restaurant_uid === restaurant.app_restaurant_uid && 
        mapping.website_restaurant_id === restaurant.website_restaurant_id
      );
    });

    console.log(`📊 Found ${restaurantsWithoutMappings.length} restaurants without mappings`);

    if (restaurantsWithoutMappings.length === 0) {
      console.log('✅ All restaurants already have mappings!');
      return;
    }

    // 4. Create mappings for restaurants without them
    console.log('\n4️⃣ Creating missing mappings...');
    let successCount = 0;
    let errorCount = 0;

    for (const restaurant of restaurantsWithoutMappings) {
      console.log(`\n   Creating mapping for: ${restaurant.restaurant_name}`);
      console.log(`   website_restaurant_id: ${restaurant.website_restaurant_id}`);
      console.log(`   app_restaurant_uid: ${restaurant.app_restaurant_uid}`);

      try {
        const { data: newMapping, error: createError } = await supabase
          .from('website_restaurant_mappings')
          .insert({
            website_restaurant_id: restaurant.website_restaurant_id,
            app_restaurant_uid: restaurant.app_restaurant_uid,
            website_domain: 'gbcanteen-com.stackstaging.com',
            callback_url: restaurant.callback_url || 'https://gbcanteen-com.stackstaging.com/api/orders/callback',
            handshake_request_id: null, // No handshake for manually added restaurants
            is_active: true,
            last_handshake: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error(`   ❌ Error creating mapping: ${createError.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Created mapping: ${newMapping.id}`);
          successCount++;
        }
      } catch (error) {
        console.error(`   ❌ Unexpected error: ${error.message}`);
        errorCount++;
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 5. Summary
    console.log('\n📊 MAPPING CREATION SUMMARY:');
    console.log('=====================================');
    console.log(`✅ Successfully created: ${successCount} mappings`);
    console.log(`❌ Failed to create: ${errorCount} mappings`);
    console.log(`📈 Total restaurants: ${allRestaurants.length}`);
    console.log(`📈 Total mappings after: ${allMappings.length + successCount}`);

    if (successCount > 0) {
      console.log('\n🎉 SUCCESS! Missing mappings have been created.');
      console.log('   All restaurants can now receive orders from websites.');
    }

    if (errorCount > 0) {
      console.log('\n⚠️  Some mappings failed to create. Check the errors above.');
    }

    // 6. Verify the results
    console.log('\n5️⃣ Verifying results...');
    const { data: finalMappings, error: finalError } = await supabase
      .from('website_restaurant_mappings')
      .select('*')
      .eq('is_active', true);

    if (finalError) {
      console.error('❌ Error verifying results:', finalError.message);
    } else {
      const finalRestaurantsWithMappings = allRestaurants.filter(restaurant => {
        return finalMappings.some(mapping => 
          mapping.app_restaurant_uid === restaurant.app_restaurant_uid && 
          mapping.website_restaurant_id === restaurant.website_restaurant_id
        );
      });

      console.log(`📊 Final verification:`);
      console.log(`   Total restaurants: ${allRestaurants.length}`);
      console.log(`   Restaurants with mappings: ${finalRestaurantsWithMappings.length}`);
      console.log(`   Coverage: ${Math.round((finalRestaurantsWithMappings.length / allRestaurants.length) * 100)}%`);

      if (finalRestaurantsWithMappings.length === allRestaurants.length) {
        console.log('\n🎉 PERFECT! 100% coverage achieved!');
        console.log('   All restaurants can now receive orders from websites.');
      } else {
        console.log('\n⚠️  Some restaurants still missing mappings.');
        console.log('   Manual intervention may be required.');
      }
    }

    console.log('\n📊 MAPPING GENERATION COMPLETE');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createMissingMappings();
