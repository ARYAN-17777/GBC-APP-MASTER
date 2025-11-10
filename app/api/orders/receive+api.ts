import { restaurantUIDValidator, ValidationHeaders } from '../../../middleware/validate-restaurant-uid';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Order Receive API Endpoint
 * POST /api/orders/receive
 * 
 * Receives orders from website with proper validation
 * Validates restaurant UID and processes new order payload format
 */
export async function POST(request: Request): Promise<Response> {
  try {
    console.log('📥 Order receive API endpoint called');

    // Extract headers for validation
    const headers: ValidationHeaders = {
      'X-Restaurant-UID': request.headers.get('X-Restaurant-UID') || undefined,
      'X-Website-Restaurant-ID': request.headers.get('X-Website-Restaurant-ID') || undefined,
      'X-Idempotency-Key': request.headers.get('X-Idempotency-Key') || undefined,
      'Authorization': request.headers.get('Authorization') || undefined,
    };

    // Validate incoming request headers
    const validation = await restaurantUIDValidator.validateIncomingRequest(headers);
    
    if (!validation.valid) {
      console.error('❌ Order validation failed:', validation.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.error || 'Validation failed'
        }),
        {
          status: validation.errorCode || 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    let orderPayload: any;
    try {
      const body = await request.text();
      orderPayload = JSON.parse(body);
    } catch (error) {
      console.error('❌ Invalid JSON in order request:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON format in request body'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate Content-Type header
    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Invalid Content-Type header:', contentType);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Content-Type must be application/json'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate required order fields
    const requiredFields = ['orderNumber', 'amount', 'status', 'items'];
    for (const field of requiredFields) {
      if (!orderPayload[field]) {
        console.error(`❌ Missing required field: ${field}`);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Missing required field: ${field}`
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Process the order (this would integrate with your existing order processing logic)
    const processedOrder = await processIncomingOrder(orderPayload, validation);

    if (processedOrder.success) {
      console.log('✅ Order processed successfully');
      console.log('🆔 Order Number:', orderPayload.orderNumber);
      console.log('💰 Amount:', orderPayload.amount);
      console.log('🌐 Website Restaurant ID:', validation.websiteRestaurantID);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Order received successfully',
          order_id: processedOrder.orderId,
          received_at: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.error('❌ Order processing failed:', processedOrder.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: processedOrder.error || 'Order processing failed'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('❌ Order receive API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Process incoming order and save to Supabase database
 */
async function processIncomingOrder(
  orderPayload: any,
  validation: { websiteRestaurantID?: string; appRestaurantUID?: string }
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    console.log('🔄 Processing incoming order...');
    console.log('📋 Order Details:', {
      orderNumber: orderPayload.orderNumber,
      amount: orderPayload.amount,
      itemCount: orderPayload.items?.length || 0,
      websiteRestaurantID: validation.websiteRestaurantID
    });

    // Prepare order data for Supabase insertion
    const orderData = {
      userId: orderPayload.userId || validation.appRestaurantUID,
      restaurant_uid: validation.appRestaurantUID, // CRITICAL: Add restaurant UID for app filtering
      orderNumber: orderPayload.orderNumber,
      amount: orderPayload.amount, // Keep as decimal (pounds)
      status: orderPayload.status || 'pending',
      items: orderPayload.items || [],
      user: orderPayload.user || {},
      restaurant: orderPayload.restaurant || {},
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Store new payload format indicators
      totals: orderPayload.totals || null,
      amountDisplay: orderPayload.amountDisplay || null,
      paymentMethod: 'website_order',
      currency: 'GBP',
      // Store website integration metadata
      website_restaurant_id: validation.websiteRestaurantID
    };

    console.log('🔍 DEBUG: Order data prepared for insertion:');
    console.log('   - restaurant_uid:', orderData.restaurant_uid);
    console.log('   - website_restaurant_id:', orderData.website_restaurant_id);
    console.log('   - orderNumber:', orderData.orderNumber);
    console.log('   - amount:', orderData.amount);

    console.log('💾 Saving order to Supabase...');

    // Insert order into Supabase
    const { data: savedOrder, error: insertError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to save order to Supabase:', insertError);
      return {
        success: false,
        error: `Database error: ${insertError.message}`
      };
    }

    console.log('✅ Order saved to Supabase successfully');
    console.log('🆔 Supabase Order ID:', savedOrder.id);

    return {
      success: true,
      orderId: savedOrder.id
    };

  } catch (error) {
    console.error('❌ Error processing order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown processing error'
    };
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function GET(): Promise<Response> {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Method not allowed. Use POST to receive orders.',
      supportedMethods: ['POST']
    }),
    {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        'Allow': 'POST'
      }
    }
  );
}

export async function PUT(): Promise<Response> {
  return GET();
}

export async function DELETE(): Promise<Response> {
  return GET();
}

export async function PATCH(): Promise<Response> {
  return GET();
}
