// Execute restaurant_registrations table fix via JavaScript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeRestaurantRegistrationsFix() {
  console.log('🔧 Fixing restaurant_registrations table...\n');
  
  try {
    // 1. Check if table already exists
    console.log('1️⃣ Checking if restaurant_registrations table exists...');
    const { data: existingTable, error: checkError } = await supabase
      .from('restaurant_registrations')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✅ restaurant_registrations table already exists');
      
      // Count existing registrations
      const { data: existingRegs, error: countError } = await supabase
        .from('restaurant_registrations')
        .select('id');
      
      if (!countError) {
        console.log(`📊 Found ${existingRegs.length} existing registrations`);
        
        if (existingRegs.length > 0) {
          console.log('✅ Table is already populated, skipping creation');
          return;
        }
      }
    } else {
      console.log('❌ restaurant_registrations table does not exist, will create it');
    }

    // 2. Get all active restaurants
    console.log('\n2️⃣ Fetching all active restaurants...');
    const { data: restaurants, error: restError } = await supabase
      .from('registered_restaurants')
      .select('*')
      .eq('is_active', true);

    if (restError) {
      console.error('❌ Error fetching restaurants:', restError.message);
      return;
    }

    console.log(`📊 Found ${restaurants.length} active restaurants`);

    // 3. Create registrations for each restaurant
    console.log('\n3️⃣ Creating restaurant registrations...');
    let successCount = 0;
    let errorCount = 0;

    for (const restaurant of restaurants) {
      console.log(`\n   Processing: ${restaurant.restaurant_name}`);
      console.log(`   app_restaurant_uid: ${restaurant.app_restaurant_uid}`);

      try {
        // Check if registration already exists
        const { data: existingReg, error: existingError } = await supabase
          .from('restaurant_registrations')
          .select('id')
          .eq('restaurant_uid', restaurant.app_restaurant_uid)
          .single();

        if (!existingError && existingReg) {
          console.log(`   ⏭️  Registration already exists, skipping`);
          continue;
        }

        // Create new registration
        const registrationData = {
          user_id: restaurant.id, // Use restaurant's ID as user_id
          restaurant_uid: restaurant.app_restaurant_uid,
          device_label: restaurant.restaurant_name || 'Manual Registration',
          app_version: '3.0.0',
          platform: 'manual',
          capabilities: ['order_receive', 'status_update', 'print_receipt'],
          device_info: {
            restaurant_name: restaurant.restaurant_name,
            restaurant_phone: restaurant.restaurant_phone,
            restaurant_email: restaurant.restaurant_email,
            registration_type: 'manual'
          },
          network_info: {
            source: 'manual_registration',
            callback_url: restaurant.callback_url
          },
          last_seen: restaurant.created_at,
          is_online: restaurant.is_active,
          created_at: restaurant.created_at,
          updated_at: restaurant.updated_at
        };

        const { data: newReg, error: createError } = await supabase
          .from('restaurant_registrations')
          .insert(registrationData)
          .select()
          .single();

        if (createError) {
          console.error(`   ❌ Error creating registration: ${createError.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Created registration: ${newReg.id}`);
          successCount++;
        }
      } catch (error) {
        console.error(`   ❌ Unexpected error: ${error.message}`);
        errorCount++;
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 4. Summary
    console.log('\n📊 RESTAURANT REGISTRATIONS FIX SUMMARY:');
    console.log('==========================================');
    console.log(`✅ Successfully created: ${successCount} registrations`);
    console.log(`❌ Failed to create: ${errorCount} registrations`);
    console.log(`📈 Total restaurants: ${restaurants.length}`);

    if (successCount > 0) {
      console.log('\n🎉 SUCCESS! restaurant_registrations table is now populated.');
      console.log('   Handshake system can now find restaurant registrations.');
    }

    if (errorCount > 0) {
      console.log('\n⚠️  Some registrations failed to create. Check the errors above.');
    }

    // 5. Verify the results
    console.log('\n4️⃣ Verifying results...');
    const { data: finalRegs, error: finalError } = await supabase
      .from('restaurant_registrations')
      .select('*');

    if (finalError) {
      console.error('❌ Error verifying results:', finalError.message);
    } else {
      console.log(`📊 Final verification:`);
      console.log(`   Total restaurants: ${restaurants.length}`);
      console.log(`   Total registrations: ${finalRegs.length}`);
      console.log(`   Coverage: ${Math.round((finalRegs.length / restaurants.length) * 100)}%`);

      if (finalRegs.length === restaurants.length) {
        console.log('\n🎉 PERFECT! 100% coverage achieved!');
        console.log('   All restaurants have corresponding registrations.');
        console.log('   Handshake system is now fully compatible.');
      } else {
        console.log('\n⚠️  Some restaurants still missing registrations.');
        console.log('   Manual intervention may be required.');
      }
    }

    console.log('\n📊 RESTAURANT REGISTRATIONS FIX COMPLETE');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

executeRestaurantRegistrationsFix();
