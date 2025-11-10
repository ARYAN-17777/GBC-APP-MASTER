import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Clipboard,
  ToastAndroid,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { supabaseAuth } from '../services/supabase-auth';
import { gbcOrderStatusAPI } from '../services/gbc-order-status-api';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  phone: string;
  full_name: string;
  created_at: string;
  last_sign_in_at: string;
  restaurant_name: string;
  restaurant_uid: string;
  session_start?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
}

export default function ProfileScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [sessionStart] = useState(new Date().toISOString());

  useEffect(() => {
    loadUserProfile();

    // Update current time every second for real-time display
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Monitor network connectivity
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => {
      clearInterval(timeInterval);
      unsubscribe();
    };
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      // Get current restaurant user
      const restaurantUser = supabaseAuth.getCurrentRestaurantUser();

      if (restaurantUser) {
        // Get restaurant UID that matches API headers
        const restaurantUID = await getRestaurantUID();

        // Create profile from restaurant user data
        const profile: UserProfile = {
          id: restaurantUser.app_restaurant_uid,
          email: `${restaurantUser.username}@restaurant.gbc`,
          username: restaurantUser.username,
          phone: '+44 1234 567890', // Default phone for restaurants
          full_name: restaurantUser.restaurant_name,
          created_at: restaurantUser.login_time,
          last_sign_in_at: restaurantUser.login_time,
          restaurant_name: restaurantUser.restaurant_name,
          restaurant_uid: restaurantUID,
          session_start: sessionStart,
          address: '123 Restaurant Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'United Kingdom',
        };

        setUserProfile(profile);
      } else {
        Alert.alert('Error', 'No restaurant session found. Please login again.');
        router.replace('/login');
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get restaurant UID (same logic as API service)
  const getRestaurantUID = async (): Promise<string> => {
    try {
      const restaurantSession = await AsyncStorage.getItem('restaurant_session');
      if (restaurantSession) {
        const restaurant = JSON.parse(restaurantSession);
        if (restaurant.app_restaurant_uid) {
          return restaurant.app_restaurant_uid;
        }
        const currentUser = supabaseAuth.getCurrentRestaurantUser();
        return currentUser?.app_restaurant_uid || 'gbc-kitchen-default';
      }
      return 'gbc-kitchen-default';
    } catch (error) {
      console.warn('⚠️ Could not get restaurant UID, using default:', error);
      return 'gbc-kitchen-default';
    }
  };

  // Helper function to get full name with fallback order
  const getFullName = (metadata: any, currentUser: any, profileData: any): string => {
    return profileData?.full_name ||
           metadata?.full_name ||
           currentUser?.full_name ||
           (currentUser?.email ? currentUser.email.split('@')[0] : 'User');
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show(`${label} copied to clipboard`, ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied', `${label} copied to clipboard`);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Unknown';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatCurrentDate = () => {
    return currentTime.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return '—';
    }
  };

  // Handle password reset
  const handleChangePassword = async () => {
    if (!isOnline) {
      Alert.alert(
        'Offline',
        'Connect to the internet to reset password',
        [{ text: 'OK' }]
      );
      return;
    }

    const userEmail = userProfile?.email;
    if (!userEmail) {
      Alert.alert('Error', 'No email found for password reset');
      return;
    }

    Alert.alert(
      'Reset Password',
      `Send a reset link to ${userEmail}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              const supabaseClient = supabaseAuth.getSupabaseClient();
              const { error } = await supabaseClient.auth.resetPasswordForEmail(userEmail);

              if (error) {
                console.error('Password reset error:', error);
                Alert.alert('Error', 'Couldn\'t send reset link. Try again.');
              } else {
                Alert.alert(
                  'Reset Link Sent',
                  `Reset link sent to ${userEmail}. Check your inbox.`,
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('Password reset failed:', error);
              Alert.alert('Error', 'Couldn\'t send reset link. Try again.');
            }
          }
        }
      ]
    );
  };

  const ProfileItem = ({
    icon,
    title,
    value,
    subtitle,
    copyable = false
  }: {
    icon: string;
    title: string;
    value: string;
    subtitle?: string;
    copyable?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.profileItem}
      onLongPress={copyable ? () => copyToClipboard(value, title) : undefined}
      activeOpacity={copyable ? 0.7 : 1}
    >
      <View style={styles.profileItemLeft}>
        <Ionicons name={icon as any} size={24} color="#F47B20" />
        <View style={styles.profileItemText}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.profileItemRight}>
        <Text style={[styles.profileItemValue, value === '—' && styles.missingValue]} numberOfLines={2}>
          {value}
        </Text>
        {copyable && (
          <Ionicons name="copy-outline" size={16} color="#999" style={styles.copyIcon} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#F47B20" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <ProfileItem
            icon="mail"
            title="Login ID (Email)"
            value={userProfile?.email || '—'}
            subtitle="Your login email address"
            copyable={true}
          />

          <ProfileItem
            icon="person"
            title="User Name"
            value={userProfile?.full_name || '—'}
            subtitle="Display name"
          />

          <ProfileItem
            icon="business"
            title="Restaurant Name"
            value={userProfile?.restaurant_name || '—'}
            subtitle="Your restaurant location"
          />

          <ProfileItem
            icon="key"
            title="Restaurant ID (UID)"
            value={userProfile?.restaurant_uid || '—'}
            subtitle="Tenant identifier for API requests"
            copyable={true}
          />

          <ProfileItem
            icon="time"
            title="Last Login"
            value={userProfile?.last_sign_in_at ? formatDateTime(userProfile.last_sign_in_at) : '—'}
            subtitle="Most recent authentication"
          />

          <ProfileItem
            icon="log-in"
            title="Signed-in Since"
            value={userProfile?.session_start ? formatDateTime(userProfile.session_start) : formatDateTime(userProfile?.last_sign_in_at || '')}
            subtitle="Current session start time"
          />
        </View>

        {/* Change Password */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, !isOnline && styles.disabledButton]}
            onPress={handleChangePassword}
            disabled={!isOnline}
          >
            <Ionicons name="key" size={24} color={isOnline ? "#F47B20" : "#ccc"} />
            <View style={styles.actionButtonText}>
              <Text style={[styles.actionButtonTitle, !isOnline && styles.disabledText]}>
                Change Password
              </Text>
              <Text style={[styles.actionButtonSubtitle, !isOnline && styles.disabledText]}>
                {isOnline ? 'Send password reset email' : 'Connect to internet to reset password'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isOnline ? "#ccc" : "#eee"} />
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Status</Text>

          <ProfileItem
            icon={isOnline ? "wifi" : "wifi-off"}
            title="Network Status"
            value={isOnline ? "Connected" : "Offline"}
            subtitle={isOnline ? "Online features available" : "Limited functionality"}
          />

          <ProfileItem
            icon="cloud"
            title="Backend"
            value="Supabase Connected"
            subtitle="Authentication & data sync"
          />

          <ProfileItem
            icon="sync"
            title="Last Updated"
            value={formatCurrentTime()}
            subtitle="Profile data refreshed"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F47B20',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    backgroundColor: '#F47B20',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  realtimeSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  realtimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  realtimeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  currentTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F47B20',
    textAlign: 'center',
    marginBottom: 5,
  },
  currentDate: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemText: {
    marginLeft: 12,
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  profileItemSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  profileItemValue: {
    fontSize: 14,
    color: '#F47B20',
    fontWeight: '500',
    textAlign: 'right',
    maxWidth: 150,
  },
  profileItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  missingValue: {
    color: '#ccc',
    fontStyle: 'italic',
  },
  copyIcon: {
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: '#f8f8f8',
  },
  actionButtonText: {
    marginLeft: 15,
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionButtonSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  disabledText: {
    color: '#ccc',
  },
});
