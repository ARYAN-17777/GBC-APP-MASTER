# GBC Kitchen App - Cloud-Based Handshake for Beginners

## 🌐 NEW: Cloud-Based Handshake System

**Great News!** The handshake system has been completely redesigned to eliminate device IP dependencies and work entirely through the cloud.

### **✅ What's Changed:**
- **No Device IP Required**: Zero manual IP configuration needed
- **Cloud-First**: All communication goes through Supabase
- **Automatic Discovery**: Restaurants auto-register when users log in
- **Production Ready**: Works in any network environment
- **Scalable**: Supports unlimited restaurants without setup

---

## Prerequisites

Before you start, you need to understand **what you're trying to do**:

### **Scenario A: Testing the App's Internal API (Development)**
- ✅ You're a developer testing the app's functionality
- ✅ You have the GBC Kitchen App running on a device/emulator
- ✅ You want to test how the app receives orders

### **Scenario B: Website Integration (Production)**
- ✅ You're building a website that needs to send orders to the app
- ✅ You want to integrate your restaurant website with the kitchen app
- ✅ You need to establish a handshake connection

---

## Step 1: Understanding the Handshake

### **What is the Handshake?**
The handshake is a security mechanism where:
1. **Website** sends a request to establish connection
2. **App** responds with its unique restaurant ID
3. **Website** stores this ID for future order sending
4. **App** never stores website data permanently

### **Why is it Needed?**
- **Security**: Ensures only authorized restaurants can send orders
- **Multi-tenant**: Multiple restaurants can use the same app
- **Data Isolation**: Each restaurant's orders are completely separate

---

## Step 2: Cloud-Based Integration (Only Method Needed)

### **🌐 Cloud-Based Handshake (Production Ready)**

**When to use:** All scenarios - development, testing, and production

**Requirements:**
- GBC Kitchen App installed and user logged in (auto-registers with cloud)
- Website with internet access
- Supabase account access

**Base URL (Cloud):**
```
https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/cloud-handshake
```

**Key Benefits:**
- ✅ **No IP Configuration**: Works from anywhere
- ✅ **Automatic Discovery**: Apps register themselves
- ✅ **Real-Time**: Instant communication via Supabase
- ✅ **Production Scalable**: Supports unlimited restaurants
- ✅ **Network Independent**: No firewall or VPN setup needed

---

## Step 3: Prepare Your Request (Method A - Development Testing)

### **✅ Correct URL:**
```
POST http://[YOUR_DEVICE_IP]:8081/api/handshake
```

### **✅ Required Headers:**
```
Content-Type: application/json
Accept: application/json
```

### **✅ Request Body:**
```json
{
  "website_restaurant_id": "rest_test_001",
  "callback_url": "https://your-website.com/api/orders/callback",
  "timestamp": "2025-01-16T10:30:00Z"
}
```

### **🔍 How to Find Your Device IP:**

**Android Device:**
1. Go to Settings → Wi-Fi
2. Tap on connected network
3. Look for "IP Address"

**iOS Device:**
1. Go to Settings → Wi-Fi
2. Tap (i) next to connected network
3. Look for "IP Address"

**Expo Development:**
1. Run `npx expo start`
2. Look for "Metro waiting on exp://[IP]:8081"
3. Use that IP address

---

## Step 4: Send the Request

### **📱 Using Postman (Corrected Configuration):**

**URL:** `http://192.168.1.100:8081/api/handshake` (replace with your IP)
**Method:** `POST`

**Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Body (JSON):**
```json
{
  "website_restaurant_id": "rest_test_001",
  "callback_url": "https://your-website.com/api/orders/callback",
  "timestamp": "2025-01-16T10:30:00Z"
}
```

### **💻 Using cURL:**
```bash
curl -X POST http://192.168.1.100:8081/api/handshake \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "website_restaurant_id": "rest_test_001",
    "callback_url": "https://your-website.com/api/orders/callback",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'
```

