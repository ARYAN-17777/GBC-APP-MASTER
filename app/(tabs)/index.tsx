import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { printerService } from '../../services/printer';
import { createClient } from '@supabase/supabase-js';
import gbcOrderStatusAPI from '../../services/gbc-order-status-api';
import { SvgXml } from 'react-native-svg';
import { formatOrderPrice, extractDiscountValue, extractSubtotalValue } from '../../utils/currency';
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabaseAuth from '../../services/supabase-auth';

// GBC Logo SVG - EXACT design matching the provided image
const GBC_LOGO_SVG = `<svg width="70" height="70" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <!-- Circular background with exact orange color #F77F00 -->
  <circle cx="60" cy="60" r="60" fill="#F77F00"/>

  <!-- White border circle for definition -->
  <circle cx="60" cy="60" r="58" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.3"/>

  <!-- Text content with exact positioning and typography -->
  <g transform="translate(60, 60)" text-anchor="middle" fill="#FFFFFF">

    <!-- "GENERAL" text - curved at top -->
    <path id="top-curve" d="M -38,-28 A 38,38 0 0,1 38,-28" fill="none"/>
    <text font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="8" letter-spacing="2">
      <textPath href="#top-curve" startOffset="50%">GENERAL</textPath>
    </text>

    <!-- "BILIMORIA'S" text - main center text, bold and prominent -->
    <text y="-2" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="12" letter-spacing="0.5">BILIMORIA'S</text>

    <!-- "CANTEEN" text - below main text -->
    <text y="12" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="9" letter-spacing="1.8">CANTEEN</text>

    <!-- Decorative elements "20 • 23" positioned on sides -->
    <text x="-25" y="0" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="7" opacity="0.8">20</text>
    <text x="25" y="0" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="7" opacity="0.8">23</text>

    <!-- Center dot between 20 and 23 -->
    <circle cx="0" cy="-1" r="1" fill="#FFFFFF" opacity="0.8"/>

    <!-- "ESTD. LONDON, UK" text - curved at bottom -->
    <path id="bottom-curve" d="M -38,28 A 38,38 0 0,0 38,28" fill="none"/>
    <text font-family="Arial, Helvetica, sans-serif" font-weight="normal" font-size="6" letter-spacing="0.8" opacity="0.9">
      <textPath href="#bottom-curve" startOffset="50%">ESTD. LONDON, UK</textPath>
    </text>

  </g>
</svg>`;

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  time: string;
  items: OrderItem[];
  total: number;
  status: 'approved' | 'completed' | 'cancelled' | 'pending';
  customerName?: string;
  timestamp?: string;
  notes?: string;
  subtotal?: number;
  discount?: number;
}

