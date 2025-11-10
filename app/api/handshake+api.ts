import { handshakeService, HandshakeRequest } from '../../services/handshake-service';

// Rate limiting storage (in-memory for simplicity)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 handshake requests per hour per IP

/**
 * Handshake API Endpoint
 * POST /api/handshake
 * 
 * Processes handshake requests from website
 * Returns app UID and metadata, does NOT store website data
 */
export async function POST(request: Request): Promise<Response> {
  try {
    console.log('🤝 Handshake API endpoint called');

    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Check rate limiting
    const rateLimitResult = checkRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Maximum 10 handshake requests per hour.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Parse request body
    let handshakeRequest: HandshakeRequest;
    try {
      const body = await request.text();
      handshakeRequest = JSON.parse(body);
    } catch (error) {
      console.error('❌ Invalid JSON in handshake request:', error);
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

    // Process handshake through service
    const result = await handshakeService.processHandshake(handshakeRequest);

    if (result.success && result.data) {
      // Update rate limit counter
      updateRateLimit(clientIP);

      console.log('✅ Handshake completed successfully');
      return new Response(
        JSON.stringify(result.data),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.error('❌ Handshake failed:', result.error);
      
      // Determine appropriate status code based on error
      let statusCode = 500;
      if (result.error?.includes('not found') || result.error?.includes('not authenticated')) {
        statusCode = 401;
      } else if (result.error?.includes('Missing') || result.error?.includes('Invalid')) {
        statusCode = 400;
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || 'Handshake processing failed'
        }),
        {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('❌ Handshake API error:', error);
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
 * Handle unsupported HTTP methods
 */
export async function GET(): Promise<Response> {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Method not allowed. Use POST for handshake requests.',
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

/**
 * Extract client IP address for rate limiting
 */
function getClientIP(request: Request): string {
  // Try various headers for client IP
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  const xRealIP = request.headers.get('X-Real-IP');
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0].trim();
  }
  
  if (xRealIP) {
    return xRealIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to a default identifier
  return 'unknown';
}

/**
 * Check if request is within rate limit
 */
function checkRateLimit(clientIP: string): { allowed: boolean; resetTime: number } {
  const now = Date.now();
  const existing = rateLimitMap.get(clientIP);
  
  if (!existing) {
    return { allowed: true, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  // Check if window has expired
  if (now > existing.resetTime) {
    rateLimitMap.delete(clientIP);
    return { allowed: true, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  // Check if within limit
  if (existing.count < RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: true, resetTime: existing.resetTime };
  }
  
  return { allowed: false, resetTime: existing.resetTime };
}

/**
 * Update rate limit counter
 */
function updateRateLimit(clientIP: string): void {
  const now = Date.now();
  const existing = rateLimitMap.get(clientIP);
  
  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    rateLimitMap.set(clientIP, { count: existing.count + 1, resetTime: existing.resetTime });
  }
  
  // Clean up old entries to prevent memory bloat
  cleanupRateLimitMap();
}

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimitMap(): void {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}
