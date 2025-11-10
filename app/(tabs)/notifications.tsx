import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../contexts/NotificationContext';
import { router } from 'expo-router';
import { supabaseAuth } from '../../services/supabase-auth';

export default function NotificationsScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    playNotificationSound
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      console.log('🔐 NotificationsScreen: Checking restaurant authentication...');

      const restaurantUser = supabaseAuth.getCurrentRestaurantUser();
      if (!restaurantUser) {
        console.log('❌ NotificationsScreen: No authenticated restaurant - redirecting to login');
        router.replace('/login');
        return;
      }

      setIsAuthenticated(true);
      console.log('✅ NotificationsScreen: Restaurant authenticated:', restaurantUser.restaurant_name);
    } catch (error) {
      console.error('❌ NotificationsScreen: Restaurant authentication check failed:', error);
      router.replace('/login');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: any) => {
    // Mark as read when tapped
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate to order details if it's an order notification
    if (notification.type === 'order' && notification.orderId) {
      // You can navigate to order details here
      Alert.alert(
        'Order Details',
        `Order ${notification.orderNumber}\nAmount: ${notification.currency}${notification.amount}\n\nTap "View Orders" to see full details.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Orders', onPress: () => router.push('/orders') }
        ]
      );
    }
  };

  const handleMarkAllAsRead = () => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark All Read', onPress: markAllAsRead }
      ]
    );
  };

  const testNotificationSound = async () => {
    await playNotificationSound();
    Alert.alert('Test Sound', 'Notification sound played!');
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return 'restaurant';
      case 'payment':
        return 'card';
      case 'system':
        return 'settings';
      case 'alert':
        return 'warning';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return '#F47B20';
      case 'payment':
        return '#34C759';
      case 'system':
        return '#007AFF';
      case 'alert':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const renderNotificationItem = ({ item }: { item: any }) => (
    <Pressable
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: getNotificationColor(item.type) + '20' }
          ]}>
            <Ionicons
              name={getNotificationIcon(item.type)}
              size={20}
              color={getNotificationColor(item.type)}
            />
          </View>
          <View style={styles.notificationText}>
            <Text style={[
              styles.notificationTitle,
              !item.read && styles.unreadTitle
            ]}>
              {item.title}
            </Text>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
          {!item.read && (
            <View style={styles.unreadDot} />
          )}
        </View>
      </View>
    </Pressable>
  );

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F47B20' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Verifying authentication...</Text>
      </View>
    );
  }

  // Only render content if authenticated
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={testNotificationSound}
          >
            <Ionicons name="volume-high" size={20} color="#F47B20" />
          </TouchableOpacity>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleMarkAllAsRead}
            >
              <Ionicons name="checkmark-done" size={20} color="#F47B20" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Unread Count */}
      {unreadCount > 0 && (
        <View style={styles.unreadCountContainer}>
          <Text style={styles.unreadCountText}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F47B20']}
            tintColor="#F47B20"
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyMessage}>
              You'll see new order notifications here
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  unreadCountContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unreadCountText: {
    fontSize: 14,
    color: '#F47B20',
    fontWeight: '600',
  },
  listContainer: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  notificationItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#F47B20',
    backgroundColor: '#fffbf7',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F47B20',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#F47B20',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});