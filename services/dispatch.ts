import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export interface DispatchPayload {
  order_id: string;
  status: 'dispatched';
  timestamp: string;
  dispatched_by?: string;
  app_version?: string;
  notes?: string;
}

export interface DispatchResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface DispatchConfig {
  websiteEndpoint: string;
  timeout?: number;
  retryAttempts?: number;
}

class DispatchService {
  private defaultConfig: DispatchConfig = {
    websiteEndpoint: 'https://hotel-website.com/api/order-dispatch',
    timeout: 10000, // 10 seconds
    retryAttempts: 3
  };

  /**
   * Dispatch an order to the website endpoint
   */
  async dispatchOrder(
    orderId: string, 
    config?: Partial<DispatchConfig>
  ): Promise<DispatchResponse> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    console.log('🚀 Starting order dispatch process:', {
      orderId,
      endpoint: finalConfig.websiteEndpoint
    });

    try {
      // Validate order exists and is eligible for dispatch
      const orderValidation = await this.validateOrderForDispatch(orderId);
      if (!orderValidation.valid) {
        return {
          success: false,
          message: orderValidation.reason || 'Order validation failed'
        };
      }

      // Prepare dispatch payload
      const payload: DispatchPayload = {
        order_id: orderId,
        status: 'dispatched',
        timestamp: new Date().toISOString(),
        dispatched_by: 'kitchen_app',
        app_version: '3.1.1'
      };

      console.log('📦 Dispatch payload prepared:', payload);

      // Send dispatch request with retry logic
      const response = await this.sendDispatchRequest(finalConfig.websiteEndpoint, payload, finalConfig);

      if (response.success) {
        // Update order status in Supabase
        await this.updateOrderStatusInSupabase(orderId);
        
        console.log('✅ Order dispatch completed successfully');
        return {
          success: true,
          message: 'Order dispatched successfully',
          data: response.data
        };
      } else {
        console.error('❌ Dispatch failed:', response.message);
        return response;
      }

    } catch (error) {
      console.error('❌ Dispatch service error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown dispatch error'
      };
    }
  }

  /**
   * Validate if order can be dispatched
   */
  private async validateOrderForDispatch(orderId: string): Promise<{ valid: boolean; reason?: string }> {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('id, status, dispatched_at')
        .eq('id', orderId)
        .single();

      if (error || !order) {
        return { valid: false, reason: 'Order not found' };
      }

      if (order.status === 'dispatched') {
        return { valid: false, reason: 'Order already dispatched' };
      }

      if (order.status === 'cancelled') {
        return { valid: false, reason: 'Cannot dispatch cancelled order' };
      }

      if (order.status !== 'completed' && order.status !== 'active') {
        return { valid: false, reason: 'Order must be completed before dispatch' };
      }

      return { valid: true };

    } catch (error) {
      console.error('❌ Order validation error:', error);
      return { valid: false, reason: 'Validation error occurred' };
    }
  }

  /**
   * Send dispatch request to website endpoint with retry logic
   */
  private async sendDispatchRequest(
    endpoint: string, 
    payload: DispatchPayload, 
    config: DispatchConfig
  ): Promise<DispatchResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= (config.retryAttempts || 3); attempt++) {
      try {
        console.log(`📡 Dispatch attempt ${attempt}/${config.retryAttempts} to ${endpoint}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout || 10000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Accept': 'application/json',
            'User-Agent': 'GBC-Kitchen-App/3.1.1',
            'X-Dispatch-Attempt': attempt.toString()
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log(`📊 Response status: ${response.status}`);

        if (response.ok) {
          const responseData = await response.json();
          console.log('✅ Dispatch successful:', responseData);
          
          return {
            success: true,
            message: responseData.message || 'Dispatch successful',
            data: responseData
          };
        } else {
          const errorText = await response.text();
          const errorMessage = `HTTP ${response.status}: ${errorText}`;
          console.warn(`⚠️ Attempt ${attempt} failed:`, errorMessage);
          
          // Don't retry for client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            return {
              success: false,
              message: errorMessage
            };
          }
          
          lastError = new Error(errorMessage);
        }

      } catch (error) {
        console.warn(`⚠️ Attempt ${attempt} error:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Wait before retry (exponential backoff)
        if (attempt < (config.retryAttempts || 3)) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      message: lastError?.message || 'All dispatch attempts failed'
    };
  }

  /**
   * Update order status in Supabase after successful dispatch
   */
  private async updateOrderStatusInSupabase(orderId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'dispatched',
          dispatched_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.warn('⚠️ Failed to update Supabase order status:', error);
        // Don't throw error - dispatch was successful, this is just a local update
      } else {
        console.log('✅ Order status updated in Supabase');
      }

    } catch (error) {
      console.warn('⚠️ Supabase update error:', error);
      // Don't throw error - dispatch was successful
    }
  }

  /**
   * Get dispatch configuration for different environments
   */
  getDispatchConfig(environment: 'development' | 'staging' | 'production'): DispatchConfig {
    const configs = {
      development: {
        websiteEndpoint: 'https://dev-hotel-website.com/api/order-dispatch',
        timeout: 15000,
        retryAttempts: 2
      },
      staging: {
        websiteEndpoint: 'https://staging-hotel-website.com/api/order-dispatch',
        timeout: 12000,
        retryAttempts: 3
      },
      production: {
        websiteEndpoint: 'https://hotel-website.com/api/order-dispatch',
        timeout: 10000,
        retryAttempts: 3
      }
    };

    return configs[environment] || this.defaultConfig;
  }

  /**
   * Test dispatch endpoint connectivity
   */
  async testDispatchEndpoint(endpoint: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(endpoint, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://gbc-kitchen-app.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });

      const responseTime = Date.now() - startTime;

      return {
        success: response.ok,
        message: response.ok ? 'Endpoint accessible' : `HTTP ${response.status}`,
        responseTime
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        responseTime: Date.now() - startTime
      };
    }
  }
}

export const dispatchService = new DispatchService();
export default dispatchService;
