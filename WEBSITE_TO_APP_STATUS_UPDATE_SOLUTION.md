# 🔄 Website-to-App Status Update Integration Guide

## 📋 **PROBLEM IDENTIFIED**

Your Postman test shows that the website API endpoint `/api/order-status-update` is working correctly and returning `200 OK`. However, the kitchen app is **NOT receiving** these status updates.

### **Current Architecture (ONE-WAY ONLY):**

```
✅ Kitchen App → Website
   Kitchen App sends status updates to website via POST /api/order-status-update
   Website updates its MySQL database
   Response: 200 OK

❌ Website → Kitchen App
   Website receives status update via POST /api/order-status-update
   Website updates its MySQL database
   Kitchen App does NOT receive the update (NO MECHANISM EXISTS)
```

---

## 🔍 **ROOT CAUSE**

The kitchen app uses **Supabase real-time subscriptions** to receive order updates. The app is listening for changes in the Supabase `orders` table:

```typescript
// Kitchen app real-time subscription (app/(tabs)/orders.tsx, Lines 121-137)
const subscription = supabase
  .channel('orders-channel')
  .on('postgres_changes',
    {
      event: '*',  // Listens for INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'orders',
      filter: `restaurant_uid=eq.${restaurantUser.app_restaurant_uid}`
    },
    (payload) => {
      console.log('🔔 Real-time order update received:', payload);
      loadOrders(); // Reload orders when change detected
    }
  )
  .subscribe();
```

**The Problem:**
- Website updates its own MySQL database ✅
- Website does NOT update Supabase database ❌
- Kitchen app never receives the update ❌

---

## ✅ **SOLUTION**

The website must update **BOTH** databases when it receives a status update:

1. **Update MySQL database** (already working)
2. **Update Supabase database** (needs to be added)

---

## 🛠️ **IMPLEMENTATION GUIDE FOR WEBSITE**

### **Step 1: Add Supabase Client to Website**

Add this to your website's PHP backend:

```php
<?php
// File: includes/supabase-client.php

class SupabaseClient {
    private $supabaseUrl = 'https://evqmvmjnfeefeeizeljq.supabase.co';
    private $supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';

    /**
     * Update order status in Supabase
     */
    public function updateOrderStatus($orderNumber, $newStatus, $updatedAt = null) {
        $url = $this->supabaseUrl . '/rest/v1/orders?orderNumber=eq.' . urlencode($orderNumber);
        
        $data = [
            'status' => $newStatus,
            'updated_at' => $updatedAt ?? date('c') // ISO 8601 format
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $this->supabaseKey,
            'Authorization: Bearer ' . $this->supabaseKey,
            'Content-Type: application/json',
            'Prefer: return=minimal'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            error_log("✅ Supabase updated: Order $orderNumber → $newStatus");
            return true;
        } else {
            error_log("❌ Supabase update failed: HTTP $httpCode - $response");
            return false;
        }
    }

    /**
     * Cancel order in Supabase
     */
    public function cancelOrder($orderNumber, $cancelReason = null) {
        $url = $this->supabaseUrl . '/rest/v1/orders?orderNumber=eq.' . urlencode($orderNumber);
        
        $data = [
            'status' => 'cancelled',
            'cancelled_at' => date('c'),
            'cancel_reason' => $cancelReason ?? 'Cancelled via website',
            'updated_at' => date('c')
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $this->supabaseKey,
            'Authorization: Bearer ' . $this->supabaseKey,
            'Content-Type: application/json',
            'Prefer: return=minimal'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            error_log("✅ Supabase updated: Order $orderNumber cancelled");
            return true;
        } else {
            error_log("❌ Supabase cancel failed: HTTP $httpCode - $response");
            return false;
        }
    }
}
?>
```

---

### **Step 2: Update Your `/api/order-status-update` Endpoint**

Modify your existing endpoint to also update Supabase:

