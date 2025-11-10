import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export interface StatusUpdatePayload {
  order_id: string;
  status: 'approved' | 'preparing' | 'ready' | 'dispatched';
  timestamp: string;
  updated_by?: string;
  app_version?: string;
  notes?: string;
  previous_status?: string;
}

export interface StatusUpdateResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface StatusUpdateConfig {
  websiteEndpoint: string;
  timeout?: number;
  retryAttempts?: number;
}

class StatusUpdateService {
  private defaultConfig: StatusUpdateConfig = {
    websiteEndpoint: 'https://hotel-website.com/api/order-status-update',
    timeout: 10000, // 10 seconds
    retryAttempts: 3
  };

  /**
   * Send status update to website endpoint
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: 'approved' | 'preparing' | 'ready',
    config?: Partial<StatusUpdateConfig>
  ): Promise<StatusUpdateResponse> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    console.log('🔄 Starting order status update process:', {
      orderId,
      newStatus,
      endpoint: finalConfig.websiteEndpoint
    });

    try {
      // Get current order details from Supabase
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError || !order) {
        console.error('❌ Order not found in Supabase:', fetchError);
        return {
          success: false,
          message: 'Order not found'
        };
      }

      console.log('📋 Current order status:', order.status, '→', newStatus);

      // Prepare status update payload
      const payload: StatusUpdatePayload = {
        order_id: orderId,
        status: newStatus,
        timestamp: new Date().toISOString(),
        updated_by: 'kitchen_app',
        app_version: '3.1.1',
        previous_status: order.status,
        notes: `Status updated from ${order.status} to ${newStatus} via kitchen app`
      };

      console.log('📦 Status update payload prepared:', payload);

      // Send status update request with retry logic
      const response = await this.sendStatusUpdateRequest(finalConfig.websiteEndpoint, payload, finalConfig);

      if (response.success) {
        // Update order status in Supabase
        await this.updateOrderStatusInSupabase(orderId, newStatus);
        
        console.log('✅ Order status update completed successfully');
        return {
          success: true,
          message: `Order status updated to ${newStatus} successfully`,
          data: response.data
        };
      } else {
        console.error('❌ Status update failed:', response.message);
        return response;
      }

    } catch (error) {
      console.error('❌ Status update service error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown status update error'
      };
    }
  }

  /**
   * Send status update request with retry logic
   */
  private async sendStatusUpdateRequest(
    endpoint: string,
    payload: StatusUpdatePayload,
    config: StatusUpdateConfig
  ): Promise<StatusUpdateResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= (config.retryAttempts || 3); attempt++) {
      try {
        console.log(`📡 Status update attempt ${attempt}/${config.retryAttempts} to ${endpoint}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout || 10000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Accept': 'application/json',
            'User-Agent': 'GBC-Kitchen-App/3.1.1',
            'X-Status-Update-Attempt': attempt.toString(),
            'X-Update-Type': 'status-change'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log(`📡 Website response status: ${response.status}`);

        if (response.ok) {
          const responseData = await response.json();
          console.log('✅ Status update successful:', responseData);
          
          return {
            success: true,
            message: responseData.message || 'Status updated successfully',
            data: responseData
          };
        } else {
          const errorText = await response.text();
          console.error(`❌ Status update failed (${response.status}):`, errorText);
          
          // Don't retry for client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            return {
              success: false,
              message: `Client error: ${response.status} - ${errorText}`
            };
          }
          
          lastError = new Error(`HTTP ${response.status}: ${errorText}`);
        }

      } catch (error) {
        console.error(`❌ Status update attempt ${attempt} failed:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Wait before retry (exponential backoff)
        if (attempt < (config.retryAttempts || 3)) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      message: lastError?.message || 'All status update attempts failed'
    };
  }

  /**
   * Update order status in Supabase
   */
  private async updateOrderStatusInSupabase(orderId: string, newStatus: string): Promise<void> {
    try {
      console.log('🔄 Updating order status in Supabase:', orderId, '→', newStatus);

      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('❌ Failed to update order status in Supabase:', error);
        throw error;
      }

      console.log('✅ Order status updated in Supabase successfully');
    } catch (error) {
      console.error('❌ Supabase update error:', error);
      throw error;
    }
  }

  /**
   * Get status update configuration for different environments
   */
  getStatusUpdateConfig(environment: 'development' | 'staging' | 'production'): StatusUpdateConfig {
    const configs = {
      development: {
        websiteEndpoint: 'https://dev-hotel-website.com/api/order-status-update',
        timeout: 15000,
        retryAttempts: 2
      },
      staging: {
        websiteEndpoint: 'https://staging-hotel-website.com/api/order-status-update',
        timeout: 12000,
        retryAttempts: 3
      },
      production: {
        websiteEndpoint: 'https://hotel-website.com/api/order-status-update',
        timeout: 10000,
        retryAttempts: 3
      }
    };

    return configs[environment] || this.defaultConfig;
  }

  /**
   * Test status update endpoint connectivity
   */
  async testStatusUpdateEndpoint(endpoint: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
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

// Export singleton instance
export const statusUpdateService = new StatusUpdateService();
export default statusUpdateService;
