import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabaseAuth } from '../../services/supabase-auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const handleLogout = async () => {
    Alert.alert(
      'Restaurant Logout',
      'Are you sure you want to logout? This will clear all cached order data for this restaurant.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Logging out restaurant user...');

              // Get current restaurant user before logout to clear their data
              const restaurantUser = supabaseAuth.getCurrentRestaurantUser();

              // Sign out restaurant user
              const { error } = await supabaseAuth.signOutRestaurant();

              if (error) {
                Alert.alert('Logout Error', error);
                return;
              }

              // Clear restaurant-scoped cached data
              if (restaurantUser) {
                console.log('🧹 Clearing restaurant-scoped cached data...');
                const restaurantUID = restaurantUser.app_restaurant_uid;

                // Clear restaurant-scoped AsyncStorage keys
                const keysToRemove = [
                  `orders_${restaurantUID}`,
                  `gbc_notifications_${restaurantUID}`,
                  `gbc_read_notifications_${restaurantUID}`,
                  `gbc_offline_queue_${restaurantUID}`,
                  `device_label_${restaurantUID}`,
                  `app_restaurant_uid_${restaurantUID}`
                ];

                await Promise.all(
                  keysToRemove.map(key =>
                    AsyncStorage.removeItem(key).catch(err =>
                      console.warn(`⚠️ Failed to remove ${key}:`, err)
                    )
                  )
                );

                console.log('✅ Restaurant-scoped data cleared');
              }

              console.log('✅ Successfully logged out restaurant user');
              router.replace('/login');
            } catch (error) {
              console.error('❌ Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };



  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color="#F47B20" />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement || <Ionicons name="chevron-forward" size={20} color="#ccc" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>App Configuration</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* App Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Configuration</Text>
          
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            subtitle="Receive order and system notifications"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#ccc', true: '#F47B20' }}
              />
            }
          />

          <SettingItem
            icon="volume-high"
            title="Sound Alerts"
            subtitle="Play sound for new orders"
            rightElement={
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#ccc', true: '#F47B20' }}
              />
            }
          />

          <SettingItem
            icon="refresh"
            title="Auto Refresh"
            subtitle="Automatically refresh orders every 30 seconds"
            rightElement={
              <Switch
                value={autoRefresh}
                onValueChange={setAutoRefresh}
                trackColor={{ false: '#ccc', true: '#F47B20' }}
              />
            }
          />
        </View>



        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <SettingItem
            icon="person"
            title="Profile"
            subtitle="View and edit your profile"
            onPress={() => router.push('/profile' as any)}
          />

          <SettingItem
            icon="help-circle"
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => router.push('/terms-and-conditions' as any)}
          />
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Info</Text>
          
          <SettingItem
            icon="information-circle"
            title="About"
            subtitle="Version 3.0.0 - General Bilimoria's Canteen"
            onPress={() => Alert.alert('About', 'GBC Restaurant App v3.0.0\nBuilt with Expo and React Native')}
          />

          <SettingItem
            icon="trash"
            title="Clear Cache"
            subtitle="Clear app cache and temporary data"
            onPress={clearCache}
          />


        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 General Bilimoria's Canteen
          </Text>
          <Text style={styles.footerText}>
            All rights reserved
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#F47B20',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '300',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
