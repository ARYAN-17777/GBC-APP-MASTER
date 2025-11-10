import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { restaurantUIDValidator, ValidationHeaders } from '../middleware/validate-restaurant-uid';
import { supabaseAuth } from './supabase-auth';

// Supabase configuration (for local database updates)
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// GBC Website API Configuration
const GBC_API_BASE_URL = 'https://gbcanteen-com.stackstaging.com';
const GBC_API_AUTH = 'Basic Z2JjX2tpdGNoZW46R0JDQEtpdGNoZW4jMjAyNQ==';

interface OrderStatusPayload {
  order_number: string;
  order_number_digits: string; // Companion field for server normalization
  status: 'approved' | 'preparing' | 'ready' | 'dispatched' | 'cancelled';
  timestamp: string;
  cancelled_at?: string; // Required for cancel requests - ISO-8601 UTC string
  updated_by?: string;
  dispatched_by?: string;
  cancelled_by?: string;
  notes?: string;
  cancel_reason?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface QueuedRequest {
  id: string;
  endpoint: string;
  payload: OrderStatusPayload;
  timestamp: string;
  retryCount: number;
}

class GBCOrderStatusAPI {
  private offlineQueue: QueuedRequest[] = [];
  private isOnline: boolean = true;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private orderNumberFormatCache: Map<string, 'hash' | 'digits'> = new Map(); // Cache successful format per host

  constructor() {
    this.loadOfflineQueue();
    this.setupNetworkListener();
  }

  /**
   * Canonicalize order ID into both formats
   */
  private canonicalizeOrderId(orderNumber: string): { digits: string; hashForm: string } {
    const digits = orderNumber.startsWith('#') ? orderNumber.substring(1) : orderNumber;
    const hashForm = `#${digits}`;
    return { digits, hashForm };
  }

  /**
   * Get restaurant UID for tenant headers
   */
  private async getRestaurantUID(): Promise<string> {
    try {
      // Try to get from stored restaurant session first
      const restaurantSession = await AsyncStorage.getItem('restaurant_session');
      if (restaurantSession) {
        const restaurant = JSON.parse(restaurantSession);
        if (restaurant.app_restaurant_uid) {
          return restaurant.app_restaurant_uid;
        }
        // Fallback to user ID if no restaurant_uid
        const currentUser = supabaseAuth.getCurrentRestaurantUser();
        return currentUser?.app_restaurant_uid || 'default-restaurant-uid';
      }

      // Fallback to a default restaurant UID
      return 'default-restaurant-uid';
    } catch (error) {
      console.warn('⚠️ Could not get restaurant UID, using default:', error);
      return 'default-restaurant-uid';
    }
  }

