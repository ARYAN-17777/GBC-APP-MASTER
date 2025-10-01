# 🚀 GBC App - Local Mock Server Setup for Real Integration

## ❌ **Problem Identified:**
The external APIs (JSONPlaceholder, etc.) work in Postman but **don't connect to your GBC app** because your app is configured to use `gbcApiService` which expects specific endpoints and data formats.

## ✅ **Solution: Local Mock Server**
Create a local server that matches your app's API expectations and will actually update the app in real-time.

---

## 🛠️ **Step 1: Install JSON Server**

Open terminal/command prompt and run:
```bash
npm install -g json-server
```

---

## 📁 **Step 2: Create Mock Database**

Create a file called `gbc-mock-db.json` in your project root:

```json
{
  "orders": [
    {
      "id": "order_001",
      "orderNumber": "GBC-001",
      "status": "preparing",
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
      "total": 36.48,
      "timestamp": "2024-08-30T14:30:00Z",
      "apiSource": true
    }
  ],
  "menuItems": [
    {
      "id": "item_001",
      "name": "Chicken Biryani",
      "price": 15.99,
      "category": "Main Course",
      "available": true,
      "description": "Aromatic basmati rice with tender chicken"
    },
    {
      "id": "item_002",
      "name": "Vegetable Curry",
      "price": 12.99,
      "category": "Main Course",
      "available": true,
      "description": "Mixed vegetables in rich curry sauce"
    }
  ],
  "notifications": [
    {
      "id": "notif_001",
      "title": "New Order Received",
      "message": "Order #GBC-001 has been placed",
      "timestamp": "2024-08-30T14:30:00Z",
      "type": "order"
    }
  ],
  "users": [
    {
      "id": "user_001",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+44 7700 900123"
    }
  ]
}
```

---

## 🚀 **Step 3: Start Mock Server**

Run this command in your project directory:
```bash
json-server --watch gbc-mock-db.json --port 3001 --host 0.0.0.0
```

**Server will start at:** `http://localhost:3001`

---

## 🔧 **Step 4: Update Your App's API Configuration**

Update your `config/api-config.ts` file:

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3001', // Changed to local mock server
  API_KEY: 'gbc_api_key_2024_secure_token_12345',
  WEBSOCKET_URL: 'ws://localhost:3001',
  VERSION: '1.0',
  TIMEOUT: 10000,
};
```

---

## 📱 **Step 5: Update API Service for Local Testing**

Update your `services/api.ts` to work with the mock server:

```typescript
class GBCApiService {
  private config = API_CONFIG;
  private baseUrl = 'http://localhost:3001'; // Local mock server

  async getOrders() {
    try {
      const response = await fetch(`${this.baseUrl}/orders`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      return [];
    }
  }

  async createOrder(orderData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  async sendNotification(notification: any) {
    try {
      const response = await fetch(`${this.baseUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }
}
```

---

## 🧪 **Step 6: Postman Testing with Local Server**

### **Base URL for Postman:** `http://localhost:3001`

### **📝 POST - Create Order (Real Integration)**
```
Method: POST
URL: http://localhost:3001/orders
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
  "orderNumber": "GBC-002",
  "status": "pending",
  "customerName": "Jane Smith",
  "items": [
    {
      "name": "Vegetable Curry",
      "quantity": 1,
      "price": 12.99
    }
  ],
  "total": 12.99,
  "timestamp": "2024-08-30T15:00:00Z",
  "apiSource": true
}
```

### **🔔 POST - Send Notification (Real Integration)**
```
Method: POST
URL: http://localhost:3001/notifications
```

**Body (JSON):**
```json
{
  "title": "Order Ready! 🍽️",
  "message": "Your order #GBC-002 is ready for pickup!",
  "timestamp": "2024-08-30T15:30:00Z",
  "type": "order_ready"
}
```

### **📋 GET - Get All Orders**
```
Method: GET
URL: http://localhost:3001/orders
```

### **🔄 PUT - Update Order Status**
```
Method: PUT
URL: http://localhost:3001/orders/order_001
```

**Body (JSON):**
```json
{
  "id": "order_001",
  "orderNumber": "GBC-001",
  "status": "ready",
  "customerName": "John Doe",
  "items": [
    {
      "name": "Chicken Biryani",
      "quantity": 2,
      "price": 15.99
    }
  ],
  "total": 36.48,
  "timestamp": "2024-08-30T14:30:00Z",
  "apiSource": true
}
```

---

## 🔄 **Step 7: Test Real-time Integration**

### **1. Start the Mock Server:**
```bash
json-server --watch gbc-mock-db.json --port 3001 --host 0.0.0.0
```

### **2. Start Your Expo App:**
```bash
npx expo start --tunnel
```

### **3. Test in Postman:**
- Create new order using POST endpoint
- Send notification using POST endpoint
- Update order status using PUT endpoint

### **4. Check Your App:**
- **Orders should appear** in the app immediately
- **Notifications should show** in the notification count
- **API status should show** connected with live data

---

## 📱 **Step 8: Mobile Device Testing**

For testing on mobile device, you need to use your computer's IP address:

### **Find Your IP Address:**

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address

### **Update API Config for Mobile:**
```typescript
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.100:3001', // Use your actual IP
  // ... rest of config
};
```

### **Postman URLs for Mobile Testing:**
```
POST http://192.168.1.100:3001/orders
POST http://192.168.1.100:3001/notifications
GET http://192.168.1.100:3001/orders
```

---

## ✅ **Success Verification**

### **You'll know it's working when:**

1. **Mock Server Running:** Console shows "JSON Server is running"
2. **Postman Success:** 201 Created responses
3. **App Updates:** New orders appear in your GBC app
4. **Real-time Data:** API status card shows live counts
5. **Notifications Work:** Test notifications appear in app

### **Expected Flow:**
```
Postman POST → Local Mock Server → Your GBC App → UI Updates
```

---

## 🎯 **Complete Test Sequence**

### **1. Create Order in Postman:**
```
POST http://localhost:3001/orders
[Use order payload above]
```

### **2. Check App:**
- Open GBC app
- Look for new order in order list
- Check API status card for updated count

### **3. Send Notification in Postman:**
```
POST http://localhost:3001/notifications
[Use notification payload above]
```

### **4. Verify in App:**
- Check notification count increased
- Test notification should appear

---

## 🚀 **Why This Works:**

- ✅ **Real Integration:** Uses your app's actual API service
- ✅ **Local Control:** You control the data and responses
- ✅ **Real-time Updates:** Changes appear immediately in app
- ✅ **Mobile Compatible:** Works on device with IP address
- ✅ **Postman Friendly:** Easy to test all endpoints

**This setup will make your Postman tests actually affect your GBC app!** 🎉
