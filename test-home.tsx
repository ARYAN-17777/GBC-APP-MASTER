import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Simple test component to verify our home page design
export default function TestHome() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good Afternoon,</Text>
        <Text style={styles.restaurantTitle}>Bilimoria's Canteen</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search order ID</Text>
        </View>
      </View>
      
      <View style={styles.tabsContainer}>
        <Text style={styles.tab}>All</Text>
        <Text style={styles.activeTab}>Active</Text>
        <Text style={styles.tab}>History</Text>
        <Text style={styles.tab}>New</Text>
      </View>
      
      <View style={styles.orderCard}>
        <View style={styles.orderRow}>
          <View style={styles.orderLeft}>
            <Text style={styles.orderNumber}>#001</Text>
            <Text style={styles.orderTime}>14:16</Text>
          </View>
          
          <View style={styles.orderCenter}>
            <Text style={styles.itemText}>1x Paneer Pudina</Text>
            <Text style={styles.itemText}>1x Lamb Seekh</Text>
            <Text style={styles.totalText}>Total: £34.98</Text>
          </View>
          
          <View style={styles.orderRight}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Active</Text>
            </View>
            <Text style={styles.orderPrice}>£34.98</Text>
          </View>
        </View>
      </View>
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
    padding: 20,
    paddingTop: 50,
  },
  greeting: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '400',
  },
  restaurantTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 2,
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
    fontSize: 16,
    marginRight: 10,
    color: '#666',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#999',
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
    fontSize: 14,
    color: '#666',
  },
  activeTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#007bff',
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 12,
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
    backgroundColor: '#dc2626',
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
  },
});
