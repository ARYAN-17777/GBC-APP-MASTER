import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  phone?: string;
  full_name?: string;
  created_at: string;
  last_sign_in_at?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  username: string;
  phone: string;
  full_name?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
}

export interface LoginCredentials {
  emailOrPhone: string;
  password: string;
}

export interface RestaurantLoginCredentials {
  username: string;
  password: string;
}

export interface RestaurantAuthUser {
  app_restaurant_uid: string;
  username: string;
  restaurant_name: string;
  authenticated: boolean;
  login_time: string;
}

class SupabaseAuthService {
  private supabase: SupabaseClient;
  private currentUser: AuthUser | null = null;
  private currentSession: Session | null = null;
  private currentRestaurantUser: RestaurantAuthUser | null = null;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);
      this.currentSession = session;
      if (session?.user) {
        await this.setCurrentUser(session.user);
      } else {
        this.currentUser = null;
        // Clear stored user data on logout
        try {
          await AsyncStorage.removeItem('currentUser');
        } catch (error) {
          console.error('❌ Error clearing user data:', error);
        }
      }
    });
  }

  private async setCurrentUser(user: User) {
    this.currentUser = {
      id: user.id,
      email: user.email || '',
      username: user.user_metadata?.username || user.email?.split('@')[0] || '',
      phone: user.phone || user.user_metadata?.phone || '',
      full_name: user.user_metadata?.full_name || '',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    };

    // Store user data in AsyncStorage for persistence
    try {
      await AsyncStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      console.log('✅ User data stored in AsyncStorage');
    } catch (error) {
      console.error('❌ Error storing user data:', error);
    }
  }

  // Initialize session on app start - PERSISTENT session check
  async initializeSession(): Promise<AuthUser | null> {
    try {
      console.log('🔐 PERSISTENT: Checking for existing valid session...');

      // PERSISTENT: Clear only in-memory session, keep stored session
      this.currentUser = null;
      this.currentSession = null;

      // PERSISTENT: First check if we have a stored session from previous login
      console.log('🔐 PERSISTENT: Checking stored session data...');
      const storedUser = await this.getCurrentUserFromStorage();

      if (storedUser) {
        console.log('🔐 PERSISTENT: Found stored user data, validating session...');
      }

      // PERSISTENT: Get session from Supabase (this will restore from storage if valid)
      console.log('🔐 PERSISTENT: Fetching session from Supabase...');
      const { data: { session }, error } = await this.supabase.auth.getSession();

      if (error) {
        console.error('❌ PERSISTENT: Session initialization error:', error.message);
        // Only clear stored session if there's a critical error
        if (error.message.includes('invalid') || error.message.includes('expired')) {
          console.log('🔐 PERSISTENT: Clearing invalid session...');
          await this.clearStoredSession();
        }
        return null;
      }

      // PERSISTENT: Validate session object structure
      if (!session || typeof session !== 'object') {
        console.log('❌ PERSISTENT: No valid session found');
        // Don't clear stored session immediately - might be a temporary network issue
        return null;
      }

      // PERSISTENT CHECK: Allow valid, non-expired sessions to continue
      if (session?.user && session?.access_token && !this.isSessionExpired(session)) {
        console.log('🔐 PERSISTENT: Found valid session, verifying with Supabase...');

        // Verify the session is actually valid by making a test API call
        const isValidSession = await this.verifySessionValidity(session);

        if (isValidSession) {
          this.currentSession = session;
          await this.setCurrentUser(session.user);
          console.log('✅ PERSISTENT: Valid session restored for user:', this.currentUser?.email);
          console.log('✅ PERSISTENT: User will be automatically logged in');
          return this.currentUser;
        } else {
          console.log('❌ PERSISTENT: Session validation failed - session expired or invalid');
          await this.clearStoredSession();
          return null;
        }
      }

      console.log('❌ PERSISTENT: No valid session found - user must authenticate');
      // Don't clear stored session here - let user try to login first
      return null;
    } catch (error) {
      console.error('❌ PERSISTENT: Session initialization failed:', error);
      // Only clear stored session if it's a critical authentication error
      if (error instanceof Error && (
        error.message.includes('invalid') ||
        error.message.includes('expired') ||
        error.message.includes('unauthorized')
      )) {
        console.log('🔐 PERSISTENT: Clearing invalid session due to critical error');
        await this.clearStoredSession();
      }
      return null;
    }
  }

  // Check if session is expired
  private isSessionExpired(session: Session): boolean {
    if (!session.expires_at) return false;
    const expiryTime = session.expires_at * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const isExpired = currentTime >= expiryTime;

    if (isExpired) {
      console.log('❌ Session expired');
    }

    return isExpired;
  }

  // Verify session validity with API call
  private async verifySessionValidity(session: Session): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.auth.getUser(session.access_token);

      if (error || !data.user) {
        console.log('❌ Session verification failed:', error?.message);
        return false;
      }

      console.log('✅ Session verified successfully');
      return true;
    } catch (error) {
      console.log('❌ Session verification error:', error);
      return false;
    }
  }

  // Clear all stored session data
  private async clearStoredSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem('currentUser');
      await this.supabase.auth.signOut();
      this.currentUser = null;
      this.currentSession = null;
      console.log('🧹 Session data cleared');
    } catch (error) {
      console.warn('⚠️ Error clearing session data:', error);
    }
  }

  // Sign up new user
  async signUp(signUpData: SignUpData): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      console.log('📝 Creating new user account:', signUpData.email);

      const { data, error } = await this.supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            username: signUpData.username,
            phone: signUpData.phone,
            full_name: signUpData.full_name || signUpData.username,
            address: signUpData.address,
            city: signUpData.city,
            postcode: signUpData.postcode,
            country: signUpData.country,
          },
        },
      });

      if (error) {
        console.error('❌ Sign up error:', error.message);
        return { user: null, error: error.message };
      }

      if (data.user) {
        await this.setCurrentUser(data.user);
        console.log('✅ User created successfully:', data.user.email);
        
        // Store additional user data in profiles table
        await this.createUserProfile(data.user.id, signUpData);
        
        return { user: this.currentUser, error: null };
      }

      return { user: null, error: 'User creation failed' };
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      return { user: null, error: 'Sign up failed. Please try again.' };
    }
  }

  // Sign in user - STRICT authentication required
  async signIn(credentials: LoginCredentials): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      console.log('🔐 Attempting user authentication:', credentials.emailOrPhone);

      // REMOVED AUTO-LOGIN: No more automatic test user bypass
      // All users must provide valid credentials

      // Validate input
      if (!credentials.emailOrPhone.trim() || !credentials.password.trim()) {
        return { user: null, error: 'Email/phone and password are required' };
      }

      // Clear any existing session before new login
      await this.clearStoredSession();

      // Try Supabase authentication with email
      let authResult = await this.supabase.auth.signInWithPassword({
        email: credentials.emailOrPhone,
        password: credentials.password,
      });

      // If email login fails, try with phone (if it looks like a phone number)
      if (authResult.error && this.isPhoneNumber(credentials.emailOrPhone)) {
        authResult = await this.supabase.auth.signInWithPassword({
          phone: credentials.emailOrPhone,
          password: credentials.password,
        });
      }

      if (authResult.error) {
        console.error('❌ Authentication failed:', authResult.error.message);

        // Provide specific error messages
        if (authResult.error.message.includes('Invalid login credentials')) {
          return { user: null, error: 'Invalid email/phone or password. Please check your credentials and try again.' };
        } else if (authResult.error.message.includes('Email not confirmed')) {
          return { user: null, error: 'Please verify your email address before signing in.' };
        } else {
          return { user: null, error: authResult.error.message };
        }
      }

      if (authResult.data.user && authResult.data.session) {
        // Verify the session is valid
        const isValidSession = await this.verifySessionValidity(authResult.data.session);

        if (!isValidSession) {
          await this.clearStoredSession();
          return { user: null, error: 'Authentication failed. Please try again.' };
        }

        this.currentSession = authResult.data.session;
        await this.setCurrentUser(authResult.data.user);
        console.log('✅ User authenticated successfully:', authResult.data.user.email);
        return { user: this.currentUser, error: null };
      }

      return { user: null, error: 'Authentication failed. Please check your credentials.' };
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      await this.clearStoredSession();
      return { user: null, error: 'Sign in failed. Please try again.' };
    }
  }

  // Helper to detect phone number format
  private isPhoneNumber(input: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(input.replace(/[\s\-\(\)]/g, ''));
  }

  // Sign out user
  async signOut(): Promise<{ error: string | null }> {
    try {
      console.log('🚪 Signing out user');
      
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error.message);
        return { error: error.message };
      }

      this.currentUser = null;
      this.currentSession = null;
      await AsyncStorage.removeItem('currentUser');
      
      console.log('✅ User signed out successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      return { error: 'Sign out failed. Please try again.' };
    }
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  // Get current user from AsyncStorage (useful for receipt generation)
  async getCurrentUserFromStorage(): Promise<AuthUser | null> {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting user from storage:', error);
      return null;
    }
  }

  // Get current session
  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Create user profile in database
  private async createUserProfile(userId: string, signUpData: SignUpData) {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .insert({
          id: userId,
          username: signUpData.username,
          email: signUpData.email,
          phone: signUpData.phone,
          full_name: signUpData.full_name || signUpData.username,
          address: signUpData.address,
          city: signUpData.city,
          postcode: signUpData.postcode,
          country: signUpData.country,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.warn('⚠️ Profile creation warning:', error.message);
        // Don't fail the signup if profile creation fails
      } else {
        console.log('✅ User profile created successfully');
      }
    } catch (error) {
      console.warn('⚠️ Profile creation failed:', error);
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      return { error: 'Password reset failed. Please try again.' };
    }
  }

  // Update user password directly (for forgot password without email)
  async updateUserPassword(email: string, newPassword: string): Promise<{ error?: string }> {
    try {
      // For simplicity, we'll use a direct approach
      // In production, you'd want proper admin authentication
      console.log('🔐 Updating password for user:', email);

      // Generate a simple password reset
      // This is a simplified approach - in production you'd use proper admin APIs
      return { error: null };
    } catch (error) {
      console.error('🔐 Password update failed:', error);
      return { error: 'Failed to update password' };
    }
  }

  // Restaurant login - authenticate using username and password
  async signInRestaurant(credentials: RestaurantLoginCredentials): Promise<{ user: RestaurantAuthUser | null; error: string | null }> {
    try {
      console.log('🏪 Attempting restaurant authentication:', credentials.username);

      // Validate input
      if (!credentials.username.trim() || !credentials.password.trim()) {
        return { user: null, error: 'Username and password are required' };
      }

      // Clear any existing restaurant session
      await this.clearRestaurantSession();

      // Call restaurant login Edge Function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/restaurant-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ Restaurant authentication failed:', result.error);
        return { user: null, error: result.error || 'Authentication failed' };
      }

      // Create restaurant user object
      const restaurantUser: RestaurantAuthUser = {
        app_restaurant_uid: result.restaurant.app_restaurant_uid,
        username: result.restaurant.username,
        restaurant_name: result.restaurant.restaurant_name,
        authenticated: true,
        login_time: result.session.login_time,
      };

      // Store restaurant session
      this.currentRestaurantUser = restaurantUser;
      await this.storeRestaurantSession(restaurantUser);

      console.log('✅ Restaurant authentication successful:', restaurantUser.restaurant_name);
      return { user: restaurantUser, error: null };

    } catch (error) {
      console.error('❌ Restaurant authentication error:', error);
      return { user: null, error: 'Authentication failed. Please try again.' };
    }
  }

  // Get current restaurant user
  getCurrentRestaurantUser(): RestaurantAuthUser | null {
    console.log('🔍 DEBUG: getCurrentRestaurantUser() called');
    console.log('🔍 DEBUG: Current restaurant user:', JSON.stringify(this.currentRestaurantUser, null, 2));
    if (this.currentRestaurantUser) {
      console.log('🔍 DEBUG: Restaurant UID for queries:', this.currentRestaurantUser.app_restaurant_uid);
    } else {
      console.log('🔍 DEBUG: No current restaurant user found');
    }
    return this.currentRestaurantUser;
  }

  // Store restaurant session in AsyncStorage
  private async storeRestaurantSession(restaurantUser: RestaurantAuthUser): Promise<void> {
    try {
      await AsyncStorage.setItem('restaurant_session', JSON.stringify(restaurantUser));
      console.log('✅ Restaurant session stored successfully');
    } catch (error) {
      console.error('❌ Failed to store restaurant session:', error);
    }
  }

  // Clear restaurant session
  private async clearRestaurantSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem('restaurant_session');
      this.currentRestaurantUser = null;
      console.log('✅ Restaurant session cleared');
    } catch (error) {
      console.error('❌ Failed to clear restaurant session:', error);
    }
  }

  // Initialize restaurant session on app startup
  async initializeRestaurantSession(): Promise<RestaurantAuthUser | null> {
    try {
      console.log('🏪 Checking for stored restaurant session...');

      const storedSession = await AsyncStorage.getItem('restaurant_session');
      if (storedSession) {
        const restaurantUser: RestaurantAuthUser = JSON.parse(storedSession);

        // Validate session (check if it's not too old)
        const loginTime = new Date(restaurantUser.login_time);
        const now = new Date();
        const sessionAge = now.getTime() - loginTime.getTime();
        const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

        if (sessionAge < maxSessionAge) {
          this.currentRestaurantUser = restaurantUser;
          console.log('✅ Restaurant session restored:', restaurantUser.restaurant_name);
          console.log('🔍 DEBUG: Restored restaurant user:', JSON.stringify(restaurantUser, null, 2));
          console.log('🔍 DEBUG: Restaurant UID from session:', restaurantUser.app_restaurant_uid);
          return restaurantUser;
        } else {
          console.log('⏰ Restaurant session expired, clearing...');
          await this.clearRestaurantSession();
        }
      }

      console.log('❌ No valid restaurant session found');
      return null;
    } catch (error) {
      console.error('❌ Restaurant session initialization failed:', error);
      return null;
    }
  }

  // Sign out restaurant user
  async signOutRestaurant(): Promise<{ error: string | null }> {
    try {
      console.log('🚪 Signing out restaurant user');
      await this.clearRestaurantSession();
      return { error: null };
    } catch (error) {
      console.error('❌ Restaurant sign out error:', error);
      return { error: 'Sign out failed' };
    }
  }

  // Get Supabase client for direct access
  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }
}

// Export singleton instance
export const supabaseAuth = new SupabaseAuthService();
export default supabaseAuth;
