# GBC Kitchen App - API Integration Verification

**Date:** 2025-11-08  
**Task:** Verify status update API integration with website  
**Status:** ✅ **VERIFIED - READY TO TEST**

---

## 🎯 API ENDPOINT VERIFICATION

### **Base Configuration**

✅ **Base URL:** `https://gbcanteen-com.stackstaging.com`  
✅ **Authentication:** Basic Auth  
✅ **Username:** `gbc_kitchen`  
✅ **Password:** `GBC@Kitchen#2025`  
✅ **Auth Header:** `Authorization: Basic Z2JjX2tpdGNoZW46R0JDQEtpdGNoZW4jMjAyNQ==`

**Code Location:** `services/gbc-order-status-api.ts` (Lines 13-14)

```typescript
const GBC_API_BASE_URL = 'https://gbcanteen-com.stackstaging.com';
const GBC_API_AUTH = 'Basic Z2JjX2tpdGNoZW46R0JDQEtpdGNoZW4jMjAyNQ==';
```

---

## 📡 ENDPOINT 1: UPDATE STATUS

### **API Specification (Website)**

**Endpoint:** `POST /api/order-status-update`

**Request Headers:**
```json
{
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": "Basic Z2JjX2tpdGNoZW46R0JDQEtpdGNoZW4jMjAyNQ=="
}
```

**Request Body:**
```json
{
  "order_number": "#100070",
  "status": "approved",
  "timestamp": "2025-10-07T10:45:00.000Z",
  "updated_by": "kitchen_app",
  "notes": "Approved by chef"
}
```

**Success Response (200):**
```json
{
  "message": "Order status updated successfully",
  "order_id": 52,
  "order_number": "#100070",
  "timestamp": "2025-10-07T10:45:00.000Z",
  "data": {
    "previous_status": "approved",
    "new_status": "ready",
    "updated_at": "2025-10-07 10:45:00",
    "db": "gbcfood_db-353131392768",
    "host": "shareddb46.lhr.stackcp.net"
  },
  "success": true
}
```

### **App Implementation**

**Code Location:** `services/gbc-order-status-api.ts` (Lines 517-547)

```typescript
async updateOrderStatus(
  orderNumber: string,
  status: 'approved' | 'preparing' | 'ready',
  notes?: string
): Promise<ApiResponse> {
  const { digits, hashForm } = this.canonicalizeOrderId(orderNumber);

  const payload: OrderStatusPayload = {
    order_number: hashForm,           // ✅ Sends "#100070" format
    order_number_digits: digits,      // ✅ Sends "100070" as backup
    status,                           // ✅ 'approved', 'preparing', or 'ready'
    timestamp: new Date().toISOString(), // ✅ ISO-8601 UTC format
    updated_by: 'kitchen_app',        // ✅ Matches API spec
    notes: notes || `Status updated to ${status} via kitchen app`,
  };

  const result = await this.makeRequest('/api/order-status-update', payload);
  
  if (result.success) {
    await this.updateLocalDatabase(digits, status);
  }
  
  return result;
}
```

### **Verification Checklist**

- ✅ **Endpoint:** `/api/order-status-update` (matches website spec)
- ✅ **Method:** POST (correct)
- ✅ **Headers:** Content-Type, Accept, Authorization (all correct)
- ✅ **order_number:** Sends `#100070` format (with hash prefix)
- ✅ **status:** Sends 'approved', 'preparing', or 'ready' (valid values)
- ✅ **timestamp:** ISO-8601 UTC format `YYYY-MM-DDTHH:mm:ss.sssZ` (correct)
- ✅ **updated_by:** Sends 'kitchen_app' (matches spec)
- ✅ **notes:** Optional notes field (correct)
- ✅ **Retry Logic:** 3 attempts with exponential backoff (robust)
- ✅ **Format Fallback:** Tries both `#100070` and `100070` formats (smart)

---

## 📡 ENDPOINT 2: DISPATCH ORDER

### **API Specification (Website)**

**Endpoint:** `POST /api/order-dispatch`

**Request Body:**
```json
{
  "order_number": "#100070",
  "status": "dispatched",
  "timestamp": "2025-10-07T11:05:00.000Z",
  "dispatched_by": "kitchen_app",
  "notes": "Picked up by rider #DX12"
}
```

**Success Response (200):**
```json
{
  "message": "Order dispatched successfully",
  "order_id": 52,
  "order_number": "100070",
  "timestamp": "2025-10-07T11:05:00.000Z",
  "data": {
    "previous_status": "ready",
    "new_status": "dispatched",
    "updated_at": "2025-10-07 11:05:00",
    "db": "gbcfood_db-353131392768",
    "host": "shareddb46.lhr.stackcp.net"
  },
  "success": true
}
```

### **App Implementation**

**Code Location:** `services/gbc-order-status-api.ts` (Lines 552-581)

