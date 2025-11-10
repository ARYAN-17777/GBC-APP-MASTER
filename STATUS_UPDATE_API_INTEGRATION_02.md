# Status Update API Integration Documentation

**Date:** 2025-11-08  
**Version:** GBC Kitchen App v3.1.1  
**API Base URL:** `https://gbcanteen-com.stackstaging.com`  
**Status:** ✅ VERIFIED AND WORKING

---

## 📋 EXECUTIVE SUMMARY

This document provides complete documentation for how the GBC Kitchen App communicates with the website API when status update buttons are clicked. All status transitions (Approve, Cancel, Mark as Ready, Dispatch) send real-time updates to the website via RESTful API endpoints.

### **Key Features:**
- ✅ Dual-update system (Supabase database FIRST, then website API)
- ✅ Retry logic with exponential backoff
- ✅ Offline queue for network failures
- ✅ Idempotency to prevent duplicate updates
- ✅ Format fallback (tries both `#digits` and `digits` formats)
- ✅ Restaurant-scoped multi-tenant isolation

---

## 🌐 API ENDPOINT DETAILS

### **Base Configuration**

```typescript
// File: services/gbc-order-status-api.ts, Lines 12-14
const GBC_API_BASE_URL = 'https://gbcanteen-com.stackstaging.com';
const GBC_API_AUTH = 'Basic Z2JjX2tpdGNoZW46R0JDQEtpdGNoZW4jMjAyNQ==';
```

**Authentication Credentials:**
- **Username:** `gbc_kitchen`
- **Password:** `GBC@Kitchen#2025`
- **Encoding:** Base64 Basic Auth

---

### **Endpoint 1: Order Status Update**

**Purpose:** Update order status for approved, preparing, and ready transitions

#### **Endpoint Details:**
```
POST https://gbcanteen-com.stackstaging.com/api/order-status-update
```

#### **Request Headers:**
```typescript
{
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Basic Z2JjX2tpdGNoZW46R0JDQEtpdGNoZW4jMjAyNQ==',
  'X-Restaurant-UID': '<restaurant_uid>',        // From AsyncStorage
  'X-Order-Number-Digits': '<order_digits>',     // e.g., "12345"
  'X-Idempotency-Key': 'gbc-<timestamp>-<random>' // Unique per request
}
```

#### **Request Payload:**
```json
{
  "order_number": "#12345",
  "order_number_digits": "12345",
  "status": "approved",
  "timestamp": "2025-11-08T10:30:00.000Z",
  "updated_by": "kitchen_app",
  "notes": "Status updated to approved via kitchen app"
}
```

#### **Payload Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `order_number` | string | ✅ Yes | Order number with `#` prefix (e.g., "#12345") |
| `order_number_digits` | string | ✅ Yes | Order number without `#` prefix (e.g., "12345") |
| `status` | string | ✅ Yes | One of: "approved", "preparing", "ready" |
| `timestamp` | string | ✅ Yes | ISO-8601 UTC timestamp |
| `updated_by` | string | ✅ Yes | Always "kitchen_app" |
| `notes` | string | ⚠️ Optional | Human-readable status update message |

#### **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "order_number": "#12345",
    "status": "approved",
    "updated_at": "2025-11-08T10:30:00.000Z"
  }
}
```

#### **Error Response (400/404/500):**
```json
{
  "success": false,
  "message": "Order not found",
  "error": "No order found with number #12345"
}
```

---

### **Endpoint 2: Order Dispatch**

**Purpose:** Dispatch order when ready for delivery/pickup

#### **Endpoint Details:**
```
POST https://gbcanteen-com.stackstaging.com/api/order-dispatch
```

#### **Request Headers:**
Same as Endpoint 1 (see above)

#### **Request Payload:**
```json
{
  "order_number": "#12345",
  "order_number_digits": "12345",
  "status": "dispatched",
  "timestamp": "2025-11-08T11:00:00.000Z",
  "dispatched_by": "kitchen_app",
  "notes": "Order dispatched via kitchen app"
}
```

#### **Payload Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `order_number` | string | ✅ Yes | Order number with `#` prefix |
| `order_number_digits` | string | ✅ Yes | Order number without `#` prefix |
| `status` | string | ✅ Yes | Always "dispatched" |
| `timestamp` | string | ✅ Yes | ISO-8601 UTC timestamp |
| `dispatched_by` | string | ✅ Yes | Always "kitchen_app" |
| `notes` | string | ⚠️ Optional | Dispatch message |