### **🖥️ Using PowerShell:**
```powershell
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$body = @{
    website_restaurant_id = "rest_test_001"
    callback_url = "https://your-website.com/api/orders/callback"
    timestamp = $timestamp
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://192.168.1.100:8081/api/handshake" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

---

## Step 5: Understand the Response

### **✅ Successful Response (200 OK):**
```json
{
  "app_restaurant_uid": "e7c291ca-1711-493c-83c8-f13965e8180a",
  "device_label": "Kitchen Tablet - 2025-01-16",
  "app_version": "3.0.0",
  "platform": "android",
  "capabilities": [
    "real_time_notifications",
    "thermal_printing",
    "order_status_updates",
    "multi_tenant_support",
    "offline_queue"
  ],
  "handshake_timestamp": "2025-01-16T10:30:05Z"
}
```

**What this means:**
- `app_restaurant_uid`: **SAVE THIS!** Use it for all future order requests
- `device_label`: Human-readable device identifier
- `capabilities`: Features supported by this app instance

---

## Step 6: Troubleshooting Common Errors

### **❌ 404 Error: "requested path is invalid"**

**Causes:**
1. **Wrong URL**: Using Supabase URL instead of device IP
2. **App not running**: GBC Kitchen App not started on device
3. **Wrong port**: Using wrong port number (should be 8081)
4. **Network issue**: Device not accessible from your computer

**Solutions:**
1. ✅ Use device IP: `http://[DEVICE_IP]:8081/api/handshake`
2. ✅ Start the app: Make sure GBC Kitchen App is running
3. ✅ Check port: Ensure you're using port 8081
4. ✅ Test connectivity: Ping the device IP first

### **❌ 400 Bad Request: "Missing website_restaurant_id"**

**Cause:** Required fields missing from request body

**Solution:**
```json
{
  "website_restaurant_id": "rest_test_001",  // ✅ Required
  "callback_url": "https://website.com/callback",  // ✅ Required
  "timestamp": "2025-01-16T10:30:00Z"  // ✅ Required
}
```

### **❌ 401 Unauthorized: "Restaurant not authenticated"**

**Cause:** No user logged into the GBC Kitchen App

**Solution:**
1. Open GBC Kitchen App on device
2. Login with valid credentials
3. Ensure user stays logged in
4. Try handshake request again

### **❌ 429 Rate Limited: "Maximum 10 handshake requests per hour"**

**Cause:** Too many handshake attempts

**Solution:**
1. Wait 1 hour before trying again
2. Use different IP address if testing
3. Restart the app to reset rate limiting

### **❌ Connection Refused / Network Error**

**Causes:**
1. Wrong IP address
2. Device and computer on different networks
3. Firewall blocking connection
4. App not running in development mode

**Solutions:**
1. ✅ Verify IP address is correct
2. ✅ Ensure both devices on same Wi-Fi network
3. ✅ Disable firewall temporarily for testing
4. ✅ Run app with `npx expo start` in development

---

## Step 7: Next Steps After Successful Handshake

### **📝 Save the Restaurant UID:**
```javascript
// Save this for all future requests
const appRestaurantUID = "e7c291ca-1711-493c-83c8-f13965e8180a";
```

### **📦 Send Test Order:**
```bash
curl -X POST http://192.168.1.100:8081/api/orders/receive \
  -H "Content-Type: application/json" \
  -H "X-Restaurant-UID: e7c291ca-1711-493c-83c8-f13965e8180a" \
  -H "X-Website-Restaurant-ID: rest_test_001" \
  -H "X-Idempotency-Key: test-order-$(date +%s)" \
  -d '{
    "orderNumber": "#100001",
    "amount": 25.50,
    "status": "pending",
    "items": [
      {
        "title": "Test Item",
        "quantity": 1,
        "unitPrice": "25.50"
      }
    ],
    "website_restaurant_id": "rest_test_001"
  }'
```

---

## 🎯 Quick Fix for Your Current Issue

**Replace this (WRONG):**
```
URL: https://evqmvmjnfeefeeizeljq.supabase.co/api/handshake
```

**With this (CORRECT):**
```
URL: http://[YOUR_DEVICE_IP]:8081/api/handshake
```

