# 🚀 GBC API - Postman Testing Payloads

## 🔑 **API Configuration**

### **Base URL:** `https://api.gbcanteen.com/v1`
### **API Key:** `gbc_api_key_2024_secure_token_12345`

### **Headers for All Requests:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer gbc_api_key_2024_secure_token_12345",
  "X-API-Version": "1.0"
}
```

---

## 📝 **1. ORDERS API**

### **POST /orders - Place New Order**
```json
{
  "userId": "user_12345",
  "customerName": "John Doe",
  "customerPhone": "+44 7700 900123",
  "customerEmail": "john.doe@example.com",
  "items": [
    {
      "id": "item_001",
      "name": "Chicken Biryani",
      "quantity": 2,
      "price": 15.99,
      "customizations": ["Extra spicy", "No onions"]
    },
    {
      "id": "item_002",
      "name": "Mango Lassi",
      "quantity": 1,
      "price": 4.50,
      "customizations": []
    }
  ],
  "deliveryAddress": {
    "street": "123 Main Street",
    "city": "London",
    "postcode": "SW1A 1AA",
    "country": "UK"
  },
  "paymentMethod": "card",
  "paymentDetails": {
    "cardLast4": "1234",
    "cardType": "visa"
  },
  "specialInstructions": "Please ring the doorbell twice",
  "deliveryTime": "ASAP",
  "subtotal": 36.48,
  "tax": 3.65,
  "deliveryFee": 2.99,
  "total": 43.12,
  "timestamp": "2024-08-30T14:30:00Z"
}
```

### **GET /orders/{orderId} - Get Order Details**
**URL:** `https://api.gbcanteen.com/v1/orders/order_12345`
**Method:** GET
**No Body Required**

### **PATCH /orders/{orderId}/status - Update Order Status**
```json
{
  "status": "preparing",
  "message": "Your order is being prepared by our kitchen team",
  "estimatedTime": "25 minutes",
  "updatedBy": "kitchen_staff_001"
}
```

**Status Options:**
- `pending` - Order received, awaiting confirmation
- `confirmed` - Order confirmed by restaurant
- `preparing` - Kitchen is preparing the order
- `ready` - Order ready for pickup/delivery
- `out_for_delivery` - Order is being delivered
- `delivered` - Order successfully delivered
- `cancelled` - Order cancelled

---

## 🍽️ **2. MENU API**

### **GET /menu - Get Full Menu**
**URL:** `https://api.gbcanteen.com/v1/menu`
**Method:** GET
**No Body Required**

### **PUT /menu - Update Menu (Admin)**
```json
{
  "categories": [
    {
      "id": "cat_001",
      "name": "Main Courses",
      "description": "Hearty main dishes",
      "items": [
        {
          "id": "item_001",
          "name": "Chicken Biryani",
          "description": "Aromatic basmati rice with tender chicken pieces",
          "price": 15.99,
          "category": "Main Courses",
          "available": true,
          "preparationTime": "20-25 minutes",
          "allergens": ["gluten"],
          "dietary": ["halal"],
          "image": "https://example.com/images/chicken-biryani.jpg",
          "ingredients": ["Basmati rice", "Chicken", "Spices", "Yogurt"]
        }
      ]
    },
    {
      "id": "cat_002",
      "name": "Beverages",
      "description": "Refreshing drinks",
      "items": [
        {
          "id": "item_002",
          "name": "Mango Lassi",
          "description": "Traditional yogurt-based mango drink",
          "price": 4.50,
          "category": "Beverages",
          "available": true,
          "preparationTime": "2-3 minutes",
          "allergens": ["dairy"],
          "dietary": ["vegetarian"],
          "image": "https://example.com/images/mango-lassi.jpg"
        }
      ]
    }
  ],
  "lastUpdated": "2024-08-30T14:30:00Z"
}
```

---

## 🔔 **3. NOTIFICATIONS API**

### **POST /notifications/push - Send Push Notification**
```json
{
  "title": "Order Ready! 🍽️",
  "body": "Your order #GBC-12345 is ready for pickup!",
  "userId": "user_12345",
  "data": {
    "orderId": "order_12345",
    "type": "order_ready",
    "action": "pickup",
    "restaurantId": "gbc_main"
  },
  "priority": "high",
  "sound": "default",
  "badge": 1,
  "category": "order_update"
}
```

