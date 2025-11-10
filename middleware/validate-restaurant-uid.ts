import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ValidationHeaders {
  'X-Restaurant-UID'?: string;
  'X-Website-Restaurant-ID'?: string;
  'X-Idempotency-Key'?: string;
  'Authorization'?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: number;
  appRestaurantUID?: string;
  websiteRestaurantID?: string;
  idempotencyKey?: string;
}

class RestaurantUIDValidator {
  private processedIdempotencyKeys: Set<string> = new Set();
  private readonly MAX_IDEMPOTENCY_CACHE = 1000; // Prevent memory bloat

  /**
   * Validate incoming order request headers
   * App ONLY validates its own UID - does NOT validate or store website ID
   */
  async validateIncomingRequest(headers: ValidationHeaders): Promise<ValidationResult> {
    try {
      console.log('🔍 Validating incoming request headers');

      // Extract headers (case-insensitive)
      const appUID = this.extractHeader(headers, 'X-Restaurant-UID');
      const websiteRestaurantID = this.extractHeader(headers, 'X-Website-Restaurant-ID');
      const idempotencyKey = this.extractHeader(headers, 'X-Idempotency-Key');
      const authorization = this.extractHeader(headers, 'Authorization');

      // Validate required headers exist
      if (!appUID) {
        console.error('❌ Missing X-Restaurant-UID header');
        return {
          valid: false,
          error: 'Missing X-Restaurant-UID header',
          errorCode: 400
        };
      }

      if (!websiteRestaurantID) {
        console.error('❌ Missing X-Website-Restaurant-ID header');
        return {
          valid: false,
          error: 'Missing X-Website-Restaurant-ID header',
          errorCode: 400
        };
      }

      if (!idempotencyKey) {
        console.error('❌ Missing X-Idempotency-Key header');
        return {
          valid: false,
          error: 'Missing X-Idempotency-Key header',
          errorCode: 400
        };
      }

      // Validate app restaurant UID matches stored UID
      const storedUID = await this.getStoredRestaurantUID();
      if (!storedUID) {
        console.error('❌ No stored restaurant UID found - user not authenticated');
        return {
          valid: false,
          error: 'Restaurant not authenticated',
          errorCode: 401
        };
      }

      if (appUID !== storedUID) {
        console.error('❌ Restaurant UID mismatch');
        console.error('   Provided:', appUID);
        console.error('   Expected:', storedUID);
        return {
          valid: false,
          error: 'Restaurant UID mismatch - request rejected',
          errorCode: 403
        };
      }

      // Validate idempotency key (replay protection)
      if (this.processedIdempotencyKeys.has(idempotencyKey)) {
        console.error('❌ Duplicate idempotency key - potential replay attack');
        return {
          valid: false,
          error: 'Duplicate request - idempotency key already processed',
          errorCode: 409
        };
      }

      // Add idempotency key to processed set
      this.addIdempotencyKey(idempotencyKey);

      console.log('✅ Request validation successful');
      console.log('🆔 App Restaurant UID:', appUID);
      console.log('🌐 Website Restaurant ID:', websiteRestaurantID);
      console.log('🔑 Idempotency Key:', idempotencyKey);

      return {
        valid: true,
        appRestaurantUID: appUID,
        websiteRestaurantID: websiteRestaurantID,
        idempotencyKey: idempotencyKey
      };

    } catch (error) {
      console.error('❌ Validation error:', error);
      return {
        valid: false,
        error: 'Internal validation error',
        errorCode: 500
      };
    }
  }

