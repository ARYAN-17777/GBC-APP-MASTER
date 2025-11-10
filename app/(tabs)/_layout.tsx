import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ActivityIndicator } from 'react-native';
import { useNotifications } from '../../contexts/NotificationContext';
import { useEffect, useState } from 'react';
import { supabaseAuth } from '../../services/supabase-auth';

export default function TabLayout() {
  const { unreadCount } = useNotifications();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      console.log('🔐 TabLayout: Checking restaurant authentication...');

      // CRITICAL SECURITY CHECK: Verify restaurant is authenticated before showing tabs
      const restaurantUser = supabaseAuth.getCurrentRestaurantUser();

      if (!restaurantUser) {
        console.log('❌ TabLayout: No restaurant user found, checking stored session...');
        const sessionUser = await supabaseAuth.initializeRestaurantSession();

        if (!sessionUser) {
          console.log('❌ TabLayout: No valid restaurant session - redirecting to login');
          router.replace('/login');
          return;
        }

        setIsAuthenticated(true);
        console.log('✅ TabLayout: Valid restaurant session found');
      } else {
        setIsAuthenticated(true);
        console.log('✅ TabLayout: Restaurant authenticated:', restaurantUser.restaurant_name);
      }
    } catch (error) {
      console.error('❌ TabLayout: Restaurant authentication check failed:', error);
      router.replace('/login');
    }
  };

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F47B20' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Verifying authentication...</Text>
      </View>
    );
  }

  // Only render tabs if authenticated
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#F47B20',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={24} color={color} />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  right: -6,
                  top: -3,
                  backgroundColor: '#FF3B30',
                  borderRadius: 10,
                  width: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
