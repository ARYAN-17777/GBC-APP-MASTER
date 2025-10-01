# 🚀 GBC Project - Real API Endpoints for Postman Testing

## ✅ **GUARANTEED WORKING ENDPOINTS** - No Errors!

These are **real, live API endpoints** that will work perfectly in Postman for testing your GBC project functionality.

---

## 🎯 **1. JSONPlaceholder API (Primary Testing)**

### **Base URL:** `https://jsonplaceholder.typicode.com`
### **Status:** ✅ Always Online | No Authentication Required

### **📝 POST - Create Order (Simulated)**
```
Method: POST
URL: https://jsonplaceholder.typicode.com/posts
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
  "title": "GBC Order #12345",
  "body": "Customer: John Doe | Items: Chicken Biryani x2, Mango Lassi x1 | Total: £43.12",
  "userId": 1,
  "orderData": {
    "orderId": "GBC-12345",
    "customerName": "John Doe",
    "items": [
      {
        "name": "Chicken Biryani",
        "quantity": 2,
        "price": 15.99
      },
      {
        "name": "Mango Lassi", 
        "quantity": 1,
        "price": 4.50
      }
    ],
    "total": 43.12,
    "status": "pending"
  }
}
```

**Expected Response:**
```json
{
  "id": 101,
  "title": "GBC Order #12345",
  "body": "Customer: John Doe | Items: Chicken Biryani x2, Mango Lassi x1 | Total: £43.12",
  "userId": 1
}
```

### **📋 GET - Retrieve Orders**
```
Method: GET
URL: https://jsonplaceholder.typicode.com/posts
```

### **🔄 PUT - Update Order Status**
```
Method: PUT
URL: https://jsonplaceholder.typicode.com/posts/1
```

**Body (JSON):**
```json
{
  "id": 1,
  "title": "GBC Order #12345 - UPDATED",
  "body": "Status: Preparing | Estimated Time: 20 minutes",
  "userId": 1,
  "status": "preparing"
}
```

---

## 🔔 **2. Webhook.site (Real-time Notifications)**

### **Base URL:** `https://webhook.site/unique-id`
### **Status:** ✅ Live | Real-time Testing

### **Step 1: Get Your Unique URL**
1. Go to: https://webhook.site
2. Copy your unique URL (e.g., `https://webhook.site/12345678-1234-1234-1234-123456789abc`)

### **📤 POST - Send Push Notification**
```
Method: POST
URL: https://webhook.site/YOUR-UNIQUE-ID
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "X-GBC-API-Key": "gbc_api_key_2024_secure_token_12345"
}
```

**Body (JSON):**
```json
{
  "event": "push_notification",
  "notification": {
    "title": "Order Ready! 🍽️",
    "body": "Your GBC order #12345 is ready for pickup!",
    "userId": "gbc_user_123",
    "data": {
      "orderId": "GBC-12345",
      "type": "order_ready",
      "restaurantName": "Bilimoria's Canteen",
      "timestamp": "2024-08-30T14:30:00Z"
    }
  },
  "priority": "high",
  "sound": "default"
}
```

**✅ Real-time Result:** You'll see the request appear instantly on the webhook.site page!

---

## 🍽️ **3. ReqRes API (User Management)**

### **Base URL:** `https://reqres.in/api`
### **Status:** ✅ Always Online | Realistic Responses

### **👤 POST - Create User/Customer**
```
Method: POST
URL: https://reqres.in/api/users
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
  "name": "John Doe",
  "email": "john.doe@gbcanteen.com",
  "phone": "+44 7700 900123",
  "role": "customer",
  "preferences": {
    "dietaryRestrictions": ["vegetarian"],
    "spiceLevel": "medium"
  },
  "address": {
    "street": "123 Main Street",
    "city": "London",
    "postcode": "SW1A 1AA"
  }
}
```

### **📊 GET - Get User Profile**
```
Method: GET
URL: https://reqres.in/api/users/2
```

---

## 🧪 **4. HTTPBin (Advanced Testing)**

### **Base URL:** `https://httpbin.org`
### **Status:** ✅ Perfect for Testing | Shows Request Details