  /**
   * Extract header value (case-insensitive)
   */
  private extractHeader(headers: ValidationHeaders, headerName: string): string | undefined {
    // Try exact case first
    if (headers[headerName as keyof ValidationHeaders]) {
      return headers[headerName as keyof ValidationHeaders];
    }

    // Try case-insensitive search
    const lowerHeaderName = headerName.toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === lowerHeaderName) {
        return value;
      }
    }

    return undefined;
  }

  /**
   * Get stored restaurant UID (same logic as handshake service)
   */
  private async getStoredRestaurantUID(): Promise<string | null> {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.restaurant_uid) {
          return user.restaurant_uid;
        }
        // Fallback to user ID if no restaurant_uid
        return user.id;
      }

      return null;
    } catch (error) {
      console.warn('⚠️ Could not get stored restaurant UID:', error);
      return null;
    }
  }

  /**
   * Add idempotency key to processed set with cache management
   */
  private addIdempotencyKey(key: string): void {
    this.processedIdempotencyKeys.add(key);

    // Prevent memory bloat by clearing old keys when cache gets too large
    if (this.processedIdempotencyKeys.size > this.MAX_IDEMPOTENCY_CACHE) {
      console.log('🧹 Clearing old idempotency keys to prevent memory bloat');
      
      // Convert to array, keep last 500 keys, convert back to Set
      const keysArray = Array.from(this.processedIdempotencyKeys);
      const recentKeys = keysArray.slice(-500);
      this.processedIdempotencyKeys = new Set(recentKeys);
    }
  }

  /**
   * Clear all processed idempotency keys (for testing or reset)
   */
  clearIdempotencyCache(): void {
    this.processedIdempotencyKeys.clear();
    console.log('🧹 Idempotency cache cleared');
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.processedIdempotencyKeys.size,
      maxSize: this.MAX_IDEMPOTENCY_CACHE
    };
  }

  /**
   * Validate callback headers for status updates
   * Extracts both UIDs for callback to website
   */
  async prepareCallbackHeaders(orderPayload: any): Promise<{
    'X-Restaurant-UID': string;
    'X-Website-Restaurant-ID': string;
    'X-Idempotency-Key': string;
    'Content-Type': string;
  } | null> {
    try {
      // Get app restaurant UID
      const appUID = await this.getStoredRestaurantUID();
      if (!appUID) {
        console.error('❌ Cannot prepare callback headers - no app UID');
        return null;
      }

      // Extract website restaurant ID from order payload (temporary in-memory only)
      const websiteRestaurantID = this.extractWebsiteRestaurantID(orderPayload);
      if (!websiteRestaurantID) {
        console.error('❌ Cannot prepare callback headers - no website restaurant ID in order');
        return null;
      }

      // Generate unique idempotency key for callback
      const idempotencyKey = this.generateIdempotencyKey();

      console.log('📤 Preparing callback headers');
      console.log('🆔 App UID:', appUID);
      console.log('🌐 Website Restaurant ID:', websiteRestaurantID);

      return {
        'X-Restaurant-UID': appUID,
        'X-Website-Restaurant-ID': websiteRestaurantID,
        'X-Idempotency-Key': idempotencyKey,
        'Content-Type': 'application/json'
      };

    } catch (error) {
      console.error('❌ Error preparing callback headers:', error);
      return null;
    }
  }

  /**
   * Extract website restaurant ID from order payload (in-memory only)
   */
  private extractWebsiteRestaurantID(orderPayload: any): string | null {
    // Try various possible locations in the order payload
    if (orderPayload?.website_restaurant_id) {
      return orderPayload.website_restaurant_id;
    }

    if (orderPayload?.metadata?.website_restaurant_id) {
      return orderPayload.metadata.website_restaurant_id;
    }

    if (orderPayload?.restaurant?.website_id) {
      return orderPayload.restaurant.website_id;
    }

    if (orderPayload?.source?.restaurant_id) {
      return orderPayload.source.restaurant_id;
    }

    console.warn('⚠️ Could not extract website restaurant ID from order payload');
    return null;
  }

  /**
   * Generate unique idempotency key
   */
  private generateIdempotencyKey(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `callback-${timestamp}-${random}`;
  }
}

export const restaurantUIDValidator = new RestaurantUIDValidator();