```typescript
async dispatchOrder(
  orderNumber: string,
  notes?: string
): Promise<ApiResponse> {
  const { digits, hashForm } = this.canonicalizeOrderId(orderNumber);

  const payload: OrderStatusPayload = {
    order_number: hashForm,           // ✅ Sends "#100070" format
    order_number_digits: digits,      // ✅ Sends "100070" as backup
    status: 'dispatched',             // ✅ Correct status
    timestamp: new Date().toISOString(), // ✅ ISO-8601 UTC format
    dispatched_by: 'kitchen_app',     // ✅ Matches API spec
    notes: notes || `Order dispatched via kitchen app`,
  };

  const result = await this.makeRequest('/api/order-dispatch', payload);
  
  if (result.success) {
    await this.updateLocalDatabase(digits, 'dispatched');
  }
  
  return result;
}
```

### **Verification Checklist**

- ✅ **Endpoint:** `/api/order-dispatch` (matches website spec)
- ✅ **Method:** POST (correct)
- ✅ **order_number:** Sends `#100070` format (correct)
- ✅ **status:** Sends 'dispatched' (correct)
- ✅ **timestamp:** ISO-8601 UTC format (correct)
- ✅ **dispatched_by:** Sends 'kitchen_app' (matches spec)
- ✅ **notes:** Optional notes field (correct)

---

## 📡 ENDPOINT 3: CANCEL ORDER

### **API Specification (Website)**

**Endpoint:** `POST /api/order-cancel`

**Request Body:**
```json
{
  "order_number": "#100070",
  "status": "cancelled",
  "cancelled_at": "2025-10-09T13:15:00.000Z",
  "cancel_reason": "Customer changed mind"
}
```

**Success Response (200):**
```json
{
  "message": "Order cancelled successfully",
  "order_id": "71",
  "order_number": "#100071",
  "cancelled_at": "2025-10-09 13:15:00",
  "cancel_reason": "Customer changed mind",
  "data": {
    "previous_status": "pending",
    "new_status": "cancelled",
    "db": "onlinefoodphp",
    "host": "AVHAD-PC-DEVELOPER"
  },
  "success": true
}
```

### **App Implementation**

**Code Location:** `services/gbc-order-status-api.ts` (Lines 586-618)

```typescript
async cancelOrder(
  orderNumber: string,
  cancelReason?: string
): Promise<ApiResponse> {
  const { digits, hashForm } = this.canonicalizeOrderId(orderNumber);
  const cancelledAtTimestamp = new Date().toISOString();

  const payload: OrderStatusPayload = {
    order_number: hashForm,           // ✅ Sends "#100070" format
    order_number_digits: digits,      // ✅ Sends "100070" as backup
    status: 'cancelled',              // ✅ Correct spelling (double 'l')
    timestamp: cancelledAtTimestamp,  // ✅ Backward compatibility
    cancelled_at: cancelledAtTimestamp, // ✅ Required by website API
    cancelled_by: 'kitchen_app',      // ✅ Identifies source
    cancel_reason: cancelReason || '', // ✅ Empty string if no reason
    notes: `Order cancelled: ${cancelReason || 'No reason provided'}`,
  };

  const result = await this.makeCancelRequest('/api/order-cancel', payload);
  
  if (result.success) {
    await this.updateLocalDatabase(digits, 'cancelled');
  }
  
  return result;
}
```

### **Verification Checklist**

- ✅ **Endpoint:** `/api/order-cancel` (matches website spec)
- ✅ **Method:** POST (correct)
- ✅ **order_number:** Sends `#100070` format (correct)
- ✅ **status:** Sends 'cancelled' (correct spelling with double 'l')
- ✅ **cancelled_at:** ISO-8601 UTC format (required by website)
- ✅ **cancel_reason:** Sends reason or empty string (correct)
- ✅ **cancelled_by:** Sends 'kitchen_app' (identifies source)
- ✅ **Special Cancel Logic:** Uses `makeCancelRequest()` with format fallback

---

## 🔧 ADVANCED FEATURES

### **1. Order Number Format Handling**

The app intelligently handles both order number formats:

**Code Location:** `services/gbc-order-status-api.ts` (Lines 57-61)

```typescript
private canonicalizeOrderId(orderNumber: string): { digits: string; hashForm: string } {
  const digits = orderNumber.startsWith('#') ? orderNumber.substring(1) : orderNumber;
  const hashForm = `#${digits}`;
  return { digits, hashForm };
}
```

**Examples:**
- Input: `"#100070"` → Output: `{ digits: "100070", hashForm: "#100070" }`
- Input: `"100070"` → Output: `{ digits: "100070", hashForm: "#100070" }`

**Fallback Strategy:**
1. Try primary format (e.g., `#100070`)
2. If 404 error, try fallback format (e.g., `100070`)
3. Cache successful format for future requests

### **2. Timestamp Format**

**ISO-8601 UTC Format:** `YYYY-MM-DDTHH:mm:ss.sssZ`

**Code:**
```typescript
timestamp: new Date().toISOString()
```

**Example Output:** `"2025-11-08T14:30:45.123Z"`

**Breakdown:**
- `2025` - 4-digit year
- `11` - 2-digit month (01-12)
- `08` - 2-digit day (01-31)
- `T` - Time separator
- `14` - 2-digit hour (00-23)
- `30` - 2-digit minute (00-59)
- `45` - 2-digit seconds (00-59)
- `.123` - Milliseconds
- `Z` - UTC timezone indicator

