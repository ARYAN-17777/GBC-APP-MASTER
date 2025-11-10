# GBC Kitchen App - Order Status Update System Documentation (Version 2)

## Overview
This document details the complete order status update system implementation in the GBC Kitchen App, including API integration, button mappings, error handling, and troubleshooting procedures.

## System Architecture

### API Integration
- **Base URL**: `https://gbcanteen-com.stackstaging.com`
- **Authentication**: Basic Auth `Z2JjX2tpdGNoZW46R0JDQEtpdGNoZW4jMjAyNQ==`
- **Service File**: `services/gbc-order-status-api.ts`
- **Import**: `import gbcOrderStatusAPI from '../../services/gbc-order-status-api'`

### API Endpoints

#### 1. Order Status Update Endpoint
- **URL**: `POST /api/order-status-update`
- **Purpose**: Update order status for approved, preparing, and ready states
- **Payload**:
```json
{
  "order_number": "12345",
  "order_number_digits": "12345",
  "status": "approved|preparing|ready",
  "timestamp": "2025-10-31T12:00:00.000Z",
  "updated_by": "restaurant-uid",
  "notes": "Optional notes"
}
```

#### 2. Order Dispatch Endpoint
- **URL**: `POST /api/order-dispatch`
- **Purpose**: Mark order as dispatched
- **Payload**:
```json
{
  "order_number": "12345",
  "order_number_digits": "12345",
  "status": "dispatched",
  "timestamp": "2025-10-31T12:00:00.000Z",
  "dispatched_by": "restaurant-uid",
  "notes": "Optional notes"
}
```

#### 3. Order Cancel Endpoint
- **URL**: `POST /api/order-cancel`
- **Purpose**: Cancel an order
- **Payload**:
```json
{
  "order_number": "12345",
  "order_number_digits": "12345",
  "status": "cancelled",
  "timestamp": "2025-10-31T12:00:00.000Z",
  "cancelled_at": "2025-10-31T12:00:00.000Z",
  "cancelled_by": "restaurant-uid",
  "cancel_reason": "Reason for cancellation"
}
```

## Button Mappings

### Home Screen (`app/(tabs)/index.tsx`)

#### Approve Button
- **Handler**: `handleApproveOrder(orderId: string)`
- **API Call**: `gbcOrderStatusAPI.updateOrderStatus(order.orderNumber, 'approved')`
- **Local Update**: Updates Supabase `orders` table status to 'approved'
- **UI Location**: Pending orders section, right side of order card

#### Cancel Button
- **Handler**: `handleCancelOrder(orderId: string)`
- **API Call**: `gbcOrderStatusAPI.cancelOrder(order.orderNumber, 'Cancelled via kitchen app')`
- **Local Update**: Updates Supabase `orders` table status to 'cancelled'
- **UI Location**: Pending orders section, right side of order card

### Orders Screen (`app/(tabs)/orders.tsx`)

#### Preparing Button
- **Handler**: Status update handler with `newStatus = 'preparing'`
- **API Call**: `gbcOrderStatusAPI.updateOrderStatus(order.orderNumber, 'preparing')`
- **Local Update**: Updates Supabase `orders` table status to 'preparing'
- **UI Location**: Approved orders section

#### Ready Button
- **Handler**: Status update handler with `newStatus = 'ready'`
- **API Call**: `gbcOrderStatusAPI.updateOrderStatus(order.orderNumber, 'ready')`
- **Local Update**: Updates Supabase `orders` table status to 'ready'
- **UI Location**: Preparing orders section

#### Dispatch Button
- **Handler**: `handleDispatchOrder(order)`
- **API Call**: `gbcOrderStatusAPI.dispatchOrder(order.orderNumber)`
- **Local Update**: Updates Supabase `orders` table status to 'dispatched'
- **UI Location**: Ready orders section

## Reliability Features

### 1. Retry Logic
- **Max Attempts**: 3 retries per request
- **Backoff Strategy**: Exponential backoff with jitter (±20%)
- **Base Delay**: 1000ms, 2000ms, 4000ms
- **No Retry Conditions**: 4xx client errors (except 408, 429)

