import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-restaurant-uid, x-website-restaurant-id, x-idempotency-key',
}

interface CloudOrderRequest {
  website_restaurant_id: string;
  app_restaurant_uid: string;
  orderNumber: string;
  amount: number;
  currency?: string;
  status?: string;
  items: any[];
  user: any;
  restaurant?: any;
  time?: string;
  notes?: string;
  paymentMethod?: string;
  callback_url: string;
  idempotency_key: string;
}

interface OrderResponse {
  success: boolean;
  order_id?: string;
  message?: string;
  error?: string;
  received_at?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestBody: CloudOrderRequest = await req.json()

    // Validate required fields
    const requiredFields = [
      'website_restaurant_id', 
      'app_restaurant_uid', 
      'orderNumber', 
      'amount', 
      'items', 
      'user',
      'callback_url',
      'idempotency_key'
    ]

    for (const field of requiredFields) {
      if (!requestBody[field]) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Missing required field: ${field}` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    console.log('📦 Processing cloud order request:', {
      website_restaurant_id: requestBody.website_restaurant_id,
      app_restaurant_uid: requestBody.app_restaurant_uid,
      orderNumber: requestBody.orderNumber,
      amount: requestBody.amount,
      idempotency_key: requestBody.idempotency_key
    })

    // Validate restaurant mapping exists or create it automatically
    let { data: mapping, error: mappingError } = await supabase
      .from('website_restaurant_mappings')
      .select('*')
      .eq('website_restaurant_id', requestBody.website_restaurant_id)
      .eq('app_restaurant_uid', requestBody.app_restaurant_uid)
      .eq('is_active', true)
      .single()

    // If mapping doesn't exist, check if restaurant exists and auto-create mapping
    if (mappingError || !mapping) {
      console.log('🔍 No mapping found, checking if restaurant exists...')

      // Check if restaurant exists in registered_restaurants
      const { data: restaurant, error: restaurantError } = await supabase
        .from('registered_restaurants')
        .select('app_restaurant_uid, website_restaurant_id, restaurant_name, callback_url')
        .eq('app_restaurant_uid', requestBody.app_restaurant_uid)
        .eq('website_restaurant_id', requestBody.website_restaurant_id)
        .eq('is_active', true)
        .single()

      if (restaurantError || !restaurant) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Restaurant not found. Please register restaurant first.',
            details: `No restaurant found with website_restaurant_id: ${requestBody.website_restaurant_id} and app_restaurant_uid: ${requestBody.app_restaurant_uid}`
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Auto-create mapping for manually added restaurant
      console.log('✅ Restaurant exists, auto-creating mapping...')
      const { data: newMapping, error: createMappingError } = await supabase
        .from('website_restaurant_mappings')
        .insert({
          website_restaurant_id: requestBody.website_restaurant_id,
          app_restaurant_uid: requestBody.app_restaurant_uid,
          website_domain: 'gbcanteen-com.stackstaging.com', // Default domain
          callback_url: restaurant.callback_url || 'https://gbcanteen-com.stackstaging.com/api/orders/callback',
          handshake_request_id: null, // No handshake for manually added restaurants
          is_active: true,
          last_handshake: new Date().toISOString()
        })
        .select()
        .single()

      if (createMappingError) {
        console.error('❌ Error creating auto-mapping:', createMappingError)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to create restaurant mapping.',
            details: createMappingError.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      mapping = newMapping
      console.log('🎉 Auto-created mapping for manually added restaurant:', mapping.id)
    }

    // Check for duplicate order (idempotency)
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, orderNumber')
      .eq('orderNumber', requestBody.orderNumber)
      .single()

    if (existingOrder) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Duplicate order detected',
          order_id: existingOrder.id,
          message: `Order ${requestBody.orderNumber} already exists`
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get restaurant registration to find the user ID
    const { data: registration, error: regError } = await supabase
      .from('registered_restaurants')
      .select('id, app_restaurant_uid, restaurant_name')
      .eq('app_restaurant_uid', requestBody.app_restaurant_uid)
      .single()

    if (regError || !registration) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Restaurant not found or not registered',
          details: 'App restaurant UID not found in registrations'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create order in database
    const orderData = {
      userId: registration.id,
      restaurant_uid: requestBody.app_restaurant_uid, // CRITICAL: Add restaurant UID for app filtering
      orderNumber: requestBody.orderNumber,
      amount: requestBody.amount,
      currency: requestBody.currency || 'GBP',
      status: requestBody.status || 'pending',
      items: requestBody.items,
      user: requestBody.user,
      restaurant: requestBody.restaurant || { name: 'GBC Kitchen' },
      time: requestBody.time || new Date().toISOString(),
      notes: requestBody.notes || '',
      paymentMethod: requestBody.paymentMethod || 'website_order',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Store website integration metadata
      website_restaurant_id: requestBody.website_restaurant_id
    }

    console.log('🔍 DEBUG: Cloud order data prepared for insertion:');
    console.log('   - restaurant_uid:', orderData.restaurant_uid);
    console.log('   - website_restaurant_id:', orderData.website_restaurant_id);
    console.log('   - orderNumber:', orderData.orderNumber);
    console.log('   - amount:', orderData.amount);

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      console.error('❌ Error creating order:', orderError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create order',
          details: orderError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update restaurant last_seen timestamp
    await supabase.rpc('update_restaurant_last_seen', {
      restaurant_uid_param: requestBody.app_restaurant_uid
    })

    console.log('✅ Order created successfully:', newOrder.id)

    // Prepare response
    const response: OrderResponse = {
      success: true,
      order_id: newOrder.id,
      message: 'Order received and processed successfully',
      received_at: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in cloud order receive function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* 
Usage Example:

POST https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-order-receive

Headers:
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json

Body:
{
  "website_restaurant_id": "rest_gbc_001",
  "app_restaurant_uid": "uuid-from-handshake-response",
  "orderNumber": "#12345",
  "amount": 25.50,
  "currency": "GBP",
  "status": "pending",
  "items": [
    {
      "title": "Chicken Curry",
      "quantity": 1,
      "unitPrice": "15.50",
      "customizations": []
    },
    {
      "title": "Rice",
      "quantity": 1,
      "unitPrice": "10.00",
      "customizations": []
    }
  ],
  "user": {
    "name": "John Doe",
    "phone": "+44 123 456 7890",
    "email": "john@example.com"
  },
  "restaurant": {
    "name": "GBC Kitchen"
  },
  "time": "2025-01-16T12:30:00Z",
  "notes": "Extra spicy please",
  "paymentMethod": "website_order",
  "callback_url": "https://your-website.com/api/orders/callback",
  "idempotency_key": "order-12345-1642334400"
}

Response:
{
  "success": true,
  "order_id": "uuid-here",
  "message": "Order received and processed successfully",
  "received_at": "2025-01-16T12:30:05Z"
}
*/
