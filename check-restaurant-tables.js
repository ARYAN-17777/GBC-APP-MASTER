// Check what restaurant tables actually exist and create missing registration
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRestaurantTables() {
  console.log('🔍 Checking restaurant tables...\n');
  
  try {
    // 1. Check restaurant_registrations table
    console.log('1️⃣ Checking restaurant_registrations table...');
    const { data: regData, error: regError } = await supabase
      .from('restaurant_registrations')
      .select('*')
      .limit(1);

    if (regError) {
      console.log('❌ restaurant_registrations table does NOT exist');
      console.log('   Error:', regError.message);
    } else {
      console.log('✅ restaurant_registrations table exists');
      console.log(`   Found ${regData.length} registrations`);
    }

    // 2. Check registered_restaurants table
    console.log('\n2️⃣ Checking registered_restaurants table...');
    const { data: restData, error: restError } = await supabase
      .from('registered_restaurants')
      .select('*')
      .limit(5);

    if (restError) {
      console.log('❌ registered_restaurants table does NOT exist');
      console.log('   Error:', restError.message);
    } else {
      console.log('✅ registered_restaurants table exists');
      console.log(`   Found ${restData.length} restaurants:`);
      restData.forEach((rest, index) => {
        console.log(`   ${index + 1}. ${rest.restaurant_name}`);
        console.log(`      app_restaurant_uid: ${rest.app_restaurant_uid}`);
        console.log(`      website_restaurant_id: ${rest.website_restaurant_id}`);
      });
    }

    // 3. Check if our specific restaurant exists in registered_restaurants
    console.log('\n3️⃣ Checking for our specific restaurant...');
    const { data: ourRest, error: ourError } = await supabase
      .from('registered_restaurants')
      .select('*')
      .eq('app_restaurant_uid', '6e8fadce-f46b-48b2-b69c-86f5746cddaa');

    if (ourError) {
      console.log('❌ Error checking our restaurant:', ourError.message);
    } else if (ourRest.length === 0) {
      console.log('❌ Our restaurant (6e8fadce-f46b-48b2-b69c-86f5746cddaa) NOT found in registered_restaurants');
    } else {
      console.log('✅ Our restaurant found in registered_restaurants:');
      console.log('   Name:', ourRest[0].restaurant_name);
      console.log('   Email:', ourRest[0].restaurant_email);
      console.log('   Phone:', ourRest[0].restaurant_phone);
    }

    // 4. Create restaurant_registrations table if it doesn't exist
    if (regError && regError.message.includes('does not exist')) {
      console.log('\n4️⃣ Creating restaurant_registrations table...');
      
      // First, let's create a dummy user in auth.users if needed
      console.log('   Creating dummy user for restaurant...');
      
      // Create the restaurant_registrations table
      console.log('   Creating restaurant_registrations table...');
      
      // For now, let's create a registration entry manually
      const registrationData = {
        user_id: '00000000-0000-0000-0000-000000000001', // Dummy user ID
        restaurant_uid: '6e8fadce-f46b-48b2-b69c-86f5746cddaa',
        device_label: 'Website Integration Device',
        app_version: '1.0.0',
        platform: 'web',
        capabilities: ['order_receive'],
        device_info: { type: 'web_integration' },
        network_info: { source: 'website' },
        is_online: true
      };

      // Try to insert into restaurant_registrations (this will fail if table doesn't exist)
      const { data: newReg, error: insertError } = await supabase
        .from('restaurant_registrations')
        .insert(registrationData)
        .select();

      if (insertError) {
        console.log('❌ Failed to create registration:', insertError.message);
        console.log('\n🔧 SOLUTION: The edge function needs to be updated to use registered_restaurants table instead of restaurant_registrations');
      } else {
        console.log('✅ Registration created successfully!');
      }
    }

    // 5. If registered_restaurants exists but restaurant_registrations doesn't, 
    //    we need to either create the missing table or update the edge function
    if (restError === null && regError && regError.message.includes('does not exist')) {
      console.log('\n📊 DIAGNOSIS:');
      console.log('✅ registered_restaurants table exists');
      console.log('❌ restaurant_registrations table does NOT exist');
      console.log('❌ Edge function is looking for restaurant_registrations');
      console.log('\n🔧 SOLUTIONS:');
      console.log('1. Update edge function to use registered_restaurants table');
      console.log('2. OR create restaurant_registrations table and populate it');
      console.log('3. OR create a view/alias from registered_restaurants to restaurant_registrations');
    }

    console.log('\n📊 TABLE CHECK COMPLETE');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkRestaurantTables();