```php
<?php
// File: api/order-status-update.php

require_once '../includes/supabase-client.php';

// Parse request body
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    exit();
}

// Validate required fields
$required = ['order_number', 'status', 'timestamp'];
foreach ($required as $field) {
    if (!isset($input[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Missing field: $field"]);
        exit();
    }
}

// Normalize order number (remove # if present)
$orderNumber = str_replace('#', '', $input['order_number']);
$newStatus = $input['status'];
$timestamp = $input['timestamp'];
$cancelReason = $input['cancel_reason'] ?? null;

try {
    // STEP 1: Update MySQL database (your existing code)
    $pdo = new PDO('mysql:host=localhost;dbname=your_db', $username, $password);
    
    $stmt = $pdo->prepare("
        UPDATE orders 
        SET status = ?, 
            updated_at = ?,
            cancel_reason = ?
        WHERE order_number = ?
    ");
    
    $result = $stmt->execute([
        $newStatus,
        $timestamp,
        $cancelReason,
        $orderNumber
    ]);

    if (!$result) {
        throw new Exception('Failed to update MySQL database');
    }

    error_log("✅ MySQL updated: Order $orderNumber → $newStatus");

    // STEP 2: Update Supabase database (NEW - THIS IS THE KEY!)
    $supabase = new SupabaseClient();
    
    if ($newStatus === 'cancelled') {
        $supabaseResult = $supabase->cancelOrder($orderNumber, $cancelReason);
    } else {
        $supabaseResult = $supabase->updateOrderStatus($orderNumber, $newStatus, $timestamp);
    }

    if (!$supabaseResult) {
        error_log("⚠️ Warning: Supabase update failed, but MySQL was updated");
        // Don't fail the request - MySQL update succeeded
    }

    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Order status updated successfully',
        'order_number' => "#$orderNumber",
        'status' => $newStatus,
        'timestamp' => $timestamp,
        'mysql_updated' => true,
        'supabase_updated' => $supabaseResult
    ]);

} catch (Exception $e) {
    error_log("❌ Error updating order status: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update order status: ' . $e->getMessage()
    ]);
}
?>
```

---

## 🧪 **TESTING THE SOLUTION**

### **Test 1: Run the Verification Script**

```bash
cd GBC-APP-MASTER-main
node test-website-status-update.js
```

This will:
1. Check if order #150132 exists in Supabase
2. Set up real-time subscription
3. Wait for status updates from website
4. Report if updates are received

### **Test 2: Send Status Update from Postman**

```
POST https://gbcanteen-com.stackstaging.com/api/order-status-update

Headers:
Content-Type: application/json

Body:
{
  "order_number": "#150132",
  "status": "cancelled",
  "timestamp": "2025-10-09T13:05:00.000Z",
  "cancelled_by": "kitchen_app",
  "cancel_reason": "Customer requested"
}
```

### **Test 3: Verify in Kitchen App**

1. Open the kitchen app
2. Navigate to Orders screen
3. The order should update in real-time (within 1-2 seconds)
4. Check console logs for: `🔔 Real-time order update received`

---

## ✅ **EXPECTED RESULTS**

### **Before Fix:**
```
Website receives status update → Updates MySQL ✅
Kitchen app → NO UPDATE RECEIVED ❌
```

### **After Fix:**
```
Website receives status update → Updates MySQL ✅ → Updates Supabase ✅
Kitchen app → REAL-TIME UPDATE RECEIVED ✅ (within 1-2 seconds)
```

---

## 📊 **VERIFICATION CHECKLIST**

- [ ] Supabase client added to website
- [ ] `/api/order-status-update` endpoint updated to call Supabase
- [ ] Test script confirms order exists in Supabase
- [ ] Real-time subscription receives updates
- [ ] Kitchen app shows updated status in real-time
- [ ] Console logs show: `🔔 Real-time order update received`

---

## 🆘 **TROUBLESHOOTING**

### **Issue: Order not found in Supabase**
**Solution:** The order must first be created in Supabase when the customer places it. Check your order creation flow.

### **Issue: Supabase update returns 404**
**Solution:** The order number format might not match. Try both `#150132` and `150132` formats.

### **Issue: Kitchen app not receiving updates**
**Solution:** Check that:
1. App is logged in with correct restaurant UID
2. Real-time subscription is active (check console logs)
3. Order belongs to the correct restaurant

---

## 📞 **SUPPORT**

If you need help implementing this solution, please provide:
1. Your website's backend language/framework
2. Current database structure
3. Console logs from the test script
4. Any error messages from the website

---

## 🎯 **SUMMARY**

**The Fix:** Website must update Supabase database in addition to its own MySQL database.

**Why:** Kitchen app uses Supabase real-time subscriptions to receive updates.

**How:** Add Supabase client to website and call it after MySQL update.

**Result:** Kitchen app receives status updates in real-time (1-2 seconds).