### 2. Offline Queue
- **Storage**: AsyncStorage persistent queue
- **Auto-Retry**: Processes queue when connectivity restored
- **Queue Key**: `gbc_order_status_offline_queue`
- **Max Queue Size**: 100 requests

### 3. Idempotency
- **Header**: `X-Idempotency-Key`
- **Format**: `{restaurant_uid}-{order_number}-{status}-{timestamp}`
- **Purpose**: Prevents duplicate status updates

### 4. Order Number Normalization
- **Function**: `canonicalizeOrderId(orderNumber)`
- **Removes**: Hash prefix (#) from order numbers
- **Returns**: Both digits-only and hash-prefixed versions
- **Caching**: Format preference cached per successful request

## Error Handling

### API Response Codes
- **200**: Success - Status updated successfully
- **400**: Bad Request - Invalid payload or missing fields
- **401**: Unauthorized - Authentication failed
- **404**: Not Found - Order not found on website
- **429**: Rate Limited - Too many requests
- **500**: Server Error - Website internal error

### Error Recovery
1. **Network Errors**: Automatic retry with exponential backoff
2. **4xx Errors**: No retry, user notification
3. **5xx Errors**: Retry with backoff
4. **Timeout**: Retry with increased timeout

### User Notifications
- **Success**: Silent operation, status updated in UI
- **Partial Failure**: Alert showing local update succeeded, website update failed
- **Complete Failure**: Alert with error message and retry suggestion

## Testing Results

### Functionality Test (Latest)
- ✅ API service implementation verified
- ✅ All button handlers properly connected
- ✅ Live API connectivity confirmed
- ✅ Authentication working correctly
- ✅ Error responses handled appropriately

### Button Integration Test
- ✅ Approve button: `handleApproveOrder()` → `updateOrderStatus('approved')`
- ✅ Cancel button: `handleCancelOrder()` → `cancelOrder()`
- ✅ Preparing button: Status handler → `updateOrderStatus('preparing')`
- ✅ Ready button: Status handler → `updateOrderStatus('ready')`
- ✅ Dispatch button: `handleDispatchOrder()` → `dispatchOrder()`

## Troubleshooting

### Common Issues

#### 1. Status Update Not Reaching Website
**Symptoms**: Local status updates but website doesn't reflect changes
**Causes**: 
- Network connectivity issues
- Authentication problems
- Order number format mismatch
**Solutions**:
- Check network connection
- Verify API credentials in `gbc-order-status-api.ts`
- Check order number normalization

#### 2. Button Not Responding
**Symptoms**: Button press doesn't trigger any action
**Causes**:
- Handler not connected
- JavaScript errors in handler
- Missing API import
**Solutions**:
- Check console logs for errors
- Verify handler is called in button `onPress`
- Ensure `gbcOrderStatusAPI` is imported

#### 3. Partial Updates (Local Only)
**Symptoms**: Status updates in app but not on website
**Causes**:
- API endpoint unreachable
- Authentication failure
- Order not found on website
**Solutions**:
- Check offline queue in AsyncStorage
- Verify order exists on website
- Test API connectivity manually

### Debug Commands

#### Check Offline Queue
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
const queue = await AsyncStorage.getItem('gbc_order_status_offline_queue');
console.log('Offline queue:', JSON.parse(queue || '[]'));
```

#### Test API Connectivity
```javascript
const result = await gbcOrderStatusAPI.updateOrderStatus('TEST123', 'approved');
console.log('API test result:', result);
```

#### Clear Offline Queue
```javascript
await AsyncStorage.removeItem('gbc_order_status_offline_queue');
```

## Implementation Status
- ✅ **API Integration**: Complete and functional
- ✅ **Button Handlers**: All connected and working
- ✅ **Error Handling**: Comprehensive implementation
- ✅ **Offline Support**: Queue and retry mechanisms active
- ✅ **Documentation**: Complete with troubleshooting guide
- ✅ **Testing**: Verified functionality and connectivity

## Next Steps
1. Monitor production usage for any edge cases
2. Add analytics for status update success rates
3. Consider adding user feedback for failed updates
4. Implement status update history logging