### **POST /notifications/broadcast - Broadcast Notification**
```json
{
  "title": "Special Offer! 🎉",
  "body": "Get 20% off on all orders above £25. Use code: SAVE20",
  "audience": "all_users",
  "data": {
    "type": "promotion",
    "promoCode": "SAVE20",
    "discount": 20,
    "minOrder": 25.00
  },
  "scheduledTime": "2024-08-30T18:00:00Z",
  "expiryTime": "2024-08-31T23:59:59Z"
}
```

---

## 👤 **4. USER API**

### **GET /user/profile - Get User Profile**
**URL:** `https://api.gbcanteen.com/v1/user/profile?userId=user_12345`
**Method:** GET
**No Body Required**

### **PUT /user/profile - Update User Profile**
```json
{
  "userId": "user_12345",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+44 7700 900123",
  "preferences": {
    "dietaryRestrictions": ["vegetarian"],
    "allergens": ["nuts", "dairy"],
    "spiceLevel": "medium",
    "favoriteItems": ["item_001", "item_002"]
  },
  "addresses": [
    {
      "id": "addr_001",
      "label": "Home",
      "street": "123 Main Street",
      "city": "London",
      "postcode": "SW1A 1AA",
      "country": "UK",
      "isDefault": true
    }
  ],
  "notificationSettings": {
    "orderUpdates": true,
    "promotions": true,
    "newsletter": false
  }
}
```

---

## 💳 **5. PAYMENTS API**

### **POST /payments - Process Payment**
```json
{
  "orderId": "order_12345",
  "amount": 43.12,
  "currency": "GBP",
  "paymentMethod": {
    "type": "card",
    "cardNumber": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "123",
    "cardholderName": "John Doe"
  },
  "billingAddress": {
    "street": "123 Main Street",
    "city": "London",
    "postcode": "SW1A 1AA",
    "country": "UK"
  },
  "description": "GBC Order #12345"
}
```

---

## 📊 **6. ADMIN API**

### **GET /admin/analytics - Get Analytics**
**URL:** `https://api.gbcanteen.com/v1/admin/analytics?period=today`
**Method:** GET
**Query Parameters:**
- `period`: today, week, month, year
- `startDate`: 2024-08-01
- `endDate`: 2024-08-30

### **POST /admin/orders/bulk-update - Bulk Update Orders**
```json
{
  "orders": [
    {
      "orderId": "order_12345",
      "status": "preparing",
      "estimatedTime": "20 minutes"
    },
    {
      "orderId": "order_12346",
      "status": "ready",
      "message": "Order ready for pickup"
    }
  ],
  "updatedBy": "admin_user_001"
}
```

---

## 🧪 **7. TEST ENDPOINTS**

### **POST /test/notification - Send Test Notification**
```json
{
  "type": "test",
  "title": "Test Notification 🔔",
  "body": "This is a test notification from GBC API",
  "userId": "test_user",
  "timestamp": "2024-08-30T14:30:00Z"
}
```

### **POST /test/order - Create Test Order**
```json
{
  "testMode": true,
  "customerName": "Test Customer",
  "items": [
    {
      "name": "Test Item",
      "quantity": 1,
      "price": 9.99
    }
  ],
  "total": 9.99
}
```

---

## 🔍 **8. WEBHOOK PAYLOADS**

### **Order Status Update Webhook**
```json
{
  "event": "order.status_updated",
  "orderId": "order_12345",
  "status": "preparing",
  "previousStatus": "confirmed",
  "timestamp": "2024-08-30T14:30:00Z",
  "data": {
    "estimatedTime": "20 minutes",
    "message": "Your order is being prepared"
  }
}
```

---

## 🚀 **Quick Test Collection**

### **1. Test API Connection**
```bash
GET https://api.gbcanteen.com/v1/health
Headers: Authorization: Bearer gbc_api_key_2024_secure_token_12345
```

### **2. Place Test Order**
```bash
POST https://api.gbcanteen.com/v1/orders
Body: Use "Place New Order" payload above
```

### **3. Send Test Notification**
```bash
POST https://api.gbcanteen.com/v1/notifications/push
Body: Use "Send Push Notification" payload above
```

---

**🔑 Remember to replace `gbc_api_key_2024_secure_token_12345` with your actual API key when testing!**