#### **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Order dispatched successfully",
  "data": {
    "order_number": "#12345",
    "status": "dispatched",
    "dispatched_at": "2025-11-08T11:00:00.000Z"
  }
}
```

---

### **Endpoint 3: Order Cancel**

**Purpose:** Cancel order at any status

#### **Endpoint Details:**
```
POST https://gbcanteen-com.stackstaging.com/api/order-cancel
```

#### **Request Headers:**
Same as Endpoint 1, plus:
```typescript
{
  'X-Client': 'GBC-Kitchen/3.1.1'  // Optional client identifier
}
```

#### **Request Payload:**
```json
{
  "order_number": "#12345",
  "order_number_digits": "12345",
  "status": "cancelled",
  "timestamp": "2025-11-08T10:35:00.000Z",
  "cancelled_at": "2025-11-08T10:35:00.000Z",
  "cancelled_by": "kitchen_app",
  "cancel_reason": "Cancelled via kitchen app",
  "notes": "Order cancelled: Cancelled via kitchen app"
}
```

#### **Payload Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `order_number` | string | ✅ Yes | Order number with `#` prefix |
| `order_number_digits` | string | ✅ Yes | Order number without `#` prefix |
| `status` | string | ✅ Yes | Always "cancelled" (double "l") |
| `timestamp` | string | ✅ Yes | ISO-8601 UTC timestamp |
| `cancelled_at` | string | ✅ **REQUIRED** | ISO-8601 UTC timestamp (website requires this) |
| `cancelled_by` | string | ✅ Yes | Always "kitchen_app" |
| `cancel_reason` | string | ⚠️ Optional | Reason for cancellation |
| `notes` | string | ⚠️ Optional | Cancellation message |

**⚠️ IMPORTANT:** The `cancelled_at` field is **REQUIRED** by the website API for cancel requests. The app always includes this field with the same timestamp as `timestamp`.

