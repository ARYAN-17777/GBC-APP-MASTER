import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CloudHandshakeRequest {
  website_restaurant_id: string;
  callback_url: string;
  website_domain?: string;
  target_restaurant_uid?: string; // Optional: target specific restaurant
}

interface HandshakeResponse {
  success: boolean;
  handshake_request_id?: string;
  message?: string;
  error?: string;
  estimated_response_time?: string;
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
    const requestBody: CloudHandshakeRequest = await req.json()

    // Validate required fields
    if (!requestBody.website_restaurant_id || !requestBody.callback_url) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: website_restaurant_id and callback_url are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate callback URL format
    try {
      new URL(requestBody.callback_url)
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid callback_url format' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get client information
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Extract domain from callback URL
    const websiteDomain = requestBody.website_domain || 
                         new URL(requestBody.callback_url).hostname

    console.log('🤝 Processing cloud handshake request:', {
      website_restaurant_id: requestBody.website_restaurant_id,
      callback_url: requestBody.callback_url,
      website_domain: websiteDomain,
      client_ip: clientIP
    })

    // Check for existing pending handshake requests from this website
    const { data: existingRequests } = await supabase
      .from('handshake_requests')
      .select('id, status, created_at')
      .eq('website_restaurant_id', requestBody.website_restaurant_id)
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString())

    if (existingRequests && existingRequests.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Pending handshake request already exists for this restaurant',
          handshake_request_id: existingRequests[0].id,
          message: 'Please wait for the existing request to complete or expire'
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check rate limiting (max 10 requests per hour per IP)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentRequests, count } = await supabase
      .from('handshake_requests')
      .select('id', { count: 'exact' })
      .eq('requester_ip', clientIP)
      .gte('created_at', oneHourAgo)

    if (count && count >= 10) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded. Maximum 10 handshake requests per hour per IP address.',
          retry_after: '3600'
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '3600'
          } 
        }
      )
    }

    // Find target restaurant if specified
    let targetRestaurantUID = requestBody.target_restaurant_uid
    
    if (!targetRestaurantUID) {
      // Try to find restaurant from existing mappings
      const { data: existingMapping } = await supabase
        .from('website_restaurant_mappings')
        .select('app_restaurant_uid')
        .eq('website_restaurant_id', requestBody.website_restaurant_id)
        .eq('is_active', true)
        .order('last_handshake', { ascending: false })
        .limit(1)
        .single()

      if (existingMapping) {
        targetRestaurantUID = existingMapping.app_restaurant_uid
        console.log('📍 Found existing restaurant mapping:', targetRestaurantUID)
      }
    }

    // Create handshake request
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    
    const { data: handshakeRequest, error: insertError } = await supabase
      .from('handshake_requests')
      .insert({
        website_restaurant_id: requestBody.website_restaurant_id,
        callback_url: requestBody.callback_url,
        request_timestamp: new Date().toISOString(),
        status: 'pending',
        target_restaurant_uid: targetRestaurantUID,
        requester_ip: clientIP,
        requester_user_agent: userAgent,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating handshake request:', insertError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create handshake request',
          details: insertError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Handshake request created successfully:', handshakeRequest.id)

    // Prepare response
    const response: HandshakeResponse = {
      success: true,
      handshake_request_id: handshakeRequest.id,
      message: 'Handshake request created successfully. Waiting for restaurant app response.',
      estimated_response_time: '30-60 seconds'
    }

    if (targetRestaurantUID) {
      response.message += ` Request sent to restaurant: ${targetRestaurantUID}`
    } else {
      response.message += ' Request broadcasted to all available restaurants.'
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in cloud handshake function:', error)
    
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

POST https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-handshake

Headers:
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json

Body:
{
  "website_restaurant_id": "rest_gbc_001",
  "callback_url": "https://your-restaurant-website.com/api/orders/callback",
  "website_domain": "your-restaurant-website.com"
}

Response:
{
  "success": true,
  "handshake_request_id": "uuid-here",
  "message": "Handshake request created successfully. Waiting for restaurant app response.",
  "estimated_response_time": "30-60 seconds"
}
*/
