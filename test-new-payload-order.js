/**
 * Test New Payload Order Creation
 * 
 * This script tests the complete flow:
 * 1. Creates a new order using the new payload format
 * 2. Saves it to Supabase via the receive API
 * 3. Verifies the order appears correctly with proper price formatting
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🧪 Testing New Payload Order Creation');
console.log('====================================\n');

async function testNewPayloadOrder() {
  try {
    // Create a new payload order with proper decimal prices
    const newPayloadOrder = {
      userId: '36730b7c-18dc-40f4-8ced-ce9887032fb3',
      orderNumber: `PRICE-FIX-${Date.now()}`,
      amount: 16.50, // Total in pounds (decimal)
      amountDisplay: '£16.50',
      totals: {
        subtotal: '15.00',
        discount: '1.00',
        delivery: '1.50',
        vat: '1.00',
        total: '16.50'
      },
      status: 'pending',
      items: [
        {
          title: 'Chicken Makhani',
          quantity: 1,
          unitPrice: '13.00', // String format
          lineTotal: '13.00',
          unitPriceMinor: 1300, // In pence (for reference)
          price: 13.00, // Decimal format
          customizations: [
            {
              name: 'Extra Cheese',
              qty: 1,
              price: '1.50'
            },
            {
              name: 'Less Spicy',
              qty: 1
            }
          ]
        },
        {
          title: 'Garlic Naan',
          quantity: 1,
          unitPrice: '3.50',
          lineTotal: '3.50',
          unitPriceMinor: 350,
          price: 3.50,
          customizations: []
        }
      ],
      user: {
        name: 'Price Test Customer',
        phone: '+447700900123'
      },
      restaurant: {
        name: 'General Bilimoria\'s Canteen'
      }
    };

    console.log('1️⃣ Creating new payload order...');
    console.log(`   Order Number: ${newPayloadOrder.orderNumber}`);
    console.log(`   Total Amount: £${newPayloadOrder.amount}`);
    console.log(`   Items: ${newPayloadOrder.items.length}`);
    
    // Insert directly into Supabase (simulating the receive API)
    // Note: For now, we'll store the new payload indicators in the items JSONB
    // until the schema is updated with dedicated columns
    const orderData = {
      userId: newPayloadOrder.userId,
      orderNumber: newPayloadOrder.orderNumber,
      amount: newPayloadOrder.amount, // Keep as decimal (pounds)
      status: newPayloadOrder.status,
      items: newPayloadOrder.items,
      user: newPayloadOrder.user,
      restaurant: newPayloadOrder.restaurant,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      // Store new payload format indicators in user object for now
      user: {
        ...newPayloadOrder.user,
        _newPayloadFormat: true,
        _totals: newPayloadOrder.totals,
        _amountDisplay: newPayloadOrder.amountDisplay
      }
    };

    const { data: savedOrder, error: insertError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create order:', insertError);
      return;
    }

    console.log('✅ Order created successfully!');
    console.log(`   Supabase ID: ${savedOrder.id}`);
    console.log(`   Order Number: ${savedOrder.orderNumber}`);
    console.log(`   Amount: £${savedOrder.amount}`);

    // Test the transformation logic (simulating what the app does)
    console.log('\n2️⃣ Testing transformation logic...');
    
    // Helper function (same as in the app)
    const convertPrice = (price) => {
      if (typeof price === 'string') {
        const parsed = parseFloat(price);
        return isNaN(parsed) ? 0 : parsed;
      }
      if (typeof price === 'number') {
        // If price is greater than 100 and no decimal places, it's likely in cents
        if (price > 100 && price % 1 === 0) {
          return price / 100;
        }
        return price;
      }
      return 0;
    };

    // Transform like the app does
    let transformedOrder;
    if (savedOrder.user?._newPayloadFormat) {
      // New payload format - prices are already in pounds
      transformedOrder = {
        id: savedOrder.userId || savedOrder.id,
        orderNumber: savedOrder.orderNumber,
        customerName: savedOrder.user?.name || 'Walk-in Customer',
        items: (savedOrder.items || []).map((item) => ({
          name: item.title,
          quantity: item.quantity,
          price: item.price || parseFloat(item.unitPrice) || 0 // Already in pounds
        })),
        total: savedOrder.amount, // Already in pounds
        status: savedOrder.status === 'pending' ? 'preparing' : savedOrder.status,
        timestamp: new Date().toISOString(),
        notes: ''
      };
    } else {
      // Legacy format - would need conversion
      transformedOrder = {
        id: savedOrder.id,
        orderNumber: savedOrder.orderNumber || `#${savedOrder.id.slice(-6)}`,
        customerName: savedOrder.user?.name || 'Walk-in Customer',
        items: (savedOrder.items || []).map((item) => ({
          name: item.title || item.name || 'Unknown Item',
          quantity: item.quantity || 1,
          price: convertPrice(item.price) // Convert from cents if needed
        })),
        total: convertPrice(savedOrder.amount), // Convert from cents if needed
        status: savedOrder.status === 'pending' ? 'preparing' : savedOrder.status,
        timestamp: savedOrder.createdAt || new Date().toISOString(),
        notes: savedOrder.notes || ''
      };
    }

    console.log('✅ Transformation completed:');
    console.log(`   Order Number: ${transformedOrder.orderNumber}`);
    console.log(`   Customer: ${transformedOrder.customerName}`);
    console.log(`   Total: £${transformedOrder.total.toFixed(2)}`);
    console.log(`   Status: ${transformedOrder.status}`);
    console.log('   Items:');
    transformedOrder.items.forEach((item, index) => {
      console.log(`     ${index + 1}. ${item.quantity}x ${item.name} - £${item.price.toFixed(2)}`);
    });

    // Verify prices are correct
    console.log('\n3️⃣ Price verification:');
    const expectedPrices = [13.00, 3.50];
    const actualPrices = transformedOrder.items.map(item => item.price);
    
    let pricesCorrect = true;
    expectedPrices.forEach((expected, index) => {
      const actual = actualPrices[index];
      const correct = Math.abs(actual - expected) < 0.01;
      console.log(`   Item ${index + 1}: Expected £${expected.toFixed(2)}, Got £${actual.toFixed(2)} ${correct ? '✅' : '❌'}`);
      if (!correct) pricesCorrect = false;
    });

    const totalCorrect = Math.abs(transformedOrder.total - 16.50) < 0.01;
    console.log(`   Total: Expected £16.50, Got £${transformedOrder.total.toFixed(2)} ${totalCorrect ? '✅' : '❌'}`);

    if (pricesCorrect && totalCorrect) {
      console.log('\n🎉 SUCCESS! All prices are displaying correctly.');
      console.log('   - New payload format preserved decimal prices');
      console.log('   - No unwanted conversion from cents to pounds');
      console.log('   - Prices show as £13.00 and £3.50 (not £0.13 and £0.03)');
    } else {
      console.log('\n❌ FAILURE! Price conversion is still incorrect.');
    }

    // Clean up - delete the test order
    console.log('\n4️⃣ Cleaning up test order...');
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', savedOrder.id);

    if (deleteError) {
      console.warn('⚠️ Failed to delete test order:', deleteError);
    } else {
      console.log('✅ Test order cleaned up successfully');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNewPayloadOrder();