// Supabase configuration
const SUPABASE_URL = 'https://evqmvmjnfeefeeizeljq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function DashboardScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);

  const mockOrders: Order[] = [
    {
      id: '1',
      orderNumber: 'GBC- CB2',
      time: '17:05',
      items: [
        { name: 'Kosha Mangsho', quantity: 1, price: 19.14 },
        { name: 'Steam Rice', quantity: 1, price: 4.20 }
      ],
      total: 23.34,
      status: 'pending',
      customerName: '7gjfkbqg76@privaterelay.appleid.com',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      orderNumber: 'GBC- CB3',
      time: '17:22',
      items: [
        { name: 'Chicken Tikka', quantity: 2, price: 12.99 },
        { name: 'Naan Bread', quantity: 1, price: 3.50 }
      ],
      total: 29.48,
      status: 'pending',
      customerName: 'customer@deliveroo.com',
      timestamp: new Date().toISOString(),
    },
    {
      id: '3',
      orderNumber: 'GBC- CB4',
      time: '17:30',
      items: [
        { name: 'Lamb Biryani', quantity: 1, price: 18.99 },
        { name: 'Raita', quantity: 1, price: 3.50 }
      ],
      total: 22.49,
      status: 'completed',
      customerName: 'regular@deliveroo.com',
      timestamp: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    loadOrders();

    // Set up real-time subscription for new orders with restaurant filtering
    const setupSubscription = () => {
      const restaurantUser = supabaseAuth.getCurrentRestaurantUser();
      if (!restaurantUser) {
        console.log('⚠️ No restaurant user found, skipping real-time subscription setup');
        return null;
      }

      console.log('🔄 Setting up restaurant-scoped real-time subscription for home page...');
      console.log('🔍 DEBUG: Subscription filtering by restaurant_uid =', restaurantUser.app_restaurant_uid);

      const subscription = supabase
        .channel('home-orders-channel')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `restaurant_uid=eq.${restaurantUser.app_restaurant_uid}`
          },
          (payload) => {
            console.log('🔔 Real-time order update on home page (restaurant-scoped):', payload);
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
        console.log('🧹 Cleaning up home page real-time subscription');
        subscription.unsubscribe();
      }
    };
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading restaurant-scoped orders from Supabase for home page...');

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

      console.log('✅ Fetched restaurant orders from Supabase for home page:', supabaseOrders?.length || 0);
      console.log('🔍 DEBUG: Filtered orders result:', JSON.stringify(supabaseOrders, null, 2));

      // Transform Supabase data to our Order interface - Updated for new payload format
      const transformedOrders: Order[] = (supabaseOrders || []).map(order => {

        // Check if this is the new payload format (from website)
        if (order.totals && order.amountDisplay) {
          // New payload format - prices are already in pounds
          return {
            id: order.id, // Use actual database ID for updates
            orderNumber: order.orderNumber,
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            items: (order.items || []).map((item: any) => ({
              name: item.title || item.name || 'Unknown Item',
              quantity: item.quantity,
              price: parseFloat(formatOrderPrice(item.price || item.unitPrice, false)) || 0, // Use smart price formatting
              customizations: item.customizations || [] // Include customizations
            })),
            total: parseFloat(formatOrderPrice(order.amount, false)) || 0, // Use smart price formatting
            subtotal: extractSubtotalValue(order), // Extract subtotal from payload
            discount: extractDiscountValue(order), // Extract discount from payload
            status: order.status || 'pending',
            customerName: order.user?.name || 'Walk-in Customer',
            timestamp: new Date().toISOString(),
            notes: ''
          };
        } else {
          // Legacy payload format or test orders - may need conversion from cents
          return {
            id: order.id,
            orderNumber: order.orderNumber || `#${order.id.slice(-6)}`,
            time: order.time || new Date(order.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            items: (order.items || []).map((item: any) => ({
              name: item.title || item.name || 'Unknown Item',
              quantity: item.quantity || 1,
              price: parseFloat(formatOrderPrice(item.price, false)) || 0, // Use smart price formatting
              customizations: item.customizations || [] // Include customizations
            })),
            total: parseFloat(formatOrderPrice(order.amount, false)) || 0, // Use smart price formatting
            subtotal: extractSubtotalValue(order), // Extract subtotal with fallback
            discount: extractDiscountValue(order), // Extract discount with fallback to 0
            status: order.status || 'pending',
            customerName: order.user?.name || 'Walk-in Customer',
            timestamp: order.createdAt || new Date().toISOString(),
            notes: order.notes || ''
          };
        }
      });

      console.log('📋 All orders for home page:', transformedOrders.length);
      setOrders(transformedOrders);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#3b82f6'; // Blue for approved
      case 'pending':
        return '#f59e0b'; // Orange for pending
      case 'completed':
        return '#10b981'; // Green for completed
      case 'cancelled':
        return '#ef4444'; // Red for cancelled
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeTab === 'all') return matchesSearch;

    // TASK 1 FIX: Cancelled tab should ONLY show orders with status = "cancelled"
    if (activeTab === 'cancelled') {
      return matchesSearch && order.status === 'cancelled';
    }

    // For other tabs, match the status exactly
    return matchesSearch && order.status === activeTab;
  });

  const handlePrintReceipt = async (order: Order) => {
    setSelectedOrderForPrint(order);
    setPrintModalVisible(true);
  };

  const printThermalReceipt = async (order: Order) => {
    try {
      console.log('🖨️ Printing compact thermal receipt (80mm)...');

      // Convert order to the format expected by printer service
      const printerOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName || 'Demo Customer',
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
      const printSuccess = await printerService.printReceipt(printerOrder, 'customer');

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
        customerName: order.customerName || 'Demo Customer',
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
      console.log('🖨️ Printing standard receipt...');

      // Convert order to the format expected by printer service
      const printerOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName || 'Demo Customer',
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

      // Print the standard receipt
      const printSuccess = await printerService.printReceipt(printerOrder, 'customer');

      if (printSuccess) {
        console.log('✅ Standard receipt printed successfully');
        Alert.alert('Success', 'Receipt printed successfully!');
      } else {
        console.log('⚠️ Standard print completed (may require manual printer selection)');
        Alert.alert('Print Sent', 'Receipt sent to printer');
      }

    } catch (error) {
      console.error('❌ Standard print error:', error);
      Alert.alert('Print Error', 'Failed to print receipt. Please try again.');
    }
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

  const handleApproveOrder = async (orderId: string) => {
    try {
      console.log('🔄 Approving order and sending update to website:', orderId);

      // Get order details to extract order number
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        Alert.alert('Error', 'Order not found');
        return;
      }

      // Get current restaurant user for restaurant-scoped updates
      const restaurantUser = supabaseAuth.getCurrentRestaurantUser();
      if (!restaurantUser) {
        Alert.alert('Error', 'No restaurant user found. Please log in again.');
        return;
      }

      // FIRST: Update Supabase database with restaurant-scoped filtering
      console.log('🔄 Updating order status in Supabase database...');
      console.log('🔍 DEBUG: Order ID:', orderId);
      console.log('🔍 DEBUG: Order Number:', order.orderNumber);
      console.log('🔍 DEBUG: Restaurant UID:', restaurantUser.app_restaurant_uid);

      const { data: updateData, error: supabaseError } = await supabase
        .from('orders')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('restaurant_uid', restaurantUser.app_restaurant_uid)
        .select();

      if (supabaseError) {
        console.error('❌ Failed to update order status in Supabase:', supabaseError);
        console.error('❌ Supabase error details:', JSON.stringify(supabaseError, null, 2));
        Alert.alert('Error', `Failed to update order status in database: ${supabaseError.message}\n\nPlease try again.`);
        return;
      }

      console.log('✅ Order status updated in Supabase database');
      console.log('✅ Updated rows:', updateData?.length || 0);

      // SECOND: Send status update to website using GBC API
      const statusUpdateResult = await gbcOrderStatusAPI.updateOrderStatus(order.orderNumber, 'approved');

      if (!statusUpdateResult.success) {
        console.warn('⚠️ Failed to send status update to website:', statusUpdateResult.message);
        // Don't fail the entire operation - Supabase is already updated
        Alert.alert(
          'Partial Success',
          `Order approved in database but website notification failed: ${statusUpdateResult.message}\n\nThe order status has been saved and will be synchronized when connection is restored.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Update local state and continue
                updateLocalStateAndNavigate(orderId, 'approved');
              }
            }
          ]
        );
        return;
      }

      console.log('✅ Order approved and website notified successfully');

      // Update local state and navigate
      updateLocalStateAndNavigate(orderId, 'approved');

      // Show success message and redirect to orders page
      Alert.alert(
        'Success',
        'Order approved successfully and website notified! Redirecting to Order Management...',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to orders tab
              router.push('/(tabs)/orders');
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error approving order:', error);
      Alert.alert('Error', 'Failed to approve order. Please try again.');
    }
  };

  // Helper function to update local state and collapse order
  const updateLocalStateAndNavigate = (orderId: string, status: 'approved' | 'cancelled') => {
    // Update local state
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? { ...order, status: status }
          : order
      )
    );

    // Collapse the order after action
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      newSet.delete(orderId);
      return newSet;
    });
  };

  const approveOrderLocally = async (orderId: string) => {
    try {
      console.log('🔄 Approving order locally only:', orderId);

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
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('restaurant_uid', restaurantUser.app_restaurant_uid);

      if (error) {
        console.error('❌ Failed to approve order locally:', error);
        Alert.alert('Error', 'Failed to approve order locally. Please try again.');
        return;
      }

      console.log('✅ Order approved locally');

      // Update local state using helper function
      updateLocalStateAndNavigate(orderId, 'approved');

      Alert.alert(
        'Success',
        'Order approved locally (website not notified). Redirecting to Order Management...',
        [
          {
            text: 'OK',
            onPress: () => {
              router.push('/(tabs)/orders');
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error approving order locally:', error);
      Alert.alert('Error', 'Failed to approve order locally. Please try again.');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      console.log('🔄 Cancelling order and sending update to website:', orderId);

      // Get order details to extract order number
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        Alert.alert('Error', 'Order not found');
        return;
      }

      // Get current restaurant user for restaurant-scoped updates
      const restaurantUser = supabaseAuth.getCurrentRestaurantUser();
      if (!restaurantUser) {
        Alert.alert('Error', 'No restaurant user found. Please log in again.');
        return;
      }

      // FIRST: Update Supabase database with restaurant-scoped filtering
      console.log('🔄 Updating order status in Supabase database...');
      console.log('🔍 DEBUG: Order ID:', orderId);
      console.log('🔍 DEBUG: Order Number:', order.orderNumber);
      console.log('🔍 DEBUG: Restaurant UID:', restaurantUser.app_restaurant_uid);

      const { data: updateData, error: supabaseError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('restaurant_uid', restaurantUser.app_restaurant_uid)
        .select();

      if (supabaseError) {
        console.error('❌ Failed to update order status in Supabase:', supabaseError);
        console.error('❌ Supabase error details:', JSON.stringify(supabaseError, null, 2));
        Alert.alert('Error', `Failed to update order status in database: ${supabaseError.message}\n\nPlease try again.`);
        return;
      }

      console.log('✅ Order status updated in Supabase database');
      console.log('✅ Updated rows:', updateData?.length || 0);

      // SECOND: Send cancel request to website using GBC API
      const result = await gbcOrderStatusAPI.cancelOrder(order.orderNumber, 'Cancelled via kitchen app');

      if (!result.success) {
        console.warn('⚠️ Failed to send cancel request to website:', result.message);
        // Don't fail the entire operation - Supabase is already updated
        Alert.alert(
          'Partial Success',
          `Order cancelled in database but website notification failed: ${result.message}\n\nThe order status has been saved and will be synchronized when connection is restored.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Update local state and continue
                updateLocalStateAndNavigate(orderId, 'cancelled');
              }
            }
          ]
        );
        return;
      }

      console.log('✅ Order cancelled and website notified successfully');

      // Update local state
      updateLocalStateAndNavigate(orderId, 'cancelled');

      Alert.alert('Success', 'Order cancelled successfully!');
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      Alert.alert('Error', 'Failed to cancel order. Please try again.');
    }
  };

  const cancelOrderLocally = async (orderId: string) => {
    try {
      console.log('🔄 Cancelling order locally only:', orderId);

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
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('restaurant_uid', restaurantUser.app_restaurant_uid);

      if (error) {
        console.error('❌ Failed to cancel order locally:', error);
        Alert.alert('Error', 'Failed to cancel order locally. Please try again.');
        return;
      }

      console.log('✅ Order cancelled locally');

      // Update local state using helper function
      updateLocalStateAndNavigate(orderId, 'cancelled');

      Alert.alert('Success', 'Order cancelled locally!');
    } catch (error) {
      console.error('❌ Error cancelling order locally:', error);
      Alert.alert('Error', 'Failed to cancel order locally. Please try again.');
    }
  };

  const closePrintModal = () => {
    setPrintModalVisible(false);
    setSelectedOrderForPrint(null);
  };

  const handlePrintOption = (printFunction: (order: Order) => void) => {
    if (selectedOrderForPrint) {
      printFunction(selectedOrderForPrint);
      closePrintModal();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoImageContainer}>
              {/* Using the exact logo design from your provided image - SVG implementation */}
              <SvgXml xml={GBC_LOGO_SVG} width="70" height="70" />
            </View>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.restaurantTitleMain}>GENERAL BILIMORIA'S</Text>
            <Text style={styles.restaurantTitleSub}>CANTEEN</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search order ID or items"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'all', label: 'All' },
          { key: 'approved', label: 'Approved' },
          { key: 'cancelled', label: 'Cancelled' },
          { key: 'completed', label: 'Completed' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.ordersList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadOrders} />
        }
      >
        {filteredOrders.map((order) => {
          const isExpanded = expandedOrders.has(order.id);
          const canApproveOrCancel = order.status === 'pending';

          return (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => toggleOrderExpansion(order.id)}
              activeOpacity={0.7}
            >
              <View style={styles.orderRow}>
                <View style={styles.orderLeft}>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.orderTime}>{order.time}</Text>
                </View>

                <View style={styles.orderCenter}>
                  {order.items.map((item, index) => (
                    <View key={index}>
                      <Text style={styles.itemText}>
                        {item.quantity}x {item.name} - {formatOrderPrice(item.price)}
                      </Text>
                      {/* Display customizations if available */}
                      {(item as any).customizations && (item as any).customizations.length > 0 && (
                        <Text style={styles.customizationsText}>
                          Customizations: {(item as any).customizations.map((c: any) => c.name).join(', ')}
                        </Text>
                      )}
                    </View>
                  ))}
                  <Text style={styles.totalText}>Total: {formatOrderPrice(order.total)}</Text>
                </View>

                <View style={styles.orderRight}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                  </View>
                  <Text style={styles.orderPrice}>{formatOrderPrice(order.total)}</Text>
                  <TouchableOpacity
                    style={styles.printButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handlePrintReceipt(order);
                    }}
                  >
                    <Ionicons name="print" size={16} color="#F47B20" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Expanded section with approve/cancel buttons */}
              {isExpanded && canApproveOrCancel && (
                <View style={styles.expandedSection}>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleApproveOrder(order.id);
                      }}
                    >
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCancelOrder(order.id);
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {filteredOrders.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        )}
      </ScrollView>

      {/* Custom Print Options Modal */}
      <Modal
        visible={printModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePrintModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Print Receipt Options</Text>
            <Text style={styles.modalSubtitle}>
              Choose print format for order #{selectedOrderForPrint?.orderNumber}:
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.printOptionButton}
                onPress={() => handlePrintOption(printThermalReceipt)}
              >
                <Text style={styles.printOptionButtonText}>Print</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.printOptionButton}
                onPress={() => handlePrintOption(generateReceiptFiles)}
              >
                <Text style={styles.printOptionButtonText}>Generate PNG/PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.printOptionButton}
                onPress={() => handlePrintOption(printStandardReceipt)}
              >
                <Text style={styles.printOptionButtonText}>Standard Print</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closePrintModal}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#F47B20',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  logoContainer: {
    marginRight: 15,
  },
  logoImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },


  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  restaurantTitleMain: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    textAlign: 'center',
    lineHeight: 24,
  },
  restaurantTitleSub: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'normal',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 22,
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#F47B20',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  ordersList: {
    flex: 1,
    padding: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderLeft: {
    width: 80,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  orderCenter: {
    flex: 1,
    paddingHorizontal: 12,
  },
  itemText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 1,
  },
  totalText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  orderRight: {
    alignItems: 'flex-end',
    width: 80,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  orderPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  printButton: {
    padding: 4,
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
  expandedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#3b82f6',
  },
  cancelButton: {
    backgroundColor: '#ef4444', // Red color - reverted back to original
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Custom Print Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    minWidth: 300,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  modalButtons: {
    gap: 12,
  },
  printOptionButton: {
    backgroundColor: '#F47B20',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  printOptionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancelButton: {
    backgroundColor: '#6b7280', // Grey color as requested for print dialog cancel
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  customizationsText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 16,
    marginTop: 2,
  },
});
