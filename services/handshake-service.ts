import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabaseAuth } from './supabase-auth';

export interface HandshakeRequest {
  website_restaurant_id: string;
  callback_url: string;
  timestamp: string;
}

export interface HandshakeResponse {
  app_restaurant_uid: string;
  device_label: string;
  app_version: string;
  platform: string;
  capabilities: string[];
  handshake_timestamp: string;
}

export interface HandshakeResult {
  success: boolean;
  data?: HandshakeResponse;
  error?: string;
}

class HandshakeService {
  private readonly APP_VERSION = '3.0.0';
  private readonly CAPABILITIES = [
    'real_time_notifications',
    'thermal_printing', 
    'order_status_updates',
    'multi_tenant_support',
    'offline_queue'
  ];

  /**
   * Process handshake request from website
   * Returns app UID and metadata, does NOT store website data
   */
  async processHandshake(request: HandshakeRequest): Promise<HandshakeResult> {
    try {
      console.log('🤝 Processing handshake request from website');
      console.log('📋 Website Restaurant ID:', request.website_restaurant_id);
      console.log('🔗 Callback URL:', request.callback_url);

      // Validate request
      const validation = this.validateHandshakeRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Get app restaurant UID (from existing AsyncStorage)
      const appRestaurantUID = await this.getAppRestaurantUID();
      if (!appRestaurantUID) {
        return {
          success: false,
          error: 'App restaurant UID not found. Please ensure user is logged in.'
        };
      }

      // Get device information
      const deviceLabel = await this.getDeviceLabel();

      // Create handshake response
      const response: HandshakeResponse = {
        app_restaurant_uid: appRestaurantUID,
        device_label: deviceLabel,
        app_version: this.APP_VERSION,
        platform: Platform.OS,
        capabilities: this.CAPABILITIES,
        handshake_timestamp: new Date().toISOString()
      };

      // Log handshake completion (for security monitoring)
      await this.logHandshakeAttempt(request, response, true);

      console.log('✅ Handshake completed successfully');
      console.log('🆔 App Restaurant UID:', appRestaurantUID);
      console.log('📱 Device Label:', deviceLabel);

      return {
        success: true,
        data: response
      };

    } catch (error) {
      console.error('❌ Handshake processing error:', error);
      
      // Log failed handshake attempt
      await this.logHandshakeAttempt(request, null, false, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown handshake error'
      };
    }
  }

  /**
   * Validate incoming handshake request
   */
  private validateHandshakeRequest(request: HandshakeRequest): { valid: boolean; error?: string } {
    if (!request.website_restaurant_id || request.website_restaurant_id.trim() === '') {
      return { valid: false, error: 'Missing website_restaurant_id' };
    }

    if (!request.callback_url || request.callback_url.trim() === '') {
      return { valid: false, error: 'Missing callback_url' };
    }

    if (!request.timestamp || request.timestamp.trim() === '') {
      return { valid: false, error: 'Missing timestamp' };
    }

    // Validate callback URL format
    try {
      new URL(request.callback_url);
    } catch {
      return { valid: false, error: 'Invalid callback_url format' };
    }

    // Validate timestamp (should be recent)
    try {
      const requestTime = new Date(request.timestamp);
      const now = new Date();
      const diffMinutes = (now.getTime() - requestTime.getTime()) / (1000 * 60);
      
      if (diffMinutes > 10) {
        return { valid: false, error: 'Request timestamp too old (>10 minutes)' };
      }
      
      if (diffMinutes < -5) {
        return { valid: false, error: 'Request timestamp too far in future (>5 minutes)' };
      }
    } catch {
      return { valid: false, error: 'Invalid timestamp format' };
    }

    return { valid: true };
  }

  /**
   * Get app restaurant UID from existing AsyncStorage
   * Uses same logic as gbc-order-status-api.ts
   */
  private async getAppRestaurantUID(): Promise<string | null> {
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
        return currentUser?.app_restaurant_uid || null;
      }

      return null;
    } catch (error) {
      console.warn('⚠️ Could not get restaurant UID:', error);
      return null;
    }
  }

  /**
   * Get device label for identification
   */
  private async getDeviceLabel(): Promise<string> {
    try {
      // Try to get custom device label from storage
      const customLabel = await AsyncStorage.getItem('device_label');
      if (customLabel) {
        return customLabel;
      }

      // Generate default device label
      const platform = Platform.OS === 'ios' ? 'iPad' : 'Tablet';
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      return `Kitchen ${platform} - ${timestamp}`;
    } catch (error) {
      console.warn('⚠️ Could not get device label:', error);
      return `Kitchen ${Platform.OS} - Unknown`;
    }
  }

  /**
   * Log handshake attempt for security monitoring
   * Stores in AsyncStorage for debugging (does NOT store website data permanently)
   */
  private async logHandshakeAttempt(
    request: HandshakeRequest,
    response: HandshakeResponse | null,
    success: boolean,
    error?: any
  ): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        success,
        app_restaurant_uid: response?.app_restaurant_uid || 'unknown',
        website_restaurant_id: request.website_restaurant_id, // Logged but not stored permanently
        callback_url: request.callback_url, // Logged but not stored permanently
        platform: Platform.OS,
        app_version: this.APP_VERSION,
        error: error ? (error instanceof Error ? error.message : String(error)) : null
      };

      // Get existing logs (keep only last 10 for debugging)
      const existingLogs = await AsyncStorage.getItem('handshake_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      logs.unshift(logEntry);
      
      // Keep only last 10 logs to prevent storage bloat
      const trimmedLogs = logs.slice(0, 10);
      
      await AsyncStorage.setItem('handshake_logs', JSON.stringify(trimmedLogs));
      
      console.log('📝 Handshake attempt logged');
    } catch (error) {
      console.warn('⚠️ Could not log handshake attempt:', error);
    }
  }

  /**
   * Get handshake logs for debugging (admin only)
   */
  async getHandshakeLogs(): Promise<any[]> {
    try {
      const logs = await AsyncStorage.getItem('handshake_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.warn('⚠️ Could not get handshake logs:', error);
      return [];
    }
  }

  /**
   * Clear handshake logs
   */
  async clearHandshakeLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem('handshake_logs');
      console.log('🧹 Handshake logs cleared');
    } catch (error) {
      console.warn('⚠️ Could not clear handshake logs:', error);
    }
  }

  /**
   * Set custom device label
   */
  async setDeviceLabel(label: string): Promise<void> {
    try {
      await AsyncStorage.setItem('device_label', label.trim());
      console.log('📱 Device label updated:', label);
    } catch (error) {
      console.warn('⚠️ Could not set device label:', error);
    }
  }
}

export const handshakeService = new HandshakeService();
