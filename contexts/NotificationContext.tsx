import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import supabaseAuth from '../services/supabase-auth';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'system' | 'payment' | 'alert';
  timestamp: string;
  read: boolean;
  orderId?: string;
  orderNumber?: string;
  amount?: number;
  currency?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  playNotificationSound: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage keys - will be scoped per restaurant
const NOTIFICATIONS_STORAGE_KEY = 'gbc_notifications';
const READ_NOTIFICATIONS_STORAGE_KEY = 'gbc_read_notifications';

// Helper function to get restaurant-scoped storage key
const getRestaurantStorageKey = (baseKey: string): string => {
  const restaurantUser = supabaseAuth.getCurrentRestaurantUser();
  if (restaurantUser) {
    return `${baseKey}_${restaurantUser.app_restaurant_uid}`;
  }
  return baseKey; // Fallback to global key if no restaurant user
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const soundRef = useRef<Audio.Sound | null>(null);
  const realtimeSubscriptionRef = useRef<any>(null);

  // Initialize audio
  useEffect(() => {
    initializeAudio();
    loadReadNotifications();
    loadNotifications();
    setupRealtimeSubscription();

    return () => {
      cleanupAudio();
      cleanupRealtimeSubscription();
    };
  }, []);

  const initializeAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create a simple notification sound using Audio.Sound
      // We'll use a system beep sound or create a simple tone
      console.log('🔊 Audio initialized for notifications');
    } catch (error) {
      console.error('❌ Error initializing audio:', error);
    }
  };

  const cleanupAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('❌ Error cleaning up audio:', error);
    }
  };

  const playNotificationSound = async () => {
    try {
      // Create a simple beep sound programmatically
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=' },
        { shouldPlay: true, volume: 0.9 }
      );

      // Play the sound
      await sound.playAsync();

      // Clean up after playing
      setTimeout(async () => {
        try {
          await sound.unloadAsync();
        } catch (error) {
          console.error('❌ Error unloading sound:', error);
        }
      }, 1000);

      console.log('🔊 Notification sound played');
    } catch (error) {
      console.error('❌ Error playing notification sound:', error);
      // Fallback: try to use system beep or vibration
      try {
        // You could add haptic feedback here as a fallback
        console.log('🔊 Using fallback notification method');
      } catch (fallbackError) {
        console.error('❌ Fallback notification failed:', fallbackError);
      }
    }
  };

  const loadReadNotifications = async () => {
    try {
      const storageKey = getRestaurantStorageKey(READ_NOTIFICATIONS_STORAGE_KEY);
      const readIds = await AsyncStorage.getItem(storageKey);
      if (readIds) {
        setReadNotificationIds(new Set(JSON.parse(readIds)));
      }
    } catch (error) {
      console.error('❌ Error loading read notifications:', error);
    }
  };

  const saveReadNotifications = async (readIds: Set<string>) => {
    try {
      const storageKey = getRestaurantStorageKey(READ_NOTIFICATIONS_STORAGE_KEY);
      await AsyncStorage.setItem(storageKey, JSON.stringify(Array.from(readIds)));
    } catch (error) {
      console.error('❌ Error saving read notifications:', error);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      console.log('🔔 Loading restaurant-scoped notifications from Supabase orders...');

      // Get current restaurant user for filtering
      const restaurantUser = supabaseAuth.getCurrentRestaurantUser();
      if (!restaurantUser) {
        console.error('❌ No restaurant user found, cannot load notifications');
        setNotifications([]);
        setLoading(false);
        return;
      }

      console.log('🏪 Loading notifications for restaurant:', restaurantUser.app_restaurant_uid);

      // Fetch recent orders from Supabase filtered by restaurant UID
      const { data: supabaseOrders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_uid', restaurantUser.app_restaurant_uid)
        .order('createdAt', { ascending: false })
        .limit(50); // Get last 50 orders for notifications

      if (error) {
        console.error('❌ Supabase error loading notifications:', error);
        throw error;
      }

      console.log('✅ Fetched orders for notifications:', supabaseOrders?.length || 0);

      // Transform orders into notifications
      const orderNotifications: Notification[] = (supabaseOrders || []).map(order => {
        const orderItems = (order.items || []).map((item: any) =>
          `${item.quantity || 1}x ${item.title || item.name || 'Item'}`
        ).join(', ');

        const totalAmount = order.amount || 0;
        const currency = order.currency === 'INR' ? '₹' : '£';

        return {
          id: order.id,
          title: 'New Order Received',
          message: `Order ${order.orderNumber} - ${orderItems} (${currency}${totalAmount})`,
          type: 'order' as const,
          timestamp: order.createdAt || new Date().toISOString(),
          read: readNotificationIds.has(order.id) || order.status !== 'pending',
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: totalAmount,
          currency: currency,
        };
      });

      setNotifications(orderNotifications);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    try {
      console.log('🔄 Setting up real-time subscription for new orders...');

      const subscription = supabase
        .channel('orders')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'orders',
            filter: 'status=eq.pending'
          }, 
          (payload) => {
            console.log('🔔 New order received via real-time:', payload.new);
            handleNewOrderNotification(payload.new);
          }
        )
        .subscribe();

      realtimeSubscriptionRef.current = subscription;
      console.log('✅ Real-time subscription established');
    } catch (error) {
      console.error('❌ Error setting up real-time subscription:', error);
    }
  };

  const cleanupRealtimeSubscription = () => {
    try {
      if (realtimeSubscriptionRef.current) {
        realtimeSubscriptionRef.current.unsubscribe();
        realtimeSubscriptionRef.current = null;
        console.log('🧹 Real-time subscription cleaned up');
      }
    } catch (error) {
      console.error('❌ Error cleaning up real-time subscription:', error);
    }
  };

  const handleNewOrderNotification = async (newOrder: any) => {
    try {
      console.log('🔔 Processing new order notification:', newOrder);

      // Create notification from new order
      const orderItems = (newOrder.items || []).map((item: any) =>
        `${item.quantity || 1}x ${item.title || item.name || 'Item'}`
      ).join(', ');

      const totalAmount = newOrder.amount || 0;
      const currency = newOrder.currency === 'INR' ? '₹' : '£';

      const notification: Notification = {
        id: newOrder.id,
        title: 'New Order Received',
        message: `Order ${newOrder.orderNumber} - ${orderItems} (${currency}${totalAmount})`,
        type: 'order',
        timestamp: newOrder.createdAt || new Date().toISOString(),
        read: false,
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        amount: totalAmount,
        currency: currency,
      };

      // Add to notifications list (at the beginning)
      setNotifications(prev => [notification, ...prev]);

      // Play notification sound
      await playNotificationSound();

      console.log('✅ New order notification processed and sound played');
    } catch (error) {
      console.error('❌ Error handling new order notification:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const newReadIds = new Set(readNotificationIds);
      newReadIds.add(notificationId);
      setReadNotificationIds(newReadIds);
      await saveReadNotifications(newReadIds);

      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const allIds = new Set(notifications.map(n => n.id));
      setReadNotificationIds(allIds);
      await saveReadNotifications(allIds);

      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  };

  const refreshNotifications = async () => {
    await loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    playNotificationSound,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