✅ **Matches website specification exactly**

### **3. Retry Logic with Exponential Backoff**

**Code Location:** `services/gbc-order-status-api.ts` (Lines 362-366)

```typescript
private calculateBackoffDelay(attempt: number): number {
  const baseDelay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
  const jitter = Math.random() * 0.4 - 0.2; // ±20% jitter
  return Math.floor(baseDelay * (1 + jitter));
}
```

**Retry Schedule:**
- Attempt 1: Immediate
- Attempt 2: ~2 seconds delay (±20% jitter)
- Attempt 3: ~4 seconds delay (±20% jitter)
- Attempt 4: ~8 seconds delay (±20% jitter)

### **4. Error Handling**

**400 Errors:** Missing or invalid fields → No retry, return error immediately  
**404 Errors:** Order not found → Try fallback format, then return error  
**408/429 Errors:** Timeout/Rate limit → Retry with backoff  
**500 Errors:** Server error → Retry with backoff  
**Network Errors:** Connection issues → Retry with backoff

### **5. Offline Queue**

If the app is offline, requests are queued and processed when connectivity is restored.

**Code Location:** `services/gbc-order-status-api.ts` (Lines 623-641)

---

## 🧪 TESTING GUIDE

### **Test Orders Available:**
- `#100047`
- `#100048`
- `#100049`
- `#100050`
- `#100051`
- `#100052`

### **Test Case 1: Approve Order**

1. Open GBC Kitchen App
2. Find order `#100047` in pending orders
3. Click **"Approve"** button
4. Expected behavior:
   - ✅ App sends `POST /api/order-status-update` with:
     ```json
     {
       "order_number": "#100047",
       "status": "approved",
       "timestamp": "2025-11-08T...",
       "updated_by": "kitchen_app"
     }
     ```
   - ✅ Website responds with 200 success
   - ✅ Local database updated
   - ✅ Order moves to "Orders" tab
   - ✅ Success alert shown

### **Test Case 2: Mark as Ready**

1. Go to "Orders" tab
2. Find approved order `#100047`
3. Click **"Mark as Ready"** button
4. Expected behavior:
   - ✅ App sends `POST /api/order-status-update` with `status: "ready"`
   - ✅ Website responds with 200 success
   - ✅ Order status updated to "ready"

### **Test Case 3: Dispatch Order**

1. Find ready order `#100047`
2. Click **"Dispatch"** button
3. Expected behavior:
   - ✅ App sends `POST /api/order-dispatch` with `status: "dispatched"`
   - ✅ Website responds with 200 success
   - ✅ Order marked as dispatched

### **Test Case 4: Cancel Order**

1. Find any order
2. Click **"Cancel"** button
3. Enter cancel reason (optional)
4. Expected behavior:
   - ✅ App sends `POST /api/order-cancel` with:
     ```json
     {
       "order_number": "#100047",
       "status": "cancelled",
       "cancelled_at": "2025-11-08T...",
       "cancel_reason": "..."
     }
     ```
   - ✅ Website responds with 200 success
   - ✅ Order marked as cancelled

---

## ✅ VERIFICATION SUMMARY

### **Configuration:**
- ✅ Base URL: `https://gbcanteen-com.stackstaging.com`
- ✅ Auth: Basic `Z2JjX2tpdGNoZW46R0JDQEtpdGNoZW4jMjAyNQ==`
- ✅ Headers: Content-Type, Accept, Authorization (all correct)

### **Endpoints:**
- ✅ `/api/order-status-update` - Approve, Preparing, Ready
- ✅ `/api/order-dispatch` - Dispatch orders
- ✅ `/api/order-cancel` - Cancel orders

### **Payload Format:**
- ✅ `order_number`: `#100070` format (with hash)
- ✅ `status`: Correct values for each endpoint
- ✅ `timestamp`: ISO-8601 UTC format
- ✅ `cancelled_at`: ISO-8601 UTC format (for cancel)
- ✅ All required fields present

### **Advanced Features:**
- ✅ Order number format fallback (`#100070` ↔ `100070`)
- ✅ Retry logic with exponential backoff
- ✅ Offline queue for failed requests
- ✅ Local database sync
- ✅ Comprehensive error handling

---

## 🎯 CONCLUSION

**Status:** ✅ **API INTEGRATION VERIFIED**

The GBC Kitchen App is correctly configured to communicate with the website API:

1. ✅ **All endpoints match** website specification
2. ✅ **All payload fields correct** (order_number, status, timestamp, etc.)
3. ✅ **Timestamp format correct** (ISO-8601 UTC)
4. ✅ **Authentication correct** (Basic Auth header)
5. ✅ **Retry logic implemented** (3 attempts with backoff)
6. ✅ **Format fallback implemented** (handles both `#100070` and `100070`)
7. ✅ **Error handling robust** (400, 404, 500 errors handled)
8. ✅ **Offline support** (queues requests when offline)

**Ready to test with real orders!** 🚀

---

**Last Updated:** 2025-11-08  
**Next Step:** Build APK and test with orders #100047-#100052