  /**
   * Generate unique idempotency key for requests
   */
  private generateIdempotencyKey(): string {
    return `gbc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get common headers for all API requests
   */
  private async getHeaders(orderDigits: string, idempotencyKey?: string): Promise<Record<string, string>> {
    const restaurantUID = await this.getRestaurantUID();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': GBC_API_AUTH,
      'X-Restaurant-UID': restaurantUID,
      'X-Order-Number-Digits': orderDigits,
    };

    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }

    return headers;
  }

  /**
   * Validate incoming order request headers
   * App ONLY validates its own UID - does NOT validate or store website ID
   */
  async validateIncomingOrder(headers: ValidationHeaders): Promise<{
    valid: boolean;
    error?: string;
    errorCode?: number;
    websiteRestaurantID?: string;
  }> {
    try {
      console.log('🔍 Validating incoming order request');

      const result = await restaurantUIDValidator.validateIncomingRequest(headers);

      if (!result.valid) {
        console.error('❌ Order validation failed:', result.error);
        return {
          valid: false,
          error: result.error,
          errorCode: result.errorCode
        };
      }

      console.log('✅ Incoming order validation successful');
      return {
        valid: true,
        websiteRestaurantID: result.websiteRestaurantID
      };

    } catch (error) {
      console.error('❌ Order validation error:', error);
      return {
        valid: false,
        error: 'Internal validation error',
        errorCode: 500
      };
    }
  }

  /**
   * Prepare callback headers for status updates to website
   * Includes both app UID and website restaurant ID
   */
  async prepareCallbackHeaders(orderPayload: any): Promise<Record<string, string> | null> {
    try {
      console.log('📤 Preparing callback headers for status update');

      const headers = await restaurantUIDValidator.prepareCallbackHeaders(orderPayload);

      if (!headers) {
        console.error('❌ Failed to prepare callback headers');
        return null;
      }

      console.log('✅ Callback headers prepared successfully');
      console.log('🆔 App UID:', headers['X-Restaurant-UID']);
      console.log('🌐 Website Restaurant ID:', headers['X-Website-Restaurant-ID']);

      return headers;

    } catch (error) {
      console.error('❌ Error preparing callback headers:', error);
      return null;
    }
  }

  /**
   * Make HTTP request with retry logic, exponential backoff, and order number format fallback
   */
  private async makeRequest(
    endpoint: string,
    payload: OrderStatusPayload,
    maxRetries: number = 3
  ): Promise<ApiResponse> {
    const idempotencyKey = this.generateIdempotencyKey();
    const url = `${GBC_API_BASE_URL}${endpoint}`;
    const { digits, hashForm } = this.canonicalizeOrderId(payload.order_number);

    // Check cached format preference for this host
    const hostKey = new URL(url).hostname;
    const cachedFormat = this.orderNumberFormatCache.get(hostKey);

    // Determine primary format to try first
    const primaryFormat = cachedFormat === 'digits' ? digits : hashForm;
    const fallbackFormat = cachedFormat === 'digits' ? hashForm : digits;

    console.log(`🔄 Making request to ${endpoint} for order ${digits} (trying ${primaryFormat} first)`);

    // Try primary format first
    const primaryResult = await this.attemptRequest(url, endpoint, payload, digits, primaryFormat, idempotencyKey, maxRetries);

    if (primaryResult.success) {
      // Cache successful format
      this.orderNumberFormatCache.set(hostKey, primaryFormat === hashForm ? 'hash' : 'digits');
      console.log(`✅ Success with ${primaryFormat === hashForm ? '#digits' : 'digits'} format for ${digits}`);
      return primaryResult;
    }

    // Check if it's a 404 "Order not found" error that warrants format fallback
    if (this.isOrderNotFoundError(primaryResult)) {
      console.log(`🔄 Trying fallback format ${fallbackFormat} for order ${digits}`);

      const fallbackResult = await this.attemptRequest(url, endpoint, payload, digits, fallbackFormat, idempotencyKey, 1);

      if (fallbackResult.success) {
        // Cache successful fallback format
        this.orderNumberFormatCache.set(hostKey, fallbackFormat === hashForm ? 'hash' : 'digits');
        console.log(`✅ Success with fallback ${fallbackFormat === hashForm ? '#digits' : 'digits'} format for ${digits}`);
        return fallbackResult;
      }
    }

    return primaryResult; // Return original error if fallback also failed
  }

  /**
   * Check if error indicates "Order not found" that warrants format retry
   */
  private isOrderNotFoundError(result: ApiResponse): boolean {
    return !result.success &&
           result.message.includes('404') &&
           result.message.toLowerCase().includes('order not found');
  }

  /**
   * Check if error indicates missing required fields for cancel requests
   */
  private isCancelFieldsError(result: ApiResponse): boolean {
    return !result.success &&
           result.message.includes('400') &&
           (result.message.toLowerCase().includes('missing required fields') ||
            result.message.toLowerCase().includes('order_number') ||
            result.message.toLowerCase().includes('cancelled_at'));
  }

  /**
   * Attempt a single request with specific order number format
   */
  private async attemptRequest(
    url: string,
    endpoint: string,
    originalPayload: OrderStatusPayload,
    digits: string,
    orderNumberFormat: string,
    idempotencyKey: string,
    maxRetries: number
  ): Promise<ApiResponse> {
    // Create payload with specific order number format
    const payload = {
      ...originalPayload,
      order_number: orderNumberFormat,
      order_number_digits: digits,
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const headers = await this.getHeaders(digits, idempotencyKey);
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log(`📡 Response status: ${response.status} for order ${orderNumberFormat} (attempt ${attempt})`);

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Success: ${endpoint} for order ${orderNumberFormat}`, JSON.stringify(data, null, 2));
          return {
            success: true,
            message: data.message || 'Request successful',
            data,
          };
        }