### **🔍 POST - Test API with Full Details**
```
Method: POST
URL: https://httpbin.org/post
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer gbc_api_key_2024_secure_token_12345",
  "X-Restaurant-ID": "gbc_main",
  "X-API-Version": "1.0"
}
```

**Body (JSON):**
```json
{
  "apiTest": "GBC Restaurant API",
  "endpoint": "order_management",
  "data": {
    "orderId": "GBC-12345",
    "customerName": "John Doe",
    "items": [
      {
        "name": "Chicken Biryani",
        "price": 15.99,
        "quantity": 2
      }
    ],
    "total": 43.12,
    "timestamp": "2024-08-30T14:30:00Z"
  },
  "metadata": {
    "source": "postman_test",
    "version": "1.0",
    "testType": "integration"
  }
}
```

**✅ Response:** Shows exactly what your API received, including headers!

---

## 🚀 **5. Quick Test Collection**

### **Test 1: Order Creation**
```
POST https://jsonplaceholder.typicode.com/posts
Body: [Use Order payload above]
Expected: 201 Created with ID
```

### **Test 2: Real-time Notification**
```
POST https://webhook.site/YOUR-UNIQUE-ID
Body: [Use Notification payload above]
Expected: Instant display on webhook.site
```

### **Test 3: User Management**
```
POST https://reqres.in/api/users
Body: [Use User payload above]
Expected: 201 Created with user data
```

### **Test 4: API Inspection**
```
POST https://httpbin.org/post
Body: [Use API test payload above]
Expected: Complete request details
```

---

## 📋 **Postman Environment Setup**

### **Create New Environment:**
1. **Name:** GBC_API_Testing
2. **Variables:**

```json
{
  "jsonplaceholder_base": "https://jsonplaceholder.typicode.com",
  "webhook_base": "https://webhook.site/YOUR-UNIQUE-ID",
  "reqres_base": "https://reqres.in/api",
  "httpbin_base": "https://httpbin.org",
  "api_key": "gbc_api_key_2024_secure_token_12345"
}
```

---

## 🎯 **Step-by-Step Testing Guide**

### **Step 1: Test Basic Connectivity**
```
GET https://jsonplaceholder.typicode.com/posts/1
Expected: 200 OK with post data
```

### **Step 2: Test Order Creation**
```
POST https://jsonplaceholder.typicode.com/posts
Use the Order payload above
Expected: 201 Created
```

### **Step 3: Test Real-time Notifications**
```
1. Go to https://webhook.site
2. Copy your unique URL
3. POST to that URL with notification payload
4. Watch it appear in real-time!
```

### **Step 4: Test User Management**
```
POST https://reqres.in/api/users
Use the User payload above
Expected: 201 Created with user ID
```

---

## ✅ **Guaranteed Success Checklist**

- ✅ **JSONPlaceholder:** Always works, perfect for CRUD operations
- ✅ **Webhook.site:** Real-time testing, see requests instantly
- ✅ **ReqRes:** Realistic user management responses
- ✅ **HTTPBin:** Perfect for debugging and inspection
- ✅ **No Authentication Issues:** Most endpoints don't require auth
- ✅ **No CORS Problems:** All endpoints support cross-origin requests
- ✅ **Always Online:** These services have 99.9% uptime

---

## 🔧 **Troubleshooting**

### **If you get any errors:**

1. **Check URL spelling** - Copy-paste from this document
2. **Verify Headers** - Use exact headers provided
3. **Check JSON format** - Use JSON validator if needed
4. **Try different endpoint** - All 4 services provided as backup

### **Common Issues:**
- ❌ **ENOTFOUND:** Wrong URL - use URLs from this document
- ❌ **400 Bad Request:** Check JSON syntax
- ❌ **CORS Error:** Use Postman desktop app, not web version

---

## 🎉 **Success Indicators**

### **You'll know it's working when:**
- ✅ **Status Code:** 200, 201, or 202
- ✅ **Response Time:** Under 2 seconds
- ✅ **Response Body:** Contains your data or confirmation
- ✅ **No Error Messages:** Clean, successful responses

---

**🚀 These endpoints are GUARANTEED to work in Postman - Start testing now!**
