// =====================================================
// CLOUD-BASED RESTAURANT REGISTRATION EDGE FUNCTION
// =====================================================
// Supabase Edge Function for registering restaurants with the GBC Kitchen App
// Endpoint: POST /functions/v1/cloud-register-restaurant
// Architecture: Cloud-first, zero device IP dependencies

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

function validateEmail(email: string): ValidationError | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { field: 'restaurant_email', message: 'Email is required' };
  if (email.length > 255) return { field: 'restaurant_email', message: 'Email must be less than 255 characters' };
  if (!emailRegex.test(email)) return { field: 'restaurant_email', message: 'Invalid email format' };
  return null;
}

function validatePhone(phone: string): ValidationError | null {
  const phoneRegex = /^\+?[0-9\s\-()]+$/;
  if (!phone) return { field: 'restaurant_phone', message: 'Phone is required' };
  if (phone.length < 10) return { field: 'restaurant_phone', message: 'Phone must be at least 10 characters' };
  if (phone.length > 20) return { field: 'restaurant_phone', message: 'Phone must be less than 20 characters' };
  if (!phoneRegex.test(phone)) return { field: 'restaurant_phone', message: 'Invalid phone format. Use only numbers, spaces, hyphens, parentheses, and + symbol' };
  return null;
}

function validateCallbackUrl(url: string): ValidationError | null {
  if (!url) return { field: 'callback_url', message: 'Callback URL is required' };
  if (!url.startsWith('https://')) return { field: 'callback_url', message: 'Callback URL must start with https://' };
  if (url.length > 500) return { field: 'callback_url', message: 'Callback URL must be less than 500 characters' };
  try {
    new URL(url);
    return null;
  } catch {
    return { field: 'callback_url', message: 'Invalid URL format' };
  }
}

function validateRestaurantName(name: string): ValidationError | null {
  if (!name) return { field: 'restaurant_name', message: 'Restaurant name is required' };
  if (name.length < 3) return { field: 'restaurant_name', message: 'Restaurant name must be at least 3 characters' };
  if (name.length > 200) return { field: 'restaurant_name', message: 'Restaurant name must be less than 200 characters' };
  return null;
}

function validateAddress(address: string): ValidationError | null {
  if (!address) return { field: 'restaurant_address', message: 'Restaurant address is required' };
  if (address.length < 10) return { field: 'restaurant_address', message: 'Restaurant address must be at least 10 characters' };
  if (address.length > 500) return { field: 'restaurant_address', message: 'Restaurant address must be less than 500 characters' };
  return null;
}

function validateWebsiteRestaurantId(id: string): ValidationError | null {
  if (!id) return { field: 'website_restaurant_id', message: 'Website restaurant ID is required' };
  if (id.length > 100) return { field: 'website_restaurant_id', message: 'Website restaurant ID must be less than 100 characters' };
  return null;
}

function validateUsername(username: string): ValidationError | null {
  if (!username) return { field: 'username', message: 'Username is required' };
  if (username.length < 3) return { field: 'username', message: 'Username must be at least 3 characters' };
  if (username.length > 50) return { field: 'username', message: 'Username must be less than 50 characters' };
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return { field: 'username', message: 'Username can only contain letters, numbers, and underscores' };
  return null;
}

function validatePassword(password: string): ValidationError | null {
  if (!password) return { field: 'password', message: 'Password is required' };
  if (password.length < 8) return { field: 'password', message: 'Password must be at least 8 characters' };
  if (password.length > 128) return { field: 'password', message: 'Password must be less than 128 characters' };

  // Check for at least one uppercase, one lowercase, one number, and one special character
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    return {
      field: 'password',
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    };
  }

  return null;
}

function validateOptionalField(value: string | undefined, fieldName: string, maxLength: number): ValidationError | null {
  if (value && value.length > maxLength) {
    return { field: fieldName, message: `${fieldName} must be less than ${maxLength} characters` };
  }
  return null;
}

// =====================================================
// RATE LIMITING FUNCTION
// =====================================================

async function checkRateLimit(ipAddress: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('restaurant_registration_logs')
      .select('id')
      .eq('ip_address', ipAddress)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .limit(10);

    if (error) {
      console.error('Rate limit check error:', error);
      return true; // Allow request if we can't check (fail open)
    }

    return (data?.length || 0) < 10;
  } catch (error) {
    console.error('Rate limit check exception:', error);
    return true; // Allow request if we can't check (fail open)
  }
}

// =====================================================
// PASSWORD HASHING FUNCTION
// =====================================================