        // Handle 404 specifically for order not found
        if (response.status === 404) {
          let errorText = '';
          try {
            const errorData = await response.json();
            errorText = errorData.message || JSON.stringify(errorData);
            console.warn(`❌ 404 error (JSON):`, errorData);
          } catch {
            errorText = await response.text();
            console.warn(`❌ 404 error (text): ${errorText}`);
          }
          return {
            success: false,
            message: `Order not found: ${errorText}`,
          };
        }

        // Don't retry on other 4xx errors (except 408 Request Timeout and 429 Too Many Requests)
        if (response.status >= 400 && response.status < 500 &&
            response.status !== 408 && response.status !== 429) {
          let errorText = '';
          try {
            const errorData = await response.json();
            errorText = errorData.message || JSON.stringify(errorData);
            console.error(`❌ Client error ${response.status} (JSON):`, errorData);
          } catch {
            errorText = await response.text();
            console.error(`❌ Client error ${response.status} (text): ${errorText}`);
          }
          return {
            success: false,
            message: `Client error: ${response.status} - ${errorText}`,
          };
        }

        const errorText = await response.text();
        console.warn(`⚠️ Attempt ${attempt} failed: ${response.status} - ${errorText}`);

        if (attempt < maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        console.warn(`⚠️ Attempt ${attempt} error:`, error);

        if (attempt < maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      message: 'All retry attempts failed',
    };
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
    const jitter = Math.random() * 0.4 - 0.2; // ±20% jitter
    return Math.floor(baseDelay * (1 + jitter));
  }

  /**
   * Make HTTP request specifically for cancel orders with format fallback
   */
  private async makeCancelRequest(
    endpoint: string,
    payload: OrderStatusPayload,
    maxRetries: number = 3
  ): Promise<ApiResponse> {
    const idempotencyKey = this.generateIdempotencyKey();
    const url = `${GBC_API_BASE_URL}${endpoint}`;
    const { digits, hashForm } = this.canonicalizeOrderId(payload.order_number);

    // Check cached format preference for this host
    const hostKey = new URL(url).hostname;
    const cachedFormat = this.orderNumberFormatCache.get(hostKey);

    // Determine primary format to try first
    const primaryFormat = cachedFormat === 'digits' ? digits : hashForm;
    const fallbackFormat = cachedFormat === 'digits' ? hashForm : digits;

    console.log(`🔄 Making cancel request to ${endpoint} for order ${digits} (trying ${primaryFormat} first)`);

    // Try primary format first
    const primaryResult = await this.attemptCancelRequest(url, endpoint, payload, digits, primaryFormat, idempotencyKey, maxRetries);

    if (primaryResult.success) {
      // Cache successful format
      this.orderNumberFormatCache.set(hostKey, primaryFormat === hashForm ? 'hash' : 'digits');
      console.log(`✅ Cancel success with ${primaryFormat === hashForm ? '#digits' : 'digits'} format for ${digits}`);
      return primaryResult;
    }

    // Check if it's a 400 "Missing required fields" error that warrants format fallback
    if (this.isCancelFieldsError(primaryResult)) {
      console.log(`🔄 Trying fallback format ${fallbackFormat} for cancel order ${digits}`);

      const fallbackResult = await this.attemptCancelRequest(url, endpoint, payload, digits, fallbackFormat, idempotencyKey, 1);

      if (fallbackResult.success) {
        // Cache successful fallback format
        this.orderNumberFormatCache.set(hostKey, fallbackFormat === hashForm ? 'hash' : 'digits');
        console.log(`✅ Cancel success with fallback ${fallbackFormat === hashForm ? '#digits' : 'digits'} format for ${digits}`);
        return fallbackResult;
      }
    }

    return primaryResult; // Return original error if fallback also failed
  }

