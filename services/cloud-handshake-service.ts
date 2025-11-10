import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabaseAuth } from './supabase-auth';

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

export interface CloudHandshakeRequest {
  website_restaurant_id: string;
  callback_url: string;
  request_timestamp: string;
  requester_ip?: string;
  requester_user_agent?: string;
}

export interface RestaurantRegistration {
  id: string;
  user_id: string;
  restaurant_uid: string;
  device_label: string;
  app_version: string;
  platform: string;
  capabilities: string[];
  device_info: any;
  network_info: any;
  last_seen: string;
  is_online: boolean;
  created_at: string;
  updated_at: string;
}

export interface HandshakeResponse {
  restaurant_uid: string;
  device_label: string;
  app_version: string;
  platform: string;
  capabilities: string[];
  response_timestamp: string;
}

class CloudHandshakeService {
  private supabase: SupabaseClient;
  private readonly APP_VERSION = '3.0.0';
  private readonly CAPABILITIES = [
    'real_time_notifications',
    'thermal_printing',
    'order_status_updates',
    'multi_tenant_support',
    'offline_queue',
    'cloud_handshake',
    'auto_registration'
  ];
  private handshakeSubscription: any = null;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  /**
   * Auto-register restaurant when user logs in
   * This replaces the need for manual IP configuration
   */
  async autoRegisterRestaurant(): Promise<{ success: boolean; restaurant_uid?: string; error?: string }> {
    try {
      console.log('🏪 Auto-registering restaurant with cloud service...');

      const restaurantUser = supabaseAuth.getCurrentRestaurantUser();
      if (!restaurantUser) {
        return { success: false, error: 'Restaurant not authenticated' };
      }

      // Generate or get existing restaurant UID
      const restaurantUID = await this.getOrCreateRestaurantUID();
      
      // Get device information
      const deviceInfo = await this.getDeviceInfo();
      const deviceLabel = await this.getDeviceLabel();

      // Get current user
      const currentUser = supabaseAuth.getCurrentRestaurantUser();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Check if registration already exists
      const { data: existingRegistration } = await this.supabase
        .from('restaurant_registrations')
        .select('*')
        .eq('user_id', currentUser.app_restaurant_uid)
        .eq('restaurant_uid', restaurantUID)
        .single();

      if (existingRegistration) {
        // Update existing registration
        const { error: updateError } = await this.supabase
          .from('restaurant_registrations')
          .update({
            device_label: deviceLabel,
            app_version: this.APP_VERSION,
            platform: Platform.OS,
            capabilities: this.CAPABILITIES,
            device_info: deviceInfo,
            last_seen: new Date().toISOString(),
            is_online: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRegistration.id);

        if (updateError) {
          console.error('❌ Error updating restaurant registration:', updateError);
          return { success: false, error: updateError.message };
        }

        console.log('✅ Restaurant registration updated successfully');
        return { success: true, restaurant_uid: restaurantUID };
      } else {
        // Create new registration
        const { data: newRegistration, error: insertError } = await this.supabase
          .from('restaurant_registrations')
          .insert({
            user_id: currentUser.app_restaurant_uid,
            restaurant_uid: restaurantUID,
            device_label: deviceLabel,
            app_version: this.APP_VERSION,
            platform: Platform.OS,
            capabilities: this.CAPABILITIES,
            device_info: deviceInfo,
            network_info: {},
            last_seen: new Date().toISOString(),
            is_online: true
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creating restaurant registration:', insertError);
          return { success: false, error: insertError.message };
        }

        console.log('✅ Restaurant registered successfully with cloud service');
        return { success: true, restaurant_uid: restaurantUID };
      }
    } catch (error) {
      console.error('❌ Error in auto-register restaurant:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Start listening for handshake requests via Supabase Realtime
   * This replaces the local HTTP endpoint
   */
  async startHandshakeListener(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('👂 Starting cloud handshake listener...');

      const restaurantUser = supabaseAuth.getCurrentRestaurantUser();
      if (!restaurantUser) {
        return { success: false, error: 'Restaurant not authenticated' };
      }

      const restaurantUID = await this.getOrCreateRestaurantUID();

      // Subscribe to handshake requests for this restaurant
      this.handshakeSubscription = this.supabase
        .channel('handshake_requests')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'handshake_requests',
            filter: `status=eq.pending`
          },
          async (payload) => {
            console.log('🤝 Received handshake request:', payload.new);
            await this.processCloudHandshakeRequest(payload.new as any);
          }
        )
        .subscribe();

      console.log('✅ Cloud handshake listener started successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error starting handshake listener:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Stop handshake listener
   */
  async stopHandshakeListener(): Promise<void> {
    if (this.handshakeSubscription) {
      await this.supabase.removeChannel(this.handshakeSubscription);
      this.handshakeSubscription = null;
      console.log('🛑 Cloud handshake listener stopped');
    }
  }

  /**
   * Process incoming handshake request from cloud
   */
  private async processCloudHandshakeRequest(request: any): Promise<void> {
    try {
      console.log('🔄 Processing cloud handshake request...');

      const restaurantUser = supabaseAuth.getCurrentRestaurantUser();
      if (!restaurantUser) {
        console.error('❌ Restaurant not authenticated, cannot process handshake');
        return;
      }

      const restaurantUID = await this.getOrCreateRestaurantUID();

      // Check if this request is for our restaurant (if target_restaurant_uid is specified)
      if (request.target_restaurant_uid && request.target_restaurant_uid !== restaurantUID) {
        console.log('ℹ️ Handshake request not for this restaurant, ignoring');
        return;
      }

      // Update request status to processing
      await this.supabase
        .from('handshake_requests')
        .update({ 
          status: 'processing',
          target_restaurant_uid: restaurantUID,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      // Create handshake response
      const deviceLabel = await this.getDeviceLabel();
      const response: HandshakeResponse = {
        restaurant_uid: restaurantUID,
        device_label: deviceLabel,
        app_version: this.APP_VERSION,
        platform: Platform.OS,
        capabilities: this.CAPABILITIES,
        response_timestamp: new Date().toISOString()
      };

      // Insert handshake response
      const { error: responseError } = await this.supabase
        .from('handshake_responses')
        .insert({
          handshake_request_id: request.id,
          restaurant_uid: restaurantUID,
          device_label: deviceLabel,
          app_version: this.APP_VERSION,
          platform: Platform.OS,
          capabilities: this.CAPABILITIES,
          response_timestamp: new Date().toISOString()
        });

      if (responseError) {
        console.error('❌ Error creating handshake response:', responseError);
        
        // Update request status to failed
        await this.supabase
          .from('handshake_requests')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', request.id);
        return;
      }

      // Create or update website restaurant mapping
      await this.createWebsiteRestaurantMapping(
        request.website_restaurant_id,
        restaurantUID,
        request.callback_url,
        request.id
      );

      // Update request status to completed
      await this.supabase
        .from('handshake_requests')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      // Update restaurant last_seen
      await this.updateRestaurantLastSeen(restaurantUID);

      console.log('✅ Cloud handshake request processed successfully');
    } catch (error) {
      console.error('❌ Error processing cloud handshake request:', error);
      
      // Update request status to failed
      if (request.id) {
        await this.supabase
          .from('handshake_requests')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', request.id);
      }
    }
  }

  /**
   * Create or update website restaurant mapping
   */
  private async createWebsiteRestaurantMapping(
    websiteRestaurantId: string,
    appRestaurantUID: string,
    callbackUrl: string,
    handshakeRequestId: string
  ): Promise<void> {
    try {
      // Check if mapping already exists
      const { data: existingMapping } = await this.supabase
        .from('website_restaurant_mappings')
        .select('*')
        .eq('website_restaurant_id', websiteRestaurantId)
        .eq('app_restaurant_uid', appRestaurantUID)
        .single();

      if (existingMapping) {
        // Update existing mapping
        await this.supabase
          .from('website_restaurant_mappings')
          .update({
            callback_url: callbackUrl,
            handshake_request_id: handshakeRequestId,
            is_active: true,
            last_handshake: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMapping.id);
      } else {
        // Create new mapping
        await this.supabase
          .from('website_restaurant_mappings')
          .insert({
            website_restaurant_id: websiteRestaurantId,
            app_restaurant_uid: appRestaurantUID,
            website_domain: this.extractDomainFromUrl(callbackUrl),
            callback_url: callbackUrl,
            handshake_request_id: handshakeRequestId,
            is_active: true,
            last_handshake: new Date().toISOString()
          });
      }

      console.log('✅ Website restaurant mapping created/updated');
    } catch (error) {
      console.error('❌ Error creating website restaurant mapping:', error);
    }
  }

  /**
   * Get or create restaurant UID
   */
  private async getOrCreateRestaurantUID(): Promise<string> {
    try {
      // Try to get existing UID from AsyncStorage
      let restaurantUID = await AsyncStorage.getItem('app_restaurant_uid');
      
      if (!restaurantUID) {
        // Generate new UID using restaurant user ID as base
        const restaurantUser = supabaseAuth.getCurrentRestaurantUser();
        if (restaurantUser) {
          restaurantUID = restaurantUser.app_restaurant_uid; // Use restaurant UID
        } else {
          // Fallback: generate random UUID
          restaurantUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
        
        // Store in AsyncStorage
        await AsyncStorage.setItem('app_restaurant_uid', restaurantUID);
        console.log('✅ Generated new restaurant UID:', restaurantUID);
      }
      
      return restaurantUID;
    } catch (error) {
      console.error('❌ Error getting/creating restaurant UID:', error);
      throw error;
    }
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<any> {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      app_version: this.APP_VERSION,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get device label
   */
  private async getDeviceLabel(): Promise<string> {
    try {
      let deviceLabel = await AsyncStorage.getItem('device_label');
      if (!deviceLabel) {
        const restaurantUser = supabaseAuth.getCurrentRestaurantUser();
        const username = restaurantUser?.username || restaurantUser?.restaurant_name || 'Unknown';
        deviceLabel = `${username}'s Kitchen - ${new Date().toISOString().split('T')[0]}`;
        await AsyncStorage.setItem('device_label', deviceLabel);
      }
      return deviceLabel;
    } catch (error) {
      console.error('❌ Error getting device label:', error);
      return `Kitchen Device - ${new Date().toISOString().split('T')[0]}`;
    }
  }

  /**
   * Update restaurant last seen timestamp
   */
  private async updateRestaurantLastSeen(restaurantUID: string): Promise<void> {
    try {
      await this.supabase.rpc('update_restaurant_last_seen', {
        restaurant_uid_param: restaurantUID
      });
    } catch (error) {
      console.error('❌ Error updating restaurant last seen:', error);
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomainFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Mark restaurant as offline
   */
  async markRestaurantOffline(): Promise<void> {
    try {
      const restaurantUID = await this.getOrCreateRestaurantUID();
      await this.supabase.rpc('mark_restaurant_offline', {
        restaurant_uid_param: restaurantUID
      });
      console.log('📴 Restaurant marked as offline');
    } catch (error) {
      console.error('❌ Error marking restaurant offline:', error);
    }
  }

  /**
   * Get restaurant registration status
   */
  async getRegistrationStatus(): Promise<{ registered: boolean; online: boolean; registration?: RestaurantRegistration }> {
    try {
      const restaurantUser = supabaseAuth.getCurrentRestaurantUser();
      if (!restaurantUser) {
        return { registered: false, online: false };
      }

      const restaurantUID = await this.getOrCreateRestaurantUID();

      const { data: registration } = await this.supabase
        .from('restaurant_registrations')
        .select('*')
        .eq('user_id', restaurantUser.app_restaurant_uid)
        .eq('restaurant_uid', restaurantUID)
        .single();

      if (registration) {
        return {
          registered: true,
          online: registration.is_online,
          registration: registration as RestaurantRegistration
        };
      }

      return { registered: false, online: false };
    } catch (error) {
      console.error('❌ Error getting registration status:', error);
      return { registered: false, online: false };
    }
  }
}

export const cloudHandshakeService = new CloudHandshakeService();
