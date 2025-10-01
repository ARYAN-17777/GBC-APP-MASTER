# GBC Canteen App - API Documentation & Real-time Integration

## 🚀 Quick Start

### Universal QR Code for Expo Go
```
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █▄▄██████▄██▄▄█ ▄▄▄▄▄ █
█ █   █ █ ▀█ ▄    ▀ ▄ █ █   █ █
█ █▄▄▄█ █▄ ▄▄▀█▄▄▄█▀ ▀█ █▄▄▄█ █
█▄▄▄▄▄▄▄█▄▀▄▀▄█▄█▄▀ ▀▄█▄▄▄▄▄▄▄█
█   ▄▀▀▄█ ▀████ ▄  █▀▀ ▀▀ ▄ █ █
█ ▀▄▀▄▄▄  ██▀▀▀███▄█▀▀ ▄▀█▀██▀█
█  ▀▀██▄█▀▄▀ █▀▀ ▀   █▄▀██▀▄ ▀█
█▀▀ █ █▄███▄█ ▀▄█ █▀▄▄▄█ ▀█▄ ▄█
██ ███ ▄▄▀█ ▄▀▀█ ▀▀▀▄▀▄█▀▄█▀▀▄█
█▄█▀▀▄▄▄▀ ▀▄▄ ██▄█▀▄▀█ █▄█  ▀██
██▄███▄▄█▀▄█▄  ▀█▀▄██ ▄▄▄  ▄  █
█ ▄▄▄▄▄ ███▀▄▄▄██▀██▄ █▄█ ▄▄ ██
█ █   █ █▀▀▀▀ █ ▀ ▄▄▀▄ ▄    █▀█
█ █▄▄▄█ █ ▄▄ █▄▀▀▀▄ █ █▀▄▀██▀▄█
█▄▄▄▄▄▄▄█▄▄▄█▄█▄███▄▄▄█▄██▄█▄██
```

**Expo URL:** `exp://eu4gueo-anonymous-8082.exp.direct`
**Web URL:** `http://localhost:8082`

## 🔑 API Configuration

### Primary API Key
```
gbc_api_key_2024_secure_token_12345
```

### API Endpoints
- **Base URL:** `https://api.gbcanteen.com/v1`
- **WebSocket URL:** `wss://ws.gbcanteen.com/realtime`
- **Version:** `1.0`

## 📱 Real-time Features

### WebSocket Connection
The app automatically connects to the WebSocket server for real-time updates:

```typescript
import { gbcApiService } from './services/api';

// Initialize real-time connection
await gbcApiService.initializeRealTime('user123');
```

### Real-time Events
- **Order Updates:** Live order status changes
- **Push Notifications:** Instant notifications
- **Menu Updates:** Real-time menu availability
- **System Announcements:** Important updates

## 🛠️ API Usage Examples

### 1. Place an Order
```typescript
const orderData = {
  items: [
    { id: 'item1', quantity: 2, price: 15.99 },
    { id: 'item2', quantity: 1, price: 8.50 }
  ],
  userId: 'user123',
  deliveryAddress: '123 Main St',
  paymentMethod: 'card'
};

const response = await gbcApiService.placeOrder(orderData);
console.log('Order placed:', response.orderId);
```

### 2. Get Order Status
```typescript
const orderId = 'order_12345';
const status = await gbcApiService.getOrderStatus(orderId);
console.log('Order status:', status);
```

### 3. Send Push Notification (Admin)
```typescript
const notification = {
  title: 'Order Ready! 🍽️',
  body: 'Your order #12345 is ready for pickup!',
  userId: 'user123',
  data: { orderId: '12345' }
};

await gbcApiService.sendPushNotification(notification);
```

### 4. Update Order Status (Kitchen/Admin)
```typescript
await gbcApiService.updateOrderStatus('order_12345', 'preparing');
```

## 🔄 Real-time Order Flow

1. **Customer places order** → `order_placed` event
2. **Restaurant confirms** → `order_confirmed` event
3. **Kitchen starts preparing** → `order_preparing` event
4. **Order ready** → `order_ready` event + Push notification
5. **Order delivered** → `order_delivered` event

## 🌐 Website Integration

### For Website Push Operations
Use the API key to connect your website to the mobile app:

```javascript
// Website JavaScript example
const API_KEY = 'gbc_api_key_2024_secure_token_12345';
const BASE_URL = 'https://api.gbcanteen.com/v1';

// Send order update from website to mobile app
async function updateOrderFromWebsite(orderId, status) {
  const response = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ status })
  });
  
  return response.json();
}

// Send push notification from website
async function sendNotificationFromWebsite(notification) {
  const response = await fetch(`${BASE_URL}/notifications/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(notification)
  });
  
  return response.json();
}
```

## 📊 Available API Endpoints

### Orders
- `POST /orders` - Place new order
- `GET /orders/{id}` - Get order details
- `PATCH /orders/{id}/status` - Update order status
- `GET /orders/history` - Get order history

### Menu
- `GET /menu` - Get full menu
- `GET /menu/categories` - Get menu categories
- `PUT /menu` - Update menu (admin)

### Notifications
- `POST /notifications/push` - Send push notification
- `GET /notifications` - Get user notifications
- `PUT /notifications/settings` - Update notification settings

### User Management
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `GET /user/preferences` - Get user preferences

## 🔐 Authentication

All API requests require the API key in the Authorization header:
```
Authorization: Bearer gbc_api_key_2024_secure_token_12345
```

## 🚨 Error Handling

The API returns standard HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

## 📱 Mobile App Features Implemented

✅ **Login Page** - Exact UI match with "Username" field
✅ **Invalid Credentials** - Short "Invalid credentials" popup
✅ **Privacy Policy** - Same content as signup + fixed keyboard positioning
✅ **Help & Support** - Expandable FAQ with 10 detailed questions
✅ **Real-time API** - WebSocket connection for live updates
✅ **Push Notifications** - Real-time order status updates

## 🔧 Development Setup

1. **Install Expo Go** on your mobile device
2. **Scan the QR code** above
3. **Login credentials:**
   - Username: `GBC`
   - Password: `GBC@123`

## 📞 Support

For API support or integration help:
- Email: `hello@gbcanteen.com`
- Documentation: Available in the Help & Support section of the app

---

**🎉 All requested features have been successfully implemented and the app is now running with real-time API integration!**