  /**
   * Attempt a single cancel request with specific order number format
   */
  private async attemptCancelRequest(
    url: string,
    endpoint: string,
    originalPayload: OrderStatusPayload,
    digits: string,
    orderNumberFormat: string,
    idempotencyKey: string,
    maxRetries: number
  ): Promise<ApiResponse> {
    // Create payload with specific order number format and ensure cancelled_at is present
    const payload = {
      ...originalPayload,
      order_number: orderNumberFormat,
      order_number_digits: digits,
      cancelled_at: originalPayload.cancelled_at || new Date().toISOString(), // Ensure cancelled_at is always present
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const headers = await this.getHeaders(digits, idempotencyKey);
        // Add optional client header for debugging
        headers['X-Client'] = 'GBC-Kitchen/3.1.1';

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log(`📡 Cancel response status: ${response.status} for order ${orderNumberFormat} (attempt ${attempt})`);

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Cancel success: ${endpoint} for order ${orderNumberFormat}`, data);
          return {
            success: true,
            message: data.message || 'Cancel request successful',
            data,
          };
        }

        // Handle 400 specifically for missing fields
        if (response.status === 400) {
          const errorText = await response.text();
          console.warn(`❌ 400 error on cancel: ${errorText}`);
          return {
            success: false,
            message: `Client error: 400 - ${errorText}`,
          };
        }

        // Don't retry on other 4xx errors (except 408 Request Timeout and 429 Too Many Requests)
        if (response.status >= 400 && response.status < 500 &&
            response.status !== 408 && response.status !== 429) {
          const errorText = await response.text();
          console.error(`❌ Client error ${response.status}: ${errorText}`);
          return {
            success: false,
            message: `Client error: ${response.status} - ${errorText}`,
          };
        }

        const errorText = await response.text();
        console.warn(`⚠️ Cancel attempt ${attempt} failed: ${response.status} - ${errorText}`);

        if (attempt < maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        console.warn(`⚠️ Cancel attempt ${attempt} error:`, error);

        if (attempt < maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      message: 'All cancel retry attempts failed',
    };
  }

  /**
   * Update order status (approved, preparing, ready)
   */
  async updateOrderStatus(
    orderNumber: string,
    status: 'approved' | 'preparing' | 'ready',
    notes?: string
  ): Promise<ApiResponse> {
    const { digits, hashForm } = this.canonicalizeOrderId(orderNumber);

    const payload: OrderStatusPayload = {
      order_number: hashForm, // Primary field with # prefix
      order_number_digits: digits, // Companion field for server normalization
      status,
      timestamp: new Date().toISOString(),
      updated_by: 'kitchen_app',
      notes: notes || `Status updated to ${status} via kitchen app`,
    };

    console.log(`🔄 Updating order status: ${digits} → ${status} (using format: ${hashForm})`);

    if (!this.isOnline) {
      return this.queueRequest('/api/order-status-update', payload);
    }

    const result = await this.makeRequest('/api/order-status-update', payload);

    if (result.success) {
      // Update local Supabase database using digits format
      await this.updateLocalDatabase(digits, status);
    }

    return result;
  }

  /**
   * Dispatch order
   */
  async dispatchOrder(
    orderNumber: string,
    notes?: string
  ): Promise<ApiResponse> {
    const { digits, hashForm } = this.canonicalizeOrderId(orderNumber);

    const payload: OrderStatusPayload = {
      order_number: hashForm, // Primary field with # prefix
      order_number_digits: digits, // Companion field for server normalization
      status: 'dispatched',
      timestamp: new Date().toISOString(),
      dispatched_by: 'kitchen_app',
      notes: notes || `Order dispatched via kitchen app`,
    };

    console.log(`🚀 Dispatching order: ${digits} (using format: ${hashForm})`);

    if (!this.isOnline) {
      return this.queueRequest('/api/order-dispatch', payload);
    }

    const result = await this.makeRequest('/api/order-dispatch', payload);

    if (result.success) {
      // Update local Supabase database using digits format
      await this.updateLocalDatabase(digits, 'dispatched');
    }

    return result;
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    orderNumber: string,
    cancelReason?: string
  ): Promise<ApiResponse> {
    const { digits, hashForm } = this.canonicalizeOrderId(orderNumber);
    const cancelledAtTimestamp = new Date().toISOString();

    const payload: OrderStatusPayload = {
      order_number: hashForm, // Primary field with # prefix (required by website)
      order_number_digits: digits, // Companion field for server normalization
      status: 'cancelled', // Double "l" as required
      timestamp: cancelledAtTimestamp, // Keep for backward compatibility
      cancelled_at: cancelledAtTimestamp, // Required by website API
      cancelled_by: 'kitchen_app',
      cancel_reason: cancelReason || '', // Empty string if no reason provided
      notes: `Order cancelled: ${cancelReason || 'No reason provided'}`,
    };

    console.log(`❌ Cancelling order: ${digits} (using format: ${hashForm}) with cancelled_at: ${cancelledAtTimestamp}`);

    if (!this.isOnline) {
      return this.queueRequest('/api/order-cancel', payload);
    }

    const result = await this.makeCancelRequest('/api/order-cancel', payload);

    if (result.success) {
      // Update local Supabase database using digits format
      await this.updateLocalDatabase(digits, 'cancelled');
    }

    return result;
  }

  /**
   * Queue request for offline processing
   */
  private async queueRequest(endpoint: string, payload: OrderStatusPayload): Promise<ApiResponse> {
    const queuedRequest: QueuedRequest = {
      id: this.generateIdempotencyKey(),
      endpoint,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    this.offlineQueue.push(queuedRequest);
    await this.saveOfflineQueue();

    console.log(`📥 Queued request for offline processing: ${payload.order_number} → ${payload.status}`);

    return {
      success: true,
      message: 'Request queued for offline processing',
    };
  }

  /**
   * Process offline queue when connectivity is restored
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    console.log(`📤 Processing ${this.offlineQueue.length} queued requests...`);

    const queueCopy = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const request of queueCopy) {
      try {
        const result = await this.makeRequest(request.endpoint, request.payload, 2);
        
        if (result.success) {
          console.log(`✅ Processed queued request: ${request.payload.order_number}`);
          // Update local database
          await this.updateLocalDatabase(request.payload.order_number, request.payload.status);
        } else {
          console.error(`❌ Failed to process queued request: ${request.payload.order_number}`);
          // Re-queue if not a client error
          if (!result.message.includes('Client error')) {
            this.offlineQueue.push(request);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing queued request:`, error);
        this.offlineQueue.push(request);
      }
    }

    await this.saveOfflineQueue();
  }

  /**
   * Update local Supabase database
   */
  private async updateLocalDatabase(orderNumber: string, status: string): Promise<void> {
    try {
      // Get current restaurant UID for restaurant-scoped updates
      const restaurantUID = await this.getRestaurantUID();

      const { error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'dispatched' && { dispatched_at: new Date().toISOString() }),
        })
        .eq('orderNumber', orderNumber)
        .eq('restaurant_uid', restaurantUID); // Add restaurant-scoped filtering

      if (error) {
        console.warn(`⚠️ Failed to update local database for order ${orderNumber}:`, error);
      } else {
        console.log(`✅ Updated local database: ${orderNumber} → ${status} (restaurant: ${restaurantUID})`);
      }
    } catch (error) {
      console.warn(`⚠️ Local database update error:`, error);
    }
  }

  /**
   * Setup network connectivity listener
   */
  private setupNetworkListener(): void {
    // Note: In a real React Native app, you would use @react-native-netinfo/netinfo
    // For now, we'll assume online status and manually trigger offline queue processing
    this.isOnline = true;
  }

  /**
   * Manually trigger offline queue processing (for testing)
   */
  async flushOfflineQueue(): Promise<void> {
    this.isOnline = true;
    await this.processOfflineQueue();
  }

  /**
   * Save offline queue to AsyncStorage
   */
  private async saveOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('gbc_offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Load offline queue from AsyncStorage
   */
  private async loadOfflineQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('gbc_offline_queue');
      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
        console.log(`📥 Loaded ${this.offlineQueue.length} queued requests from storage`);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Get current offline queue status
   */
  getQueueStatus(): { queueLength: number; isOnline: boolean } {
    return {
      queueLength: this.offlineQueue.length,
      isOnline: this.isOnline,
    };
  }
}

// Export singleton instance
export const gbcOrderStatusAPI = new GBCOrderStatusAPI();
export default gbcOrderStatusAPI;
