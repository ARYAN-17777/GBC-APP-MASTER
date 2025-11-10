# 🔄 Order Status Update API Integration - Complete Documentation

## 📋 **OVERVIEW**

This documentation covers the complete API integration for order status updates between the GBC Kitchen App and the website. The app now sends real-time status updates for **Approve** and **Mark as Ready** actions, in addition to the existing **Dispatch** functionality.

## 🔗 **API ENDPOINTS REQUIRED**

### **1. Order Status Update Endpoint**
- **URL**: `/api/order-status-update`
- **Method**: `POST`
- **Purpose**: Handle approve and mark-as-ready status updates
- **Authentication**: Bearer token (Supabase service role key)

### **2. Order Dispatch Endpoint (Existing)**
- **URL**: `/api/order-dispatch`
- **Method**: `POST`
- **Purpose**: Handle order dispatch notifications
- **Authentication**: Bearer token (Supabase service role key)

---

## 📡 **API REQUEST FORMATS**

### **Status Update Request (NEW)**

**Endpoint**: `POST /api/order-status-update`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <supabase-service-role-key>
Accept: application/json
User-Agent: GBC-Kitchen-App/3.1.1
X-Status-Update-Attempt: 1
X-Update-Type: status-change
```

**Request Body**:
```json
{
  "order_id": "order_123",
  "status": "approved",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "updated_by": "kitchen_app",
  "app_version": "3.1.1",
  "previous_status": "pending",
  "notes": "Status updated from pending to approved via kitchen app"
}
```

**Status Values**:
- `"approved"` - Order approved by kitchen staff
- `"ready"` - Order prepared and ready for pickup/dispatch

### **Dispatch Request (Existing)**

**Endpoint**: `POST /api/order-dispatch`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <supabase-service-role-key>
Accept: application/json
User-Agent: GBC-Kitchen-App/3.1.1
X-Dispatch-Attempt: 1
```

**Request Body**:
```json
{
  "order_id": "order_123",
  "status": "dispatched",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "dispatched_by": "kitchen_app",
  "app_version": "3.1.1",
  "notes": "Order dispatched via kitchen app"
}
```

---

## 📨 **API RESPONSE FORMATS**

### **Success Response (200)**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "order_id": "order_123",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "data": {
    "previous_status": "pending",
    "new_status": "approved",
    "updated_at": "2024-01-15T14:30:00.000Z"
  }
}
```

### **Error Response (400/500)**
```json
{
  "success": false,
  "message": "Order not found",
  "error_code": "ORDER_NOT_FOUND",
  "timestamp": "2024-01-15T14:30:00.000Z"
}
```

---

## 🔐 **AUTHENTICATION**

### **Bearer Token**
- **Token**: Supabase service role key
- **Format**: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Validation**: Website must validate this token for security

### **Security Requirements**
- HTTPS-only communication
- Token validation on every request
- Request rate limiting recommended
- IP whitelisting optional but recommended

---

## 🔄 **ORDER STATUS FLOW**

### **Complete Workflow**
```
Website Order → pending → approved → preparing → ready → dispatched → delivered
                   ↑         ↑         ↑         ↑
                   |         |         |         |
              [Approve]  [Auto]   [Mark Ready] [Dispatch]
               Button              Button      Button
                 |                   |          |
            Status Update      Status Update  Dispatch
               API               API          API
```

### **Kitchen App Actions**
1. **Approve Order**: `pending` → `approved` (sends to status update API)
2. **Auto Transition**: `approved` → `preparing` (automatic in kitchen view)
3. **Mark as Ready**: `preparing` → `ready` (sends to status update API)
4. **Dispatch Order**: `ready` → `dispatched` (sends to dispatch API)

---

## 🛠️ **WEBSITE IMPLEMENTATION REQUIREMENTS**

### **1. Create Status Update Endpoint**

**PHP Example**:
```php
<?php
// /api/order-status-update.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Validate Bearer token
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid authorization header']);
    exit();
}

$token = $matches[1];
$expectedToken = 'your-supabase-service-role-key';

if ($token !== $expectedToken) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid token']);
    exit();
}

// Parse request body
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    exit();
}

