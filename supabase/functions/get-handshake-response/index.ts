import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HandshakeStatusResponse {
  success: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  handshake_request_id: string;
  response?: {
    restaurant_uid: string;
    device_label: string;
    app_version: string;
    platform: string;
    capabilities: string[];
    response_timestamp: string;
  };
  message?: string;
  error?: string;
  expires_at?: string;
  created_at?: string;
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

    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get handshake request ID from URL parameters
    const url = new URL(req.url)
    const handshakeRequestId = url.searchParams.get('handshake_request_id')

    if (!handshakeRequestId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameter: handshake_request_id' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔍 Checking handshake status for request:', handshakeRequestId)

    // First, expire any old pending requests
    await supabase.rpc('expire_old_handshake_requests')

    // Get handshake request details
    const { data: handshakeRequest, error: requestError } = await supabase
      .from('handshake_requests')
      .select(`
        id,
        website_restaurant_id,
        callback_url,
        status,
        target_restaurant_uid,
        expires_at,
        created_at,
        updated_at
      `)
      .eq('id', handshakeRequestId)
      .single()

    if (requestError || !handshakeRequest) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Handshake request not found',
          handshake_request_id: handshakeRequestId
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if request has expired
    const now = new Date()
    const expiresAt = new Date(handshakeRequest.expires_at)
    
    if (now > expiresAt && handshakeRequest.status === 'pending') {
      // Update status to expired
      await supabase
        .from('handshake_requests')
        .update({ 
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', handshakeRequestId)

      return new Response(
        JSON.stringify({
          success: false,
          status: 'expired',
          handshake_request_id: handshakeRequestId,
          message: 'Handshake request has expired. Please create a new request.',
          expires_at: handshakeRequest.expires_at,
          created_at: handshakeRequest.created_at
        } as HandshakeStatusResponse),
        { 
          status: 408, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If request is completed, get the response
    if (handshakeRequest.status === 'completed') {
      const { data: handshakeResponse, error: responseError } = await supabase
        .from('handshake_responses')
        .select(`
          restaurant_uid,
          device_label,
          app_version,
          platform,
          capabilities,
          response_timestamp
        `)
        .eq('handshake_request_id', handshakeRequestId)
        .single()

      if (responseError || !handshakeResponse) {
        return new Response(
          JSON.stringify({
            success: false,
            status: 'failed',
            handshake_request_id: handshakeRequestId,
            error: 'Handshake response not found',
            message: 'Request was marked as completed but response data is missing.'
          } as HandshakeStatusResponse),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Also get or create the website restaurant mapping
      const { data: mapping } = await supabase
        .from('website_restaurant_mappings')
        .select('*')
        .eq('website_restaurant_id', handshakeRequest.website_restaurant_id)
        .eq('app_restaurant_uid', handshakeResponse.restaurant_uid)
        .single()

      if (!mapping) {
        // Create the mapping if it doesn't exist
        await supabase
          .from('website_restaurant_mappings')
          .insert({
            website_restaurant_id: handshakeRequest.website_restaurant_id,
            app_restaurant_uid: handshakeResponse.restaurant_uid,
            website_domain: new URL(handshakeRequest.callback_url).hostname,
            callback_url: handshakeRequest.callback_url,
            handshake_request_id: handshakeRequestId,
            is_active: true,
            last_handshake: new Date().toISOString()
          })
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: 'completed',
          handshake_request_id: handshakeRequestId,
          response: handshakeResponse,
          message: 'Handshake completed successfully. You can now send orders to this restaurant.',
          created_at: handshakeRequest.created_at
        } as HandshakeStatusResponse),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // For other statuses (pending, processing, failed)
    let message = ''
    let statusCode = 200

    switch (handshakeRequest.status) {
      case 'pending':
        message = 'Handshake request is pending. Waiting for restaurant app to respond.'
        statusCode = 202 // Accepted
        break
      case 'processing':
        message = 'Handshake request is being processed by the restaurant app.'
        statusCode = 202 // Accepted
        break
      case 'failed':
        message = 'Handshake request failed. Please try again or contact support.'
        statusCode = 500
        break
      default:
        message = `Handshake request status: ${handshakeRequest.status}`
    }

    return new Response(
      JSON.stringify({
        success: handshakeRequest.status !== 'failed',
        status: handshakeRequest.status,
        handshake_request_id: handshakeRequestId,
        message: message,
        expires_at: handshakeRequest.expires_at,
        created_at: handshakeRequest.created_at
      } as HandshakeStatusResponse),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in get handshake response function:', error)
    
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

GET https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/get-handshake-response?handshake_request_id=uuid-here

Headers:
Authorization: Bearer YOUR_SUPABASE_ANON_KEY

Response (Completed):
{
  "success": true,
  "status": "completed",
  "handshake_request_id": "uuid-here",
  "response": {
    "restaurant_uid": "restaurant-uuid",
    "device_label": "Kitchen Tablet - 2025-01-16",
    "app_version": "3.0.0",
    "platform": "android",
    "capabilities": ["real_time_notifications", "thermal_printing", "order_status_updates"],
    "response_timestamp": "2025-01-16T10:30:05Z"
  },
  "message": "Handshake completed successfully. You can now send orders to this restaurant.",
  "created_at": "2025-01-16T10:30:00Z"
}

Response (Pending):
{
  "success": true,
  "status": "pending",
  "handshake_request_id": "uuid-here",
  "message": "Handshake request is pending. Waiting for restaurant app to respond.",
  "expires_at": "2025-01-16T10:40:00Z",
  "created_at": "2025-01-16T10:30:00Z"
}
*/
