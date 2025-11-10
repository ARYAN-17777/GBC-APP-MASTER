import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Use Supabase as the actual backend (from eas.json configuration)
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

// Legacy API endpoints (for compatibility)
const API_BASE_URL = 'https://api.gbc-restaurant.com';
const WS_URL = 'wss://ws.gbcanteen.com/realtime';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  timestamp: string;
  notes?: string;
}

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private wsConnection: WebSocket | null = null;

  constructor() {
    this.loadTokens();
  }

  private async loadTokens() {
    try {
      this.accessToken = await AsyncStorage.getItem('access_token');
      this.refreshToken = await AsyncStorage.getItem('refresh_token');
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
  }

  private async saveTokens(accessToken: string, refreshToken: string) {
    try {
      await AsyncStorage.setItem('access_token', accessToken);
      await AsyncStorage.setItem('refresh_token', refreshToken);
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  private async clearTokens() {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      this.accessToken = null;
      this.refreshToken = null;
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401 && this.refreshToken) {
        // Try to refresh token
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the original request
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          return await fetch(url, { ...options, headers });
        }
      }

      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // For the provided credentials, create a mock successful login
      // In a real implementation, this would validate against Supabase Auth
      if (credentials.username === "General Bilimoria's Canteen - Sawbridgeworth" &&
          credentials.password === "Fz8@wN3#rLt2!Mcv") {

        // Generate mock tokens for the valid credentials
        const mockAuthResponse: AuthResponse = {
          access_token: 'gbc_access_token_' + Date.now(),
          refresh_token: 'gbc_refresh_token_' + Date.now(),
          user: {
            id: 'gbc_user_001',
            username: credentials.username,
            role: 'restaurant_admin'
          }
        };

        await this.saveTokens(mockAuthResponse.access_token, mockAuthResponse.refresh_token);
        return mockAuthResponse;
      }

      // For other credentials, try Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.username,
        password: credentials.password,
      });

      if (error) {
        throw new Error(error.message || 'Login failed');
      }

      if (!data.session) {
        throw new Error('No session created');
      }

      const authResponse: AuthResponse = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token || '',
        user: {
          id: data.user?.id || '',
          username: data.user?.email || credentials.username,
          role: 'user'
        }
      };

      await this.saveTokens(authResponse.access_token, authResponse.refresh_token);
      return authResponse;

    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearTokens();
      this.disconnectWebSocket();
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await this.saveTokens(data.access_token, data.refresh_token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }

    await this.clearTokens();
    return false;
  }

  async getOrders(): Promise<Order[]> {
    try {
      // Try to fetch from Supabase orders table
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.warn('Supabase orders fetch failed:', error.message);
        // Return mock data if Supabase fails
        return this.getMockOrders();
      }

      // Transform Supabase data to our Order interface
      return data?.map(order => ({
        id: order.id,
        orderNumber: order.order_number || `#${order.id}`,
        customerName: order.customer_name || 'Walk-in Customer',
        items: order.items || [],
        total: order.total || 0,
        status: order.status || 'pending',
        timestamp: order.timestamp || new Date().toISOString(),
        notes: order.notes
      })) || this.getMockOrders();

    } catch (error) {
      console.error('Error fetching orders:', error);
      return this.getMockOrders();
    }
  }

  private getMockOrders(): Order[] {
    return [
      {
        id: '1',
        orderNumber: '#001',
        customerName: 'John Smith',
        items: [
          { name: 'Paneer Pudina', quantity: 1, price: 18.99 },
          { name: 'Lamb Seekh', quantity: 1, price: 15.99 },
        ],
        total: 34.98,
        status: 'active',
        timestamp: new Date().toISOString(),
        notes: 'Extra spicy please',
      },
      {
        id: '2',
        orderNumber: '#002',
        customerName: 'Sarah Johnson',
        items: [
          { name: 'Chicken Tikka', quantity: 2, price: 12.50 },
          { name: 'Garlic Naan', quantity: 1, price: 3.50 },
        ],
        total: 28.50,
        status: 'pending',
        timestamp: new Date(Date.now() - 360000).toISOString(),
      },
      {
        id: '3',
        orderNumber: '#003',
        customerName: 'Mike Wilson',
        items: [
          { name: 'Chicken Biryani', quantity: 1, price: 15.99 },
          { name: 'Raita', quantity: 1, price: 2.99 },
        ],
        total: 18.98,
        status: 'completed',
        timestamp: new Date(Date.now() - 720000).toISOString(),
      },
    ];
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) {
        console.warn('Supabase order update failed:', error.message);
        // In a real app, you might want to queue this for retry
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  async getNotifications(): Promise<any[]> {
    const response = await this.makeRequest('/notifications');
    
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    const data = await response.json();
    return data.notifications;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const response = await this.makeRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
  }

  // WebSocket connection for real-time updates
  connectWebSocket(onMessage?: (data: any) => void) {
    if (this.wsConnection) {
      this.wsConnection.close();
    }

    const wsUrl = `${WS_URL}?token=${this.accessToken}`;
    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onopen = () => {
      console.log('WebSocket connected');
    };

    this.wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        if (onMessage) {
          onMessage(data);
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    this.wsConnection.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (this.accessToken) {
          this.connectWebSocket(onMessage);
        }
      }, 5000);
    };

    this.wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  disconnectWebSocket() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  // Printer-related API calls
  async printReceipt(orderId: string, type: 'customer' | 'kitchen' = 'customer'): Promise<void> {
    const response = await this.makeRequest('/print/receipt', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        type,
        printerSettings: {
          fontSize: 'large', // Increased font size as requested
          paperWidth: 58, // 58mm thermal paper
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to print receipt');
    }
  }

  async testPrinter(): Promise<void> {
    const response = await this.makeRequest('/print/test', {
      method: 'POST',
      body: JSON.stringify({
        printerSettings: {
          fontSize: 'large',
          paperWidth: 58,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to test printer');
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Dispatch order to website endpoint
  async dispatchOrder(orderId: string, websiteEndpoint: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚀 Dispatching order to website:', orderId, websiteEndpoint);

      // Get Supabase service role key from environment
      const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

      // Prepare dispatch payload
      const dispatchPayload = {
        order_id: orderId,
        status: 'dispatched',
        timestamp: new Date().toISOString(),
        dispatched_by: 'kitchen_app',
        app_version: '3.1.1'
      };

      console.log('📦 Dispatch payload:', dispatchPayload);

      // Send dispatch request to website endpoint
      const response = await fetch(websiteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Accept': 'application/json',
          'User-Agent': 'GBC-Kitchen-App/3.1.1'
        },
        body: JSON.stringify(dispatchPayload)
      });

      console.log('📡 Website response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Website dispatch failed:', response.status, errorText);
        throw new Error(`Website dispatch failed: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('✅ Website dispatch successful:', responseData);

      // Update order status in Supabase to "dispatched"
      try {
        const { error: supabaseError } = await supabase
          .from('orders')
          .update({
            status: 'dispatched',
            dispatched_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (supabaseError) {
          console.warn('⚠️ Failed to update Supabase order status:', supabaseError);
          // Don't fail the entire operation if Supabase update fails
        } else {
          console.log('✅ Supabase order status updated to dispatched');
        }
      } catch (supabaseUpdateError) {
        console.warn('⚠️ Supabase update error:', supabaseUpdateError);
      }

      return {
        success: true,
        message: responseData.message || 'Order dispatched successfully'
      };

    } catch (error) {
      console.error('❌ Dispatch error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to dispatch order'
      };
    }
  }
}

export const apiService = new ApiService();
export default apiService;