async function hashPassword(password: string): Promise<string> {
  try {
    // Use Web Crypto API for password hashing
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
// DUPLICATE DETECTION FUNCTIONS
// =====================================================

async function checkDuplicates(requestData: any): Promise<{ isDuplicate: boolean; duplicateField?: string; existingUid?: string }> {
  try {
    // Check for duplicate email
    const { data: emailDuplicate } = await supabaseClient
      .from('registered_restaurants')
      .select('app_restaurant_uid')
      .eq('restaurant_email', requestData.restaurant_email.toLowerCase())
      .single();

    if (emailDuplicate) {
      return { isDuplicate: true, duplicateField: 'restaurant_email', existingUid: emailDuplicate.app_restaurant_uid };
    }

    // Check for duplicate username
    if (requestData.username) {
      const { data: usernameDuplicate } = await supabaseClient
        .from('registered_restaurants')
        .select('app_restaurant_uid')
        .eq('username', requestData.username.toLowerCase())
        .single();

      if (usernameDuplicate) {
        return { isDuplicate: true, duplicateField: 'username', existingUid: usernameDuplicate.app_restaurant_uid };
      }
    }

    // Check for duplicate phone (normalized)
    const normalizedPhone = requestData.restaurant_phone.replace(/[^+0-9]/g, '');
    const { data: phoneDuplicate } = await supabaseClient
      .rpc('normalize_phone', { phone_input: requestData.restaurant_phone })
      .then(async (normalizedResult) => {
        if (normalizedResult.error) return null;
        
        const { data } = await supabaseClient
          .from('registered_restaurants')
          .select('app_restaurant_uid, restaurant_phone')
          .then(async (result) => {
            if (result.error || !result.data) return null;
            
            // Check each phone number for match after normalization
            for (const restaurant of result.data) {
              const existingNormalized = restaurant.restaurant_phone.replace(/[^+0-9]/g, '');
              if (existingNormalized === normalizedPhone) {
                return restaurant;
              }
            }
            return null;
          });
        
        return data;
      });

    if (phoneDuplicate) {
      return { isDuplicate: true, duplicateField: 'restaurant_phone', existingUid: phoneDuplicate.app_restaurant_uid };
    }

    // Check for duplicate website_restaurant_id
    const { data: websiteIdDuplicate } = await supabaseClient
      .from('registered_restaurants')
      .select('app_restaurant_uid')
      .eq('website_restaurant_id', requestData.website_restaurant_id)
      .single();

    if (websiteIdDuplicate) {
      return { isDuplicate: true, duplicateField: 'website_restaurant_id', existingUid: websiteIdDuplicate.app_restaurant_uid };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('Duplicate check error:', error);
    return { isDuplicate: false }; // Allow registration if we can't check duplicates
  }
}

// =====================================================
// LOGGING FUNCTION
// =====================================================

async function logRegistrationAttempt(
  ipAddress: string,
  requestData: any,
  status: string,
  errorMessage?: string,
  userAgent?: string,
  websiteDomain?: string
) {
  try {
    await supabaseClient
      .from('restaurant_registration_logs')
      .insert({
        ip_address: ipAddress,
        website_restaurant_id: requestData?.website_restaurant_id,
        restaurant_email: requestData?.restaurant_email,
        restaurant_phone: requestData?.restaurant_phone,
        status,
        error_message: errorMessage,
        user_agent: userAgent,
        website_domain: websiteDomain
      });
  } catch (error) {
    console.error('Failed to log registration attempt:', error);
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
      error: 'Method not allowed. Use POST for restaurant registration.',
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
    const websiteDomain = req.headers.get('x-website-domain') || '';

    // Check rate limiting
    const isWithinRateLimit = await checkRateLimit(clientIP);
    if (!isWithinRateLimit) {
      await logRegistrationAttempt(clientIP, null, 'rate_limited', 'Rate limit exceeded', userAgent, websiteDomain);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limit exceeded. Maximum 10 registration requests per hour per IP.',
        retry_after: 3600
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch {
      await logRegistrationAttempt(clientIP, null, 'validation_error', 'Invalid JSON in request body', userAgent, websiteDomain);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate all required fields
    const validationErrors: ValidationError[] = [];

    const emailError = validateEmail(requestData.restaurant_email);
    if (emailError) validationErrors.push(emailError);

    const phoneError = validatePhone(requestData.restaurant_phone);
    if (phoneError) validationErrors.push(phoneError);

    const callbackError = validateCallbackUrl(requestData.callback_url);
    if (callbackError) validationErrors.push(callbackError);

    const nameError = validateRestaurantName(requestData.restaurant_name);
    if (nameError) validationErrors.push(nameError);

    const addressError = validateAddress(requestData.restaurant_address);
    if (addressError) validationErrors.push(addressError);

    const websiteIdError = validateWebsiteRestaurantId(requestData.website_restaurant_id);
    if (websiteIdError) validationErrors.push(websiteIdError);

    // Validate username and password (optional for backward compatibility)
    if (requestData.username) {
      const usernameError = validateUsername(requestData.username);
      if (usernameError) validationErrors.push(usernameError);
    }

    if (requestData.password) {
      const passwordError = validatePassword(requestData.password);
      if (passwordError) validationErrors.push(passwordError);
    }

    const ownerNameError = validateOptionalField(requestData.owner_name, 'owner_name', 200);
    if (ownerNameError) validationErrors.push(ownerNameError);

    const categoryError = validateOptionalField(requestData.category, 'category', 100);
    if (categoryError) validationErrors.push(categoryError);

    // Return validation errors if any
    if (validationErrors.length > 0) {
      await logRegistrationAttempt(
        clientIP, 
        requestData, 
        'validation_error', 
        `Validation failed: ${validationErrors.map(e => e.message).join(', ')}`,
        userAgent,
        websiteDomain
      );
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Validation failed',
        validation_errors: validationErrors
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check for duplicates
    const duplicateCheck = await checkDuplicates(requestData);
    if (duplicateCheck.isDuplicate) {
      const statusMap: { [key: string]: string } = {
        'restaurant_email': 'duplicate_email',
        'restaurant_phone': 'duplicate_phone',
        'website_restaurant_id': 'duplicate_website_id',
        'username': 'duplicate_username'
      };
      
      await logRegistrationAttempt(
        clientIP,
        requestData,
        statusMap[duplicateCheck.duplicateField!],
        `Duplicate ${duplicateCheck.duplicateField}`,
        userAgent,
        websiteDomain
      );
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Restaurant already registered',
        duplicate_field: duplicateCheck.duplicateField,
        existing_app_restaurant_uid: duplicateCheck.existingUid,
        message: `A restaurant with this ${duplicateCheck.duplicateField?.replace('restaurant_', '')} already exists. Use the existing UID for integration.`
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare registration data
    const registrationData: any = {
      website_restaurant_id: requestData.website_restaurant_id,
      restaurant_name: requestData.restaurant_name,
      restaurant_phone: requestData.restaurant_phone,
      restaurant_email: requestData.restaurant_email.toLowerCase(),
      restaurant_address: requestData.restaurant_address,
      owner_name: requestData.owner_name || null,
      category: requestData.category || null,
      callback_url: requestData.callback_url,
      is_active: true
    };

    // Add authentication fields if provided
    if (requestData.username && requestData.password) {
      const passwordHash = await hashPassword(requestData.password);
      registrationData.username = requestData.username.toLowerCase();
      registrationData.password_hash = passwordHash;
      registrationData.password_changed_at = new Date().toISOString();
    }

    // Create new restaurant registration
    const { data: newRestaurant, error: insertError } = await supabaseClient
      .from('registered_restaurants')
      .insert(registrationData)
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      await logRegistrationAttempt(
        clientIP,
        requestData,
        'validation_error',
        `Database error: ${insertError.message}`,
        userAgent,
        websiteDomain
      );
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to register restaurant',
        details: insertError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create website-restaurant mapping for integration with cloud handshake system
    const { error: mappingError } = await supabaseClient
      .from('website_restaurant_mappings')
      .insert({
        website_restaurant_id: requestData.website_restaurant_id,
        app_restaurant_uid: newRestaurant.app_restaurant_uid,
        callback_url: requestData.callback_url,
        is_active: true
      });

    if (mappingError) {
      console.error('Mapping creation error:', mappingError);
      // Don't fail the registration if mapping creation fails, just log it
    }

    // Log successful registration
    await logRegistrationAttempt(
      clientIP,
      requestData,
      'success',
      null,
      userAgent,
      websiteDomain
    );

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Restaurant registered successfully',
      app_restaurant_uid: newRestaurant.app_restaurant_uid,
      website_restaurant_id: newRestaurant.website_restaurant_id,
      registered_at: newRestaurant.created_at,
      next_steps: {
        handshake: 'Use cloud-handshake endpoint with this app_restaurant_uid as target_restaurant_uid',
        orders: 'Use cloud-order-receive endpoint to send orders to this restaurant'
      }
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred during registration'
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
// ✅ Comprehensive input validation with detailed error messages
// ✅ Duplicate detection for email, phone, and website_restaurant_id
// ✅ Rate limiting (10 requests per hour per IP)
// ✅ Automatic website-restaurant mapping creation
// ✅ Detailed audit logging for monitoring and debugging
// ✅ CORS support for cross-origin requests
// ✅ Integration with existing cloud handshake system
// ✅ Production-ready error handling and security
// =====================================================