// Validate required fields
$required = ['order_id', 'status', 'timestamp'];
foreach ($required as $field) {
    if (!isset($input[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Missing field: $field"]);
        exit();
    }
}

// Validate status values
$validStatuses = ['approved', 'ready'];
if (!in_array($input['status'], $validStatuses)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid status value']);
    exit();
}

// Update order in database
try {
    $pdo = new PDO('mysql:host=localhost;dbname=your_db', $username, $password);
    
    // Check if order exists
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$input['order_id']]);
    $order = $stmt->fetch();
    
    if (!$order) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Order not found']);
        exit();
    }
    
    // Update order status
    $stmt = $pdo->prepare("
        UPDATE orders 
        SET status = ?, 
            updated_at = ?,
            kitchen_notes = ?
        WHERE id = ?
    ");
    
    $result = $stmt->execute([
        $input['status'],
        $input['timestamp'],
        $input['notes'] ?? '',
        $input['order_id']
    ]);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Order status updated successfully',
            'order_id' => $input['order_id'],
            'timestamp' => $input['timestamp'],
            'data' => [
                'previous_status' => $order['status'],
                'new_status' => $input['status'],
                'updated_at' => $input['timestamp']
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database update failed']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
```

### **2. Database Schema Updates**

**Required Columns**:
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kitchen_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ready_by VARCHAR(100) NULL;

-- Update status enum to include new values
ALTER TABLE orders MODIFY COLUMN status ENUM(
    'pending', 
    'approved', 
    'preparing', 
    'ready', 
    'dispatched', 
    'delivered', 
    'cancelled'
);
```

### **3. Customer Notification Integration**

**Status Change Notifications**:
- **Order Approved**: "Your order has been approved and is being prepared"
- **Order Ready**: "Your order is ready for pickup/delivery"
- **Order Dispatched**: "Your order is on its way"

---

## 🧪 **TESTING**

### **Test Status Update Endpoint**
```bash
curl -X POST https://your-website.com/api/order-status-update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-supabase-service-role-key" \
  -d '{
    "order_id": "test_order_123",
    "status": "approved",
    "timestamp": "2024-01-15T14:30:00.000Z",
    "updated_by": "kitchen_app",
    "app_version": "3.1.1",
    "previous_status": "pending",
    "notes": "Test status update"
  }'
```

### **Expected Response**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "order_id": "test_order_123",
  "timestamp": "2024-01-15T14:30:00.000Z"
}
```

---

## 🔧 **CONFIGURATION**

### **Environment Endpoints**
- **Development**: `https://dev-hotel-website.com/api/order-status-update`
- **Staging**: `https://staging-hotel-website.com/api/order-status-update`
- **Production**: `https://hotel-website.com/api/order-status-update`

### **Timeout Settings**
- **Production**: 10 seconds
- **Staging**: 12 seconds
- **Development**: 15 seconds

### **Retry Logic**
- **Default**: 3 attempts with exponential backoff
- **Delays**: 2s, 4s, 8s between retries
- **No retry**: For 4xx client errors

---

## 🚨 **ERROR HANDLING**

### **Common Error Scenarios**
1. **Network Timeout**: App shows option to update locally
2. **Invalid Token**: Check authentication setup
3. **Order Not Found**: Verify order ID exists in website database
4. **Invalid Status**: Ensure status values match expected enum

### **Fallback Behavior**
- If website update fails, app offers local-only update
- User can choose to proceed with local update or cancel
- All actions are logged for debugging

---

## 📊 **MONITORING & LOGGING**

### **Recommended Logging**
- All API requests and responses
- Failed update attempts with error details
- Status transition timestamps
- Authentication failures

### **Metrics to Track**
- API response times
- Success/failure rates
- Most common error types
- Order processing times by status

---

## 🎯 **IMPLEMENTATION CHECKLIST**

### **Website Team Tasks**
- [ ] Create `/api/order-status-update` endpoint
- [ ] Update database schema with new columns
- [ ] Implement Bearer token validation
- [ ] Add error handling and logging
- [ ] Test endpoint with provided curl commands
- [ ] Set up customer notifications for status changes
- [ ] Configure CORS headers for kitchen app domain

### **Kitchen App Integration** ✅
- [x] Created status update service
- [x] Integrated approve button with website API
- [x] Integrated mark-as-ready button with website API
- [x] Added fallback for failed website updates
- [x] Implemented retry logic with exponential backoff
- [x] Added comprehensive error handling

---

## 🎉 **BENEFITS**

### **For Customers**
- Real-time order status updates
- Better visibility into order progress
- Accurate delivery/pickup timing

### **For Restaurant**
- Seamless kitchen-to-website communication
- Reduced manual status updates
- Improved operational efficiency
- Better customer satisfaction

### **For Kitchen Staff**
- Simple button clicks update website automatically
- Clear feedback on successful updates
- Fallback options if website is unavailable

---

## 📞 **SUPPORT**

For technical support or questions about the API integration:

1. **Check API logs** for detailed error messages
2. **Test endpoints** using provided curl commands
3. **Verify authentication** tokens and headers
4. **Review database** schema and permissions

**The kitchen app is now fully integrated and ready to send real-time status updates to your website!** 🚀
