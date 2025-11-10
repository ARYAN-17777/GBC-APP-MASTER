import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import { printerService } from '../../services/printer';
import gbcOrderStatusAPI from '../../services/gbc-order-status-api';
import { formatCurrency, formatOrderPrice, extractDiscountValue, extractSubtotalValue } from '../../utils/currency';
import { NewOrderPayload, LegacyOrder, OrderTransformer } from '../../types/order';
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabaseAuth from '../../services/supabase-auth';

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
  status: 'approved' | 'preparing' | 'ready' | 'cancelled' | 'dispatched';
  timestamp: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  dispatchedAt?: string;
  customerPhone?: string;
  customerEmail?: string;
  subtotal?: number;
  discount?: number;
  deliveryFee?: number;
}

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [dispatchingOrders, setDispatchingOrders] = useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Helper function to get restaurant-scoped cache key
  const getRestaurantCacheKey = (key: string): string => {
    const restaurantUser = supabaseAuth.getCurrentRestaurantUser();
    if (restaurantUser) {
      return `${key}_${restaurantUser.app_restaurant_uid}`;
    }
    return key; // Fallback to global key if no restaurant user
  };

  const mockOrders: Order[] = [
    {
      id: '1',
      orderNumber: '#001',
      customerName: 'John Smith',
      items: [
        { name: 'Paneer Pudina', quantity: 1, price: 18.99 },
        { name: 'Lamb Seekh', quantity: 1, price: 15.99 },
      ],
      total: 34.98,
      status: 'preparing', // Kitchen is preparing this order
      timestamp: '2024-01-15T14:16:00Z',
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
      status: 'preparing', // Approved orders show as preparing in kitchen
      timestamp: '2024-01-15T14:22:00Z',
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
      status: 'ready', // Order is ready for pickup/dispatch
      timestamp: '2024-01-15T14:30:00Z',
    },
  ];

  useEffect(() => {
    // Clear existing orders before loading new ones for current restaurant
    setOrders([]);
    loadOrders();

    // Set up real-time subscription for new orders with restaurant filtering
    const setupSubscription = () => {
      const restaurantUser = supabaseAuth.getCurrentRestaurantUser();
      if (!restaurantUser) {
        console.log('⚠️ No restaurant user found, skipping real-time subscription setup');
        return null;
      }

      console.log('🔄 Setting up restaurant-scoped real-time subscription...');
      console.log('🔍 DEBUG: Subscription filtering by restaurant_uid =', restaurantUser.app_restaurant_uid);

      const subscription = supabase
        .channel('orders-channel')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `restaurant_uid=eq.${restaurantUser.app_restaurant_uid}`
          },
          (payload) => {
            console.log('🔔 Real-time order update (restaurant-scoped):', payload);
            console.log('🔍 DEBUG: Received update for restaurant_uid:', (payload.new as any)?.restaurant_uid || (payload.old as any)?.restaurant_uid);
            // Reload orders when any change occurs for this restaurant
            loadOrders();
          }
        )
        .subscribe();

      return subscription;
    };

    const subscription = setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        console.log('🧹 Cleaning up real-time subscription');
        subscription.unsubscribe();
      }
    };
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading restaurant-scoped orders from Supabase...');

      // Get current restaurant user for filtering
      const restaurantUser = supabaseAuth.getCurrentRestaurantUser();
      if (!restaurantUser) {
        console.error('❌ No restaurant user found, cannot load orders');
        setOrders([]);
        setLoading(false);
        return;
      }

      console.log('🏪 Loading orders for restaurant:', restaurantUser.app_restaurant_uid);
      console.log('🔍 DEBUG: Restaurant user object:', JSON.stringify(restaurantUser, null, 2));

      // First, let's check what orders exist in the database without filtering
      console.log('🔍 DEBUG: Checking all orders in database...');
      const { data: allOrders, error: allOrdersError } = await supabase
        .from('orders')
        .select('id, orderNumber, restaurant_uid, status, createdAt')
        .order('createdAt', { ascending: false })
        .limit(10);

      if (allOrdersError) {
        console.error('❌ Error fetching all orders:', allOrdersError);
      } else {
        console.log('🔍 DEBUG: All orders in database (last 10):', JSON.stringify(allOrders, null, 2));
        console.log('🔍 DEBUG: Looking for restaurant_uid matching:', restaurantUser.app_restaurant_uid);

        // Check if any orders match our restaurant UID
        const matchingOrders = allOrders?.filter(order => order.restaurant_uid === restaurantUser.app_restaurant_uid) || [];
        console.log('🔍 DEBUG: Orders matching our restaurant UID:', matchingOrders.length);
        if (matchingOrders.length > 0) {
          console.log('🔍 DEBUG: Matching orders:', JSON.stringify(matchingOrders, null, 2));
        }
      }

      // Fetch orders filtered by restaurant UID
      console.log('🔍 DEBUG: Executing filtered query with restaurant_uid =', restaurantUser.app_restaurant_uid);
      const { data: supabaseOrders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_uid', restaurantUser.app_restaurant_uid)
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Fetched restaurant orders from Supabase:', supabaseOrders?.length || 0);
      console.log('🔍 DEBUG: Filtered orders result:', JSON.stringify(supabaseOrders, null, 2));

      // Transform Supabase data to our Order interface - Updated for new payload format
      const transformedOrders: Order[] = (supabaseOrders || []).map(order => {
        // Helper function to convert price from cents to pounds if needed
        const convertPrice = (price: any): number => {
          if (typeof price === 'string') {
            const parsed = parseFloat(price);
            return isNaN(parsed) ? 0 : parsed;
          }
          if (typeof price === 'number') {
            // If price is greater than 100 and no decimal places, it's likely in cents
            if (price > 100 && price % 1 === 0) {
              return price / 100;
            }
            return price;
          }
          return 0;
        };

        // Check if this is the new payload format (from website)
        if (order.totals && order.amountDisplay) {
          // New payload format - prices are already in pounds
          return {
            id: order.userId || order.id,
            orderNumber: order.orderNumber,
            customerName: order.user?.name || 'Walk-in Customer',
            items: (order.items || []).map((item: any) => ({
              name: item.title || item.name || 'Unknown Item',
              quantity: item.quantity,
              price: parseFloat(formatOrderPrice(item.price || item.unitPrice, false)) || 0, // Use smart price formatting
              customizations: item.customizations || [] // Include customizations
            })),
            total: parseFloat(formatOrderPrice(order.amount, false)) || 0, // Use smart price formatting
            subtotal: extractSubtotalValue(order), // Extract subtotal from payload
            discount: extractDiscountValue(order), // Extract discount from payload
            status: order.status === 'pending' ? 'preparing' : order.status === 'active' ? 'preparing' : order.status === 'completed' ? 'ready' : order.status,
            timestamp: new Date().toISOString(),
            notes: ''
          };
        } else {
          // Legacy payload format or test orders - may need conversion from cents
          return {
            id: order.id,
            orderNumber: order.orderNumber || `#${order.id.slice(-6)}`,
            customerName: order.user?.name || 'Walk-in Customer',
            items: (order.items || []).map((item: any) => ({
              name: item.title || item.name || 'Unknown Item',
              quantity: item.quantity || 1,
              price: parseFloat(formatOrderPrice(item.price, false)) || 0, // Use smart price formatting
              customizations: item.customizations || [] // Include customizations
            })),
            total: parseFloat(formatOrderPrice(order.amount, false)) || 0, // Use smart price formatting
            subtotal: extractSubtotalValue(order), // Extract subtotal with fallback
            discount: extractDiscountValue(order), // Extract discount with fallback to 0
            status: order.status === 'pending' ? 'preparing' : order.status === 'active' ? 'preparing' : order.status === 'completed' ? 'ready' : order.status,
            timestamp: order.createdAt || new Date().toISOString(),
            notes: order.notes || ''
          };
        }
      });

      // Filter to only show approved orders (approved status becomes preparing in kitchen view)
      const approvedOrders = transformedOrders.filter(order =>
        order.status === 'approved' || order.status === 'preparing' || order.status === 'ready' || order.status === 'dispatched'
      ).map(order => ({
        ...order,
        status: order.status === 'approved' ? 'preparing' : order.status // Convert approved to preparing for kitchen view
      }));

      console.log('📋 Approved orders for kitchen:', approvedOrders.length);
      setOrders(approvedOrders);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading restaurant orders:', error);

      // For restaurant isolation, don't show mock data from other restaurants
      // Each restaurant should only see their own orders
      console.log('🏪 No orders found for current restaurant - showing empty list');
      setOrders([]);
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      console.log('🔄 Updating order status in Supabase:', orderId, newStatus);

      // Get current restaurant user for restaurant-scoped updates
      const restaurantUser = supabaseAuth.getCurrentRestaurantUser();
      if (!restaurantUser) {
        Alert.alert('Error', 'No restaurant user found. Please log in again.');
        return;
      }

      // Update order status in Supabase with restaurant-scoped filtering
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('restaurant_uid', restaurantUser.app_restaurant_uid);

      if (error) {
        console.error('❌ Failed to update order status:', error);
        throw error;
      }

      console.log('✅ Order status updated in Supabase');

      // Send status update to website for preparing and ready transitions
      if (newStatus === 'preparing' || newStatus === 'ready') {
        // Get order details to extract order number
        const order = orders.find(o => o.id === orderId);
        if (!order) {
          Alert.alert('Error', 'Order not found');
          return;
        }

        const statusUpdateResult = await gbcOrderStatusAPI.updateOrderStatus(order.orderNumber, newStatus as 'preparing' | 'ready');

        if (!statusUpdateResult.success) {
          console.error('❌ Failed to send status update to website:', statusUpdateResult.message);
          Alert.alert(
            'Website Update Failed',
            `Failed to notify website: ${statusUpdateResult.message}\n\nDo you want to update the status locally anyway?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Update Locally',
                onPress: () => updateOrderStatusLocally(orderId, newStatus)
              }
            ]
          );
          return;
        }

        console.log('✅ Order status updated and website notified successfully');
      }

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      const successMessage = newStatus === 'ready'
        ? 'Order marked as ready and website notified!'
        : `Order status updated to ${newStatus}`;
      Alert.alert('Success', successMessage);
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status. Please try again.');
    }
  };

  const updateOrderStatusLocally = async (orderId: string, newStatus: Order['status']) => {
    try {
      console.log('🔄 Updating order status locally only:', orderId, newStatus);

      // Get current restaurant user for restaurant-scoped updates
      const restaurantUser = supabaseAuth.getCurrentRestaurantUser();
      if (!restaurantUser) {
        Alert.alert('Error', 'No restaurant user found. Please log in again.');
        return;
      }

      // Update order status in Supabase with restaurant-scoped filtering
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('restaurant_uid', restaurantUser.app_restaurant_uid);

      if (error) {
        console.error('❌ Failed to update order status locally:', error);
        throw error;
      }

      console.log('✅ Order status updated locally');

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      Alert.alert('Success', `Order status updated to ${newStatus} (website not notified)`);
    } catch (error) {
      console.error('❌ Error updating order status locally:', error);
      Alert.alert('Error', 'Failed to update order status locally. Please try again.');
    }
  };

  const dispatchOrder = async (order: Order) => {
    // Confirm dispatch action
    Alert.alert(
      'Dispatch Order',
      `Are you sure you want to dispatch order ${order.orderNumber} to the website?\n\nThis will notify the website that the order is ready for delivery/pickup.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch',
          style: 'default',
          onPress: () => performDispatch(order)
        }
      ]
    );
  };

  const performDispatch = async (order: Order) => {
    try {
      console.log('🚀 Starting dispatch process for order:', order.orderNumber);

      // Add order to dispatching set
      setDispatchingOrders(prev => new Set(prev).add(order.id));

      // Dispatch order using the new GBC API
      const result = await gbcOrderStatusAPI.dispatchOrder(order.orderNumber);

      if (result.success) {
        console.log('✅ Order dispatched successfully');

        // Update local order status
        setOrders(prevOrders =>
          prevOrders.map(o =>
            o.id === order.id ? { ...o, status: 'dispatched' as const } : o
          )
        );

        Alert.alert(
          'Dispatch Successful',
          `Order ${order.orderNumber} has been dispatched to the website successfully!`,
          [{ text: 'OK' }]
        );
      } else {
        console.error('❌ Dispatch failed:', result.message);
        Alert.alert(
          'Dispatch Failed',
          `Failed to dispatch order ${order.orderNumber}:\n\n${result.message}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Retry',
              onPress: () => performDispatch(order)
            }
          ]
        );
      }

    } catch (error) {
      console.error('❌ Dispatch error:', error);
      Alert.alert(
        'Dispatch Error',
        `An error occurred while dispatching order ${order.orderNumber}. Please try again.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Retry',
            onPress: () => performDispatch(order)
          }
        ]
      );
    } finally {
      // Remove order from dispatching set
      setDispatchingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(order.id);
        return newSet;
      });
    }
  };

  const printOrder = async (order: Order) => {
    Alert.alert(
      'Print Receipt Options',
      `Choose print format for order ${order.orderNumber}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Print',
          onPress: () => printThermalReceipt(order)
        },
        {
          text: 'Generate PNG/PDF',
          onPress: () => generateReceiptFiles(order)
        },
        {
          text: 'Standard Print',
          onPress: () => printStandardReceipt(order)
        },
      ]
    );
  };

  const printThermalReceipt = async (order: Order) => {
    try {
      console.log('🖨️ Printing compact thermal receipt (80mm)...');

      // Convert order to the format expected by printer service
      const printerOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName || 'Kitchen Order',
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          customizations: (item as any).customizations || []
        })),
        total: order.total,
        timestamp: order.timestamp || new Date().toISOString(),
        notes: order.notes
      };

      // Print the thermal receipt with new compact layout
      const printSuccess = await printerService.printReceipt(printerOrder, 'kitchen');

      if (printSuccess) {
        console.log('✅ Thermal receipt printed successfully');
        Alert.alert('Success', 'Compact thermal receipt (80mm) printed successfully!');
      } else {
        console.log('⚠️ Thermal print completed (may require manual printer selection)');
        Alert.alert('Print Sent', 'Thermal receipt sent to printer');
      }

    } catch (error) {
      console.error('❌ Thermal print error:', error);
      Alert.alert('Print Error', 'Failed to print thermal receipt. Please try again.');
    }
  };

  const generateReceiptFiles = async (order: Order) => {
    try {
      console.log('📋 Generating PNG and PDF receipt files...');

      // Get restaurant name from restaurant session
      let restaurantName = 'General Bilimoria\'s Canteen'; // Default fallback
      try {
        const restaurantSession = await AsyncStorage.getItem('restaurant_session');
        if (restaurantSession) {
          const restaurant = JSON.parse(restaurantSession);
          restaurantName = restaurant.restaurant_name || restaurantName;
        }
      } catch (error) {
        console.warn('⚠️ Could not get restaurant name, using default:', error);
      }

      // Convert order to the format expected by printer service
      const printerOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName || 'Kitchen Order',
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          customizations: (item as any).customizations || []
        })),
        total: order.total,
        timestamp: order.timestamp || new Date().toISOString(),
        notes: order.notes
      };

      // Generate PNG (800px wide) and PDF (80mm width) receipts with restaurant name
      await printerService.generateAndShareReceipts(printerOrder, restaurantName);

    } catch (error) {
      console.error('❌ Receipt generation error:', error);
      Alert.alert('Generation Error', 'Failed to generate receipt files. Please try again.');
    }
  };

  const printStandardReceipt = async (order: Order) => {
    try {
      console.log('🖨️ Printing standard kitchen receipt...');

      // Convert order to the format expected by printer service
      const printerOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName || 'Kitchen Order',
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          customizations: (item as any).customizations || []
        })),
        total: order.total,
        timestamp: order.timestamp || new Date().toISOString(),
        notes: order.notes
      };

      // Print the standard kitchen receipt
      const printSuccess = await printerService.printReceipt(printerOrder, 'kitchen');

      if (printSuccess) {
        console.log('✅ Standard receipt printed successfully');
        Alert.alert('Success', 'Kitchen receipt printed successfully!');
      } else {
        console.log('⚠️ Standard print completed (may require manual printer selection)');
        Alert.alert('Print Sent', 'Kitchen receipt sent to printer');
      }

    } catch (error) {
      console.error('❌ Standard print error:', error);
      Alert.alert('Print Error', 'Failed to print kitchen receipt. Please try again.');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'approved':
        return '#3b82f6'; // Blue for approved
      case 'preparing':
        return '#3b82f6'; // Blue for preparing (approved orders in kitchen)
      case 'ready':
        return '#10b981'; // Green for ready
      case 'dispatched':
        return '#8b5cf6'; // Purple for dispatched
      case 'cancelled':
        return '#ef4444'; // Red for cancelled
      default:
        return '#6b7280';
    }
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    switch (currentStatus) {
      case 'preparing':
        return 'ready'; // Preparing orders can be marked as ready
      default:
        return null; // No other status transitions allowed
    }
  };

  const canDispatch = (status: Order['status']): boolean => {
    return status === 'ready'; // Only ready orders can be dispatched
  };

  const canMarkAsReady = (status: Order['status']): boolean => {
    return status === 'preparing'; // Only preparing orders can be marked as ready
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFullDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Management</Text>
        <Text style={styles.subtitle}>Kitchen Dashboard</Text>
      </View>

      <ScrollView
        style={styles.ordersList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadOrders} />
        }
      >
        {orders.map((order) => {
          const isExpanded = expandedOrders.has(order.id);

          return (
            <TouchableOpacity
              key={order.id}
              style={[styles.orderCard, isExpanded && styles.orderCardExpanded]}
              onPress={() => toggleOrderExpansion(order.id)}
              activeOpacity={0.7}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.customerName}>{order.customerName}</Text>
                  <Text style={styles.orderTime}>{formatTime(order.timestamp)}</Text>
                </View>

                <View style={styles.orderActions}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                    <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.printButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      printOrder(order);
                    }}
                  >
                    <Ionicons name="print" size={20} color="#F47B20" />
                  </TouchableOpacity>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#666"
                    style={styles.expandIcon}
                  />
                </View>
              </View>

            {/* Basic Items List (always visible) */}
            <View style={styles.itemsList}>
              {order.items.slice(0, isExpanded ? order.items.length : 3).map((item, index) => (
                <View key={index}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>{formatOrderPrice(item.price)}</Text>
                  </View>
                  {/* Display customizations if available */}
                  {(item as any).customizations && (item as any).customizations.length > 0 && (
                    <View style={styles.customizationsContainer}>
                      <Text style={styles.customizationsText}>
                        Customizations: {(item as any).customizations.map((c: any) => c.name).join(', ')}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
              {!isExpanded && order.items.length > 3 && (
                <Text style={styles.moreItemsText}>
                  +{order.items.length - 3} more items...
                </Text>
              )}
            </View>

            {/* Expanded Details Section */}
            {isExpanded && (
              <View style={styles.expandedDetails}>
                {/* Customer Information */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Customer Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name:</Text>
                    <Text style={styles.detailValue}>{order.customerName}</Text>
                  </View>
                  {order.customerPhone && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Phone:</Text>
                      <Text style={styles.detailValue}>{order.customerPhone}</Text>
                    </View>
                  )}
                  {order.customerEmail && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Email:</Text>
                      <Text style={styles.detailValue}>{order.customerEmail}</Text>
                    </View>
                  )}
                </View>

                {/* Order Notes */}
                {order.notes && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Order Notes</Text>
                    <Text style={styles.notesText}>{order.notes}</Text>
                  </View>
                )}

                {/* Order Timeline */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Order Timeline</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Created:</Text>
                    <Text style={styles.detailValue}>{formatFullDateTime(order.timestamp)}</Text>
                  </View>
                  {order.updatedAt && order.updatedAt !== order.timestamp && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Updated:</Text>
                      <Text style={styles.detailValue}>{formatFullDateTime(order.updatedAt)}</Text>
                    </View>
                  )}
                  {order.dispatchedAt && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Dispatched:</Text>
                      <Text style={styles.detailValue}>{formatFullDateTime(order.dispatchedAt)}</Text>
                    </View>
                  )}
                </View>

                {/* Order Total Breakdown */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Order Total</Text>
                  {order.subtotal && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Subtotal:</Text>
                      <Text style={styles.detailValue}>{formatOrderPrice(order.subtotal)}</Text>
                    </View>
                  )}
                  {order.discount && order.discount > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Discount:</Text>
                      <Text style={[styles.detailValue, styles.discountText]}>-{formatOrderPrice(order.discount)}</Text>
                    </View>
                  )}
                  {order.deliveryFee && order.deliveryFee > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Delivery Fee:</Text>
                      <Text style={styles.detailValue}>{formatCurrency(order.deliveryFee)}</Text>
                    </View>
                  )}
                  <View style={[styles.detailRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>{formatOrderPrice(order.total)}</Text>
                  </View>
                </View>
              </View>
            )}



            <View style={styles.orderFooter}>
              <Text style={styles.totalText}>Total: {formatOrderPrice(order.total)}</Text>

              <View style={styles.actionButtons}>
                {canMarkAsReady(order.status) && (
                  <TouchableOpacity
                    style={styles.updateButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, getNextStatus(order.status)!);
                    }}
                  >
                    <Text style={styles.updateButtonText}>
                      Mark as Ready
                    </Text>
                  </TouchableOpacity>
                )}

                {canDispatch(order.status) && (
                  <TouchableOpacity
                    style={[
                      styles.dispatchButton,
                      dispatchingOrders.has(order.id) && styles.dispatchButtonDisabled
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      dispatchOrder(order);
                    }}
                    disabled={dispatchingOrders.has(order.id)}
                  >
                    {dispatchingOrders.has(order.id) ? (
                      <View style={styles.dispatchButtonContent}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.dispatchButtonText}>Dispatching...</Text>
                      </View>
                    ) : (
                      <View style={styles.dispatchButtonContent}>
                        <Ionicons name="send" size={16} color="#fff" />
                        <Text style={styles.dispatchButtonText}>Dispatch</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}

                {order.status === 'dispatched' && (
                  <View style={styles.dispatchedIndicator}>
                    <Ionicons name="checkmark-circle" size={16} color="#8b5cf6" />
                    <Text style={styles.dispatchedText}>Dispatched</Text>
                  </View>
                )}
              </View>
            </View>
            </TouchableOpacity>
          );
        })}

        {orders.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No orders to display</Text>
          </View>
        )}
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
  ordersList: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  orderCardExpanded: {
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  orderTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  orderActions: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  expandIcon: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  printButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  itemsList: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F47B20',
    width: 30,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  moreItemsText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F47B20',
  },
  discountText: {
    color: '#10b981',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F47B20',
    flex: 2,
    textAlign: 'right',
  },

  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  updateButton: {
    backgroundColor: '#F47B20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dispatchButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dispatchButtonDisabled: {
    backgroundColor: '#a78bfa',
    opacity: 0.7,
  },
  dispatchButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dispatchButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dispatchedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  dispatchedText: {
    color: '#8b5cf6',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  customizationsContainer: {
    marginLeft: 24,
    marginTop: 4,
    marginBottom: 4,
  },
  customizationsText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