#### **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "order_number": "#12345",
    "status": "cancelled",
    "cancelled_at": "2025-11-08T10:35:00.000Z"
  }
}
```

---

## 🔘 STATUS BUTTON → API MAPPING

### **1. APPROVE BUTTON** ✅

**Location:** Home Screen (`app/(tabs)/index.tsx`, Lines 468-550)

#### **Button Click Flow:**
```
User clicks "Approve" → handleApproveOrder(orderId) → gbcOrderStatusAPI.updateOrderStatus(orderNumber, 'approved')
```

#### **API Call:**
```typescript
// File: services/gbc-order-status-api.ts, Lines 503-533
async updateOrderStatus(orderNumber: string, status: 'approved', notes?: string) {
  const payload = {
    order_number: "#12345",
    order_number_digits: "12345",
    status: "approved",
    timestamp: "2025-11-08T10:30:00.000Z",
    updated_by: "kitchen_app",
    notes: "Status updated to approved via kitchen app"
  };
  
  const result = await this.makeRequest('/api/order-status-update', payload);
  return result;
}
```

#### **Endpoint Called:**
```
POST https://gbcanteen-com.stackstaging.com/api/order-status-update
```

#### **Console Logs:**
```
🔄 Updating order status: 12345 → approved (using format: #12345)
📡 Response status: 200 for order #12345 (attempt 1)
✅ Success: /api/order-status-update for order #12345
✅ Order status updated in Supabase database
✅ Order approved and website notified successfully
```

---

### **2. CANCEL BUTTON** ✅

**Location:** Home Screen (`app/(tabs)/index.tsx`, Lines 621-690)

#### **Button Click Flow:**
```
User clicks "Cancel" → handleCancelOrder(orderId) → gbcOrderStatusAPI.cancelOrder(orderNumber, 'Cancelled via kitchen app')
```

#### **API Call:**
```typescript
// File: services/gbc-order-status-api.ts, Lines 572-604
async cancelOrder(orderNumber: string, cancelReason?: string) {
  const cancelledAtTimestamp = new Date().toISOString();
  
  const payload = {
    order_number: "#12345",
    order_number_digits: "12345",
    status: "cancelled",
    timestamp: cancelledAtTimestamp,
    cancelled_at: cancelledAtTimestamp,  // ← REQUIRED by website
    cancelled_by: "kitchen_app",
    cancel_reason: "Cancelled via kitchen app",
    notes: "Order cancelled: Cancelled via kitchen app"
  };
  
  const result = await this.makeCancelRequest('/api/order-cancel', payload);
  return result;
}
```

#### **Endpoint Called:**
```
POST https://gbcanteen-com.stackstaging.com/api/order-cancel
```

#### **Console Logs:**
```
❌ Cancelling order: 12345 (using format: #12345) with cancelled_at: 2025-11-08T10:35:00.000Z
📡 Cancel response status: 200 for order #12345 (attempt 1)
✅ Cancel success: /api/order-cancel for order #12345
✅ Order status updated in Supabase database
✅ Order cancelled and website notified successfully
```

---

### **3. MARK AS READY BUTTON** ✅

**Location:** Orders Screen (`app/(tabs)/orders.tsx`, Lines 290-363)

#### **Button Click Flow:**
```
User clicks "Mark as Ready" → updateOrderStatus(orderId, 'ready') → gbcOrderStatusAPI.updateOrderStatus(orderNumber, 'ready')
```

#### **API Call:**
```typescript
// Same as Approve button, but with status: 'ready'
const payload = {
  order_number: "#12345",
  order_number_digits: "12345",
  status: "ready",
  timestamp: "2025-11-08T10:45:00.000Z",
  updated_by: "kitchen_app",
  notes: "Status updated to ready via kitchen app"
};
```

#### **Endpoint Called:**
```
POST https://gbcanteen-com.stackstaging.com/api/order-status-update
```

#### **Console Logs:**
```
🔄 Updating order status: 12345 → ready (using format: #12345)
📡 Response status: 200 for order #12345 (attempt 1)
✅ Success: /api/order-status-update for order #12345
✅ Order marked as ready and website notified!
```

---

### **4. DISPATCH BUTTON** ✅

**Location:** Orders Screen (`app/(tabs)/orders.tsx`, Lines 407-483)

#### **Button Click Flow:**
```
User clicks "Dispatch" → Confirmation Dialog → performDispatch(order) → gbcOrderStatusAPI.dispatchOrder(orderNumber)
```

#### **API Call:**
```typescript
// File: services/gbc-order-status-api.ts, Lines 538-567
async dispatchOrder(orderNumber: string, notes?: string) {
  const payload = {
    order_number: "#12345",
    order_number_digits: "12345",
    status: "dispatched",
    timestamp: "2025-11-08T11:00:00.000Z",
    dispatched_by: "kitchen_app",
    notes: "Order dispatched via kitchen app"
  };
  
  const result = await this.makeRequest('/api/order-dispatch', payload);
  return result;
}
```

#### **Endpoint Called:**
```
POST https://gbcanteen-com.stackstaging.com/api/order-dispatch
```

#### **Console Logs:**
```
🚀 Dispatching order: 12345 (using format: #12345)
📡 Response status: 200 for order #12345 (attempt 1)
✅ Success: /api/order-dispatch for order #12345
✅ Order dispatched successfully
```

---

## 🔄 REQUEST FLOW DOCUMENTATION

### **Complete Flow for Status Update**

#### **Step 1: User Clicks Status Button**
```typescript
// Example: Approve button clicked
<TouchableOpacity onPress={() => handleApproveOrder(order.id)}>
  <Text>Approve</Text>
</TouchableOpacity>
```

#### **Step 2: Update Supabase Database FIRST**
```typescript
// File: app/(tabs)/index.tsx, Lines 487-501
const { error: supabaseError } = await supabase
  .from('orders')
  .update({
    status: 'approved',
    updated_at: new Date().toISOString()
  })
  .eq('id', orderId)
  .eq('restaurant_uid', restaurantUser.app_restaurant_uid);

if (supabaseError) {
  Alert.alert('Error', 'Failed to update order status in database');
  return; // ← STOP if database update fails
}

console.log('✅ Order status updated in Supabase database');
```

**Why Database First?**
- ✅ Ensures local state is always updated
- ✅ Prevents data loss if website API fails
- ✅ Allows offline operation with queue
- ✅ Provides immediate UI feedback

#### **Step 3: Send Status Update to Website API SECOND**
```typescript
// File: app/(tabs)/index.tsx, Lines 505-525
const statusUpdateResult = await gbcOrderStatusAPI.updateOrderStatus(
  order.orderNumber, 
  'approved'
);

if (!statusUpdateResult.success) {
  // Website notification failed, but database is already updated
  Alert.alert(
    'Partial Success',
    'Order approved in database but website notification failed. ' +
    'The order status has been saved and will be synchronized when connection is restored.'
  );
  return;
}

console.log('✅ Order approved and website notified successfully');
```

#### **Step 4: Update UI After Successful Response**
```typescript
// File: app/(tabs)/index.tsx, Lines 553-561
setOrders(prevOrders =>
  prevOrders.map(order =>
    order.id === orderId 
      ? { ...order, status: 'approved' } 
      : order
  )
);

// Collapse the order card
setExpandedOrders(prev => {
  const newSet = new Set(prev);
  newSet.delete(orderId);
  return newSet;
});
```

---

## ⚠️ ERROR HANDLING & RETRY LOGIC

### **HTTP Status Code Handling**

```typescript
// File: services/gbc-order-status-api.ts, Lines 286-317
if (response.ok) {
  // 200-299: Success
  return { success: true, message: 'Request successful', data };
}

if (response.status === 404) {
  // 404: Order not found - Try format fallback
  return { success: false, message: `404 - Order not found` };
}

if (response.status >= 400 && response.status < 500 &&
    response.status !== 408 && response.status !== 429) {
  // 400-499: Client error - Don't retry (except 408, 429)
  return { success: false, message: `Client error: ${response.status}` };
}

// 500-599: Server error - Retry with backoff
```

### **Retry Mechanism**

#### **Exponential Backoff Strategy:**
```typescript
// File: services/gbc-order-status-api.ts, Lines 348-352
private calculateBackoffDelay(attempt: number): number {
  const baseDelay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
  const jitter = Math.random() * 0.4 - 0.2;      // ±20% jitter
  return Math.floor(baseDelay * (1 + jitter));
}
```

**Retry Schedule:**
- **Attempt 1:** Immediate
- **Attempt 2:** Wait 2 seconds (±20% jitter)
- **Attempt 3:** Wait 4 seconds (±20% jitter)
- **Attempt 4:** Wait 8 seconds (±20% jitter)
- **Max Retries:** 3 attempts

#### **Format Fallback:**
If the primary format fails with 404 "Order not found", the app tries the alternate format:

```typescript
// Try #12345 first
const primaryResult = await attemptRequest(url, payload, "#12345");

if (primaryResult.message.includes('404') && 
    primaryResult.message.includes('Order not found')) {
  // Try 12345 (without #) as fallback
  const fallbackResult = await attemptRequest(url, payload, "12345");
  return fallbackResult;
}
```

### **Offline Queue**

When the app is offline, requests are queued for later processing:

```typescript
// File: services/gbc-order-status-api.ts, Lines 609-627
if (!this.isOnline) {
  return this.queueRequest('/api/order-status-update', payload);
}

private async queueRequest(endpoint: string, payload: OrderStatusPayload) {
  const queuedRequest = {
    id: generateIdempotencyKey(),
    endpoint,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0
  };
  
  this.offlineQueue.push(queuedRequest);
  await AsyncStorage.setItem('gbc_offline_queue', JSON.stringify(this.offlineQueue));
  
  return { success: true, message: 'Request queued for offline processing' };
}
```

**Queue Processing:**
- ✅ Requests saved to AsyncStorage
- ✅ Automatically processed when connection restored
- ✅ Failed requests re-queued (except client errors)
- ✅ Idempotency prevents duplicate updates

---

## 🧪 TESTING & VERIFICATION

### **How to Verify Status Updates Are Being Sent**

#### **1. Check Console Logs:**

Look for these log messages in the app console:

**Approve Button:**
```
🔄 Approving order and sending update to website: <orderId>
🔄 Updating order status in Supabase database...
✅ Order status updated in Supabase database
🔄 Updating order status: 12345 → approved (using format: #12345)
📡 Response status: 200 for order #12345 (attempt 1)
✅ Success: /api/order-status-update for order #12345
✅ Order approved and website notified successfully
```

**Cancel Button:**
```
🔄 Cancelling order and sending update to website: <orderId>
🔄 Updating order status in Supabase database...
✅ Order status updated in Supabase database
❌ Cancelling order: 12345 (using format: #12345) with cancelled_at: 2025-11-08T10:35:00.000Z
📡 Cancel response status: 200 for order #12345 (attempt 1)
✅ Cancel success: /api/order-cancel for order #12345
✅ Order cancelled and website notified successfully
```

**Mark as Ready Button:**
```
🔄 Updating order status in Supabase: <orderId> ready
🔄 Updating order status: 12345 → ready (using format: #12345)
📡 Response status: 200 for order #12345 (attempt 1)
✅ Success: /api/order-status-update for order #12345
✅ Order status updated and website notified successfully
```

**Dispatch Button:**
```
🚀 Starting dispatch process for order: #12345
🚀 Dispatching order: 12345 (using format: #12345)
📡 Response status: 200 for order #12345 (attempt 1)
✅ Success: /api/order-dispatch for order #12345
✅ Order dispatched successfully
```

#### **2. Check Website API Logs:**

On the website server, look for incoming POST requests to:
- `/api/order-status-update`
- `/api/order-dispatch`
- `/api/order-cancel`

Verify the request headers include:
- `Authorization: Basic Z2JjX2tpdGNoZW46R0JDQEtpdGNoZW4jMjAyNQ==`
- `X-Restaurant-UID: <restaurant_uid>`
- `X-Order-Number-Digits: <order_digits>`
- `X-Idempotency-Key: gbc-<timestamp>-<random>`

#### **3. Check Supabase Database:**

Query the `orders` table to verify status was updated:

```sql
SELECT id, orderNumber, status, updated_at, dispatched_at
FROM orders
WHERE orderNumber = '12345'
ORDER BY updated_at DESC
LIMIT 1;
```

Expected result:
- `status` should match the button clicked
- `updated_at` should be recent timestamp
- `dispatched_at` should be set (for dispatched orders only)

---

### **Troubleshooting Common Issues**

#### **Issue 1: "Failed to update order status in database"**

**Cause:** Supabase database update failed  
**Solution:**
- Check restaurant UID is correct
- Verify order exists in database
- Check network connection to Supabase
- Verify Supabase credentials are valid

#### **Issue 2: "Failed to send status update to website"**

**Cause:** Website API call failed  
**Solution:**
- Check network connection
- Verify website API is online (`https://gbcanteen-com.stackstaging.com`)
- Check authentication credentials
- Look for specific error in console logs
- Request will be queued and retried automatically

#### **Issue 3: "Order not found" (404 error)**

**Cause:** Order number format mismatch  
**Solution:**
- App automatically tries both `#12345` and `12345` formats
- Check website database for order number format
- Verify order exists on website

#### **Issue 4: "Missing required fields" (400 error for cancel)**

**Cause:** `cancelled_at` field missing from cancel request  
**Solution:**
- App always includes `cancelled_at` field (Lines 584, 420)
- Check website API expects this field
- Verify timestamp is ISO-8601 format

---

## ✅ VERIFICATION SUMMARY

### **Implementation Status:**

- ✅ **Approve Button** - Sends to `/api/order-status-update` with status "approved"
- ✅ **Cancel Button** - Sends to `/api/order-cancel` with status "cancelled" and `cancelled_at`
- ✅ **Mark as Ready Button** - Sends to `/api/order-status-update` with status "ready"
- ✅ **Dispatch Button** - Sends to `/api/order-dispatch` with status "dispatched"
- ✅ **Database First** - All buttons update Supabase before calling website API
- ✅ **Error Handling** - Graceful fallback when website API fails
- ✅ **Retry Logic** - Exponential backoff with 3 attempts
- ✅ **Offline Queue** - Requests queued when offline
- ✅ **Idempotency** - Unique keys prevent duplicate updates
- ✅ **Format Fallback** - Tries both `#digits` and `digits` formats
- ✅ **Restaurant Isolation** - Multi-tenant scoped updates

---

**Documentation Status:** ✅ **COMPLETE**  
**API Integration Status:** ✅ **VERIFIED AND WORKING**  
**Last Updated:** 2025-11-08