**Example:**
```
URL: http://192.168.1.100:8081/api/handshake
```

The Supabase URL is for the database backend, not the API endpoints!

---

## 🌐 Production Website Integration Guide

### **For Restaurant Websites (Production Use)**

If you're building a restaurant website that needs to send orders to the GBC Kitchen App, here's the production workflow:

### **Step 1: Restaurant Setup**
1. **Install GBC Kitchen App** on restaurant's tablet/device
2. **Connect to restaurant's Wi-Fi** network
3. **Login with restaurant credentials**
4. **Note the device's local IP address**

### **Step 2: Website Configuration**
Your restaurant website needs to:
1. **Store the restaurant's device IP** in your database
2. **Implement handshake endpoint** on your website
3. **Handle order forwarding** to the kitchen app

### **Step 3: Production Handshake Flow**
```javascript
// Website backend code (Node.js example)
const restaurantDeviceIP = "192.168.1.100"; // From restaurant setup
const handshakeURL = `http://${restaurantDeviceIP}:8081/api/handshake`;

const handshakeResponse = await fetch(handshakeURL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    website_restaurant_id: "rest_gbc_001",
    callback_url: "https://your-restaurant-website.com/api/orders/callback",
    timestamp: new Date().toISOString()
  })
});

const { app_restaurant_uid } = await handshakeResponse.json();
// Store app_restaurant_uid in your database for this restaurant
```

### **Step 4: Order Forwarding**
```javascript
// When customer places order on website
const orderResponse = await fetch(`http://${restaurantDeviceIP}:8081/api/orders/receive`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Restaurant-UID': app_restaurant_uid,
    'X-Website-Restaurant-ID': 'rest_gbc_001',
    'X-Idempotency-Key': `order-${orderId}-${Date.now()}`
  },
  body: JSON.stringify({
    orderNumber: `#${orderId}`,
    amount: orderTotal,
    status: "pending",
    items: orderItems,
    customerName: customerName,
    customerPhone: customerPhone,
    website_restaurant_id: "rest_gbc_001",
    callback_url: "https://your-restaurant-website.com/api/orders/callback"
  })
});
```

### **🔒 Production Security Considerations**

1. **Network Security:**
   - Use VPN or secure network for restaurant devices
   - Implement IP whitelisting on restaurant router
   - Use HTTPS where possible (requires SSL certificate on device)

2. **Authentication:**
   - Implement API keys for additional security
   - Use rate limiting on your website
   - Validate all incoming requests

3. **Error Handling:**
   - Implement retry logic for network failures
   - Queue orders when kitchen app is offline
   - Provide fallback notification methods (email, SMS)

### **📱 Alternative: Cloud-Based Integration**

For easier production deployment, consider using the **Supabase real-time features**:

```javascript
// Website subscribes to Supabase for order status updates
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://evqmvmjnfeefeeizeljq.supabase.co',
  'your_supabase_anon_key'
);

// Listen for order status changes
supabase
  .channel('order_updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `restaurant_id=eq.${restaurantId}`
  }, (payload) => {
    console.log('Order status updated:', payload);
    // Update your website's order status
  })
  .subscribe();
```

This approach uses Supabase as the intermediary, eliminating the need for direct device IP communication.

---

## 🎯 Summary: Why You Got the 404 Error

**Your Original Mistake:**
- ❌ Used: `https://evqmvmjnfeefeeizeljq.supabase.co/api/handshake`
- ❌ This is the **database URL**, not the **app API URL**

**Correct Approach:**
- ✅ Use: `http://[DEVICE_IP]:8081/api/handshake`
- ✅ This connects to the **running app** on the device

**The Fix:**
1. Find your device's IP address
2. Replace the Supabase URL with `http://[DEVICE_IP]:8081`
3. Ensure the GBC Kitchen App is running and user is logged in
4. Test the handshake request

**Example Working URL:**
```
http://192.168.1.100:8081/api/handshake
```

The error was **NOT from your side or the website** - it was simply using the wrong URL format for the type of integration you're trying to do!
