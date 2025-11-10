// =====================================================
// RESTAURANT LOGIN EDGE FUNCTION WITH AUTO-REGISTRATION
// =====================================================
// Supabase Edge Function for restaurant authentication with auto-registration
// Endpoint: POST /functions/v1/restaurant-login
// Purpose: Authenticate restaurants using username and password
// Features: Automatic registration for new restaurants on first login

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, user-agent, x-website-domain',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Initialize Supabase client with service role for database operations
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

interface ValidationError {
  field: string;
  message: string;
}

function validateLoginCredentials(username: string, password: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!username || username.trim().length === 0) {
    errors.push({ field: 'username', message: 'Username is required' });
  }
  
  if (!password || password.trim().length === 0) {
    errors.push({ field: 'password', message: 'Password is required' });
  }
  
  return errors;
}

// =====================================================
// PASSWORD HASHING FUNCTION
// =====================================================

async function hashPassword(password: string): Promise<string> {
  try {
    // Use Web Crypto API for password hashing (same as registration)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
}

// =====================================================
// PASSWORD VERIFICATION FUNCTION
// =====================================================

async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    // Hash the provided password using the same method as registration
    const encoder = new TextEncoder();
    const data = encoder.encode(plainPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Compare with stored hash
    return hashHex === hashedPassword;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// =====================================================
// AUTO-REGISTRATION FUNCTION
// =====================================================

async function autoRegisterRestaurant(
  username: string,
  password: string,
  clientIP: string,
  userAgent: string
): Promise<{ success: boolean; restaurant?: any; error?: string }> {
  try {
    console.log(`🔄 Auto-registering restaurant: ${username}`);

    // Generate default values for required fields
    const restaurantName = username.charAt(0).toUpperCase() + username.slice(1).replace(/[_-]/g, ' ');
    const websiteRestaurantId = `auto_${username}_${Date.now()}`;
    const defaultEmail = `${username}@auto-registered.gbcapp.com`;
    const defaultPhone = '+44 000 000 0000';
    const defaultAddress = 'Auto-registered restaurant address';
    const defaultCallbackUrl = 'https://auto-registered.gbcapp.com/callback';

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create restaurant registration data
    const registrationData = {
      website_restaurant_id: websiteRestaurantId,
      restaurant_name: restaurantName,
      restaurant_phone: defaultPhone,
      restaurant_email: defaultEmail,
      restaurant_address: defaultAddress,
      callback_url: defaultCallbackUrl,
      username: username.toLowerCase(),
      password_hash: passwordHash,
      password_changed_at: new Date().toISOString(),
      failed_login_attempts: 0,
      is_active: true
    };

    // Insert new restaurant
    const { data: newRestaurant, error: insertError } = await supabaseClient
      .from('registered_restaurants')
      .insert(registrationData)
      .select('app_restaurant_uid, username, restaurant_name')
      .single();

    if (insertError) {
      console.error('Auto-registration failed:', insertError);
      return { success: false, error: 'Failed to auto-register restaurant' };
    }

    // Log the auto-registration
    await supabaseClient
      .from('restaurant_registration_logs')
      .insert({
        ip_address: clientIP,
        website_restaurant_id: websiteRestaurantId,
        restaurant_email: defaultEmail,
        restaurant_phone: defaultPhone,
        status: 'success',
        user_agent: userAgent,
        website_domain: 'auto-registration'
      });

    console.log(`✅ Auto-registration successful for: ${username}`);
    return { success: true, restaurant: newRestaurant };

  } catch (error) {
    console.error('Auto-registration error:', error);
    return { success: false, error: 'Auto-registration failed' };
  }
}

// =====================================================
// AUTHENTICATION LOGGING FUNCTION
// =====================================================

async function logAuthenticationAttempt(
  restaurantUid: string | null,
  username: string,
  ipAddress: string,
  attemptType: 'login_success' | 'login_failed' | 'account_locked' | 'auto_registered',
  failureReason?: string,
  userAgent?: string
) {
  try {
    await supabaseClient
      .from('restaurant_authentication_logs')
      .insert({
        restaurant_uid: restaurantUid,
        username: username,
        ip_address: ipAddress,
        user_agent: userAgent,
        attempt_type: attemptType,
        failure_reason: failureReason
      });
  } catch (error) {
    console.error('Failed to log authentication attempt:', error);
  }
}

// =====================================================
// MAIN EDGE FUNCTION
// =====================================================

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed. Use POST for restaurant login.',
      supportedMethods: ['POST']
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Extract client information
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate credentials
    const validationErrors = validateLoginCredentials(requestData.username, requestData.password);
    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Validation failed',
        validation_errors: validationErrors
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find restaurant by username
    const { data: restaurant, error: findError } = await supabaseClient
      .from('registered_restaurants')
      .select('app_restaurant_uid, username, password_hash, failed_login_attempts, account_locked_until, restaurant_name')
      .eq('username', requestData.username.toLowerCase())
      .eq('is_active', true)
      .single();

    // If restaurant not found, attempt auto-registration
    if (findError || !restaurant) {
      console.log(`🔍 Restaurant not found: ${requestData.username}. Attempting auto-registration...`);

      const autoRegResult = await autoRegisterRestaurant(
        requestData.username,
        requestData.password,
        clientIP,
        userAgent
      );

      if (!autoRegResult.success) {
        console.error('Auto-registration failed:', autoRegResult.error);

        await logAuthenticationAttempt(
          null,
          requestData.username,
          clientIP,
          'login_failed',
          'Username not found and auto-registration failed',
          userAgent
        );

        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid username or password'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Auto-registration successful, log and return success
      await logAuthenticationAttempt(
        autoRegResult.restaurant.app_restaurant_uid,
        requestData.username,
        clientIP,
        'auto_registered',
        'Restaurant auto-registered and authenticated',
        userAgent
      );

      console.log(`✅ Auto-registration and login successful for: ${requestData.username}`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Restaurant auto-registered and login successful',
        restaurant: {
          app_restaurant_uid: autoRegResult.restaurant.app_restaurant_uid,
          username: autoRegResult.restaurant.username,
          restaurant_name: autoRegResult.restaurant.restaurant_name
        },
        session: {
          authenticated: true,
          login_time: new Date().toISOString(),
          auto_registered: true
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if account is locked
    if (restaurant.account_locked_until && new Date(restaurant.account_locked_until) > new Date()) {
      await logAuthenticationAttempt(
        restaurant.app_restaurant_uid,
        requestData.username,
        clientIP,
        'account_locked',
        'Account temporarily locked',
        userAgent
      );

      return new Response(JSON.stringify({
        success: false,
        error: 'Account temporarily locked due to multiple failed login attempts. Please try again later.',
        locked_until: restaurant.account_locked_until
      }), {
        status: 423,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(requestData.password, restaurant.password_hash);

    if (!isPasswordValid) {
      // Increment failed attempts
      const { data: updatedRestaurant } = await supabaseClient
        .rpc('increment_failed_attempts', { restaurant_uid: restaurant.app_restaurant_uid });

      // Check if account should be locked
      await supabaseClient
        .rpc('lock_account_if_needed', { restaurant_uid: restaurant.app_restaurant_uid });

      await logAuthenticationAttempt(
        restaurant.app_restaurant_uid,
        requestData.username,
        clientIP,
        'login_failed',
        'Invalid password',
        userAgent
      );

      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid username or password'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Reset failed attempts on successful login
    await supabaseClient
      .rpc('reset_failed_attempts', { restaurant_uid: restaurant.app_restaurant_uid });

    // Log successful authentication
    await logAuthenticationAttempt(
      restaurant.app_restaurant_uid,
      requestData.username,
      clientIP,
      'login_success',
      null,
      userAgent
    );

    // Return success response with restaurant information
    return new Response(JSON.stringify({
      success: true,
      message: 'Login successful',
      restaurant: {
        app_restaurant_uid: restaurant.app_restaurant_uid,
        username: restaurant.username,
        restaurant_name: restaurant.restaurant_name
      },
      session: {
        authenticated: true,
        login_time: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred during authentication'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// =====================================================
// EDGE FUNCTION COMPLETE
// =====================================================
// This Edge Function provides:
// ✅ Secure restaurant authentication with username/password
// ✅ Automatic restaurant registration on first login attempt
// ✅ Password verification using SHA-256 hashing
// ✅ Account lockout protection (5 failed attempts = 15 min lockout)
// ✅ Comprehensive authentication logging for security monitoring
// ✅ CORS support for cross-origin requests
// ✅ Input validation and error handling
// ✅ Single endpoint for both registration and authentication
// ✅ Seamless user experience with auto-registration
// =====================================================
