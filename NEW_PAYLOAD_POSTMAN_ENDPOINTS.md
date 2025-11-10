# 🚀 **GBC Kitchen App - New Payload Postman Endpoints**

## 📋 **Overview**

This document provides complete Postman endpoint configurations for testing the GBC Kitchen App's new payload format with the secure handshake system. The new system supports:

- ✅ **Secure Handshake System** - One-time UID exchange
- ✅ **New Payload Format** - Enhanced order structure with totals breakdown
- ✅ **Multi-tenant Support** - Restaurant UID validation
- ✅ **Real-time Notifications** - Instant order updates with audio alerts
- ✅ **Backward Compatibility** - Legacy payload support maintained

---

## 🔗 **Base Configuration**

### **Environment Variables**
Create these variables in your Postman environment:

```
APP_BASE_URL = http://localhost:8081  (or your app's IP address)
WEBSITE_RESTAURANT_ID = rest_12345
APP_RESTAURANT_UID = (will be populated after handshake)
IDEMPOTENCY_KEY = (generate unique UUID for each request)
```

### **Common Headers**
```
Content-Type: application/json
Accept: application/json
```

---

## 🤝 **STEP 1: Handshake Endpoint**

### **POST {{APP_BASE_URL}}/api/handshake**

**Purpose**: Establish secure connection and get app restaurant UID

**Headers**:
```
Content-Type: application/json
Accept: application/json
```

**Body** (JSON):
```json
{
  "website_restaurant_id": "{{WEBSITE_RESTAURANT_ID}}",
  "callback_url": "https://gbcanteen-com.stackstaging.com/api/orders/callback",
  "timestamp": "{{$isoTimestamp}}"
}
```

**Expected Response** (200 OK):
```json
{
  "app_restaurant_uid": "e7c291ca-1711-493c-83c8-f13965e8180a",
  "device_label": "Kitchen Tablet - Main Counter",
  "app_version": "3.0.0",
  "platform": "android",
  "capabilities": [
    "real_time_notifications",
    "thermal_printing",
    "order_status_updates",
    "multi_tenant_support",
    "offline_queue"
  ],
  "handshake_timestamp": "2025-01-15T10:30:05Z"
}
```

**Post-Response Script**:
```javascript
// Save the app restaurant UID for future requests
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("APP_RESTAURANT_UID", response.app_restaurant_uid);
    console.log("✅ Handshake successful! App UID:", response.app_restaurant_uid);
}
```

---

## 📦 **STEP 2: Send New Order (New Payload Format)**

### **POST {{APP_BASE_URL}}/api/orders/receive**

**Purpose**: Send order using new enhanced payload format

**Headers**:
```
Content-Type: application/json
Accept: application/json
X-Restaurant-UID: {{APP_RESTAURANT_UID}}
X-Website-Restaurant-ID: {{WEBSITE_RESTAURANT_ID}}
X-Idempotency-Key: {{$guid}}
```

**Body** (JSON) - **NEW PAYLOAD FORMAT**:
```json
{
  "userId": "{{$guid}}",
  "orderNumber": "#100{{$randomInt}}",
  "amount": 90.62,
  "amountDisplay": "£90.62",
  "totals": {
    "subtotal": "89.00",
    "discount": "5.00",
    "delivery": "2.00",
    "vat": "4.62",
    "total": "90.62"
  },
  "status": "pending",
  "items": [
    {
      "title": "Chicken Makhani",
      "quantity": 1,
      "unitPrice": "11.40",
      "lineTotal": "11.40",
      "unitPriceMinor": 1140,
      "price": 11.40,
      "originalUnitPrice": "11.40",
      "discountedUnitPrice": "11.40",
      "discountPerUnit": "0.00",
      "discountPerLine": "0.00",
      "customizations": [
        {
          "name": "Extra Cheese",
          "qty": 1,
          "price": "1.50"
        },
        {
          "name": "Less Spicy",
          "qty": 1
        }
      ]
    },
    {
      "title": "Flavour Hunt Combo",
      "quantity": 1,
      "unitPrice": "5.10",
      "lineTotal": "5.10",
      "unitPriceMinor": 510,
      "price": 5.10,
      "originalUnitPrice": "5.10",
      "discountedUnitPrice": "5.10",
      "discountPerUnit": "0.00",
      "discountPerLine": "0.00",
      "customizations": [
        {
          "name": "Add Drink",
          "qty": 1,
          "price": "2.00"
        }
      ]
    },
    {
      "title": "Family Meal",
      "quantity": 1,
      "unitPrice": "60.72",
      "lineTotal": "60.72",
      "unitPriceMinor": 6072,
      "price": 60.72,
      "originalUnitPrice": "60.72",
      "discountedUnitPrice": "60.72",
      "discountPerUnit": "0.00",
      "discountPerLine": "0.00",
      "customizations": []
    }
  ],
  "user": {
    "name": "John Smith",
    "phone": "+447700900123"
  },
  "restaurant": {
    "name": "General Bilimoria's Canteen"
  }
}
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Order received successfully",
  "data": {
    "orderId": "generated-uuid",
    "orderNumber": "#100123",
    "status": "pending",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

---

## 📦 **STEP 3: Send Legacy Order (Backward Compatibility)**

### **POST {{APP_BASE_URL}}/api/orders/receive**

**Purpose**: Test backward compatibility with legacy payload format

**Headers**:
```
Content-Type: application/json
Accept: application/json
X-Restaurant-UID: {{APP_RESTAURANT_UID}}
X-Website-Restaurant-ID: {{WEBSITE_RESTAURANT_ID}}
X-Idempotency-Key: {{$guid}}
```

**Body** (JSON) - **LEGACY PAYLOAD FORMAT**:
```json
{
  "id": "{{$guid}}",
  "orderNumber": "#LEG{{$randomInt}}",
  "amount": 1500,
  "status": "pending",
  "items": [
    {
      "title": "Tea",
      "quantity": 2,
      "price": 750
    },
    {
      "title": "Coffee",
      "quantity": 1,
      "price": 500
    }
  ],
  "user": {
    "name": "Legacy Customer",
    "phone": "+44 7111 111111"
  },
  "restaurant": {
    "name": "General Bilimoria's Canteen"
  },
  "stripeId": "pi_test_12345",
  "time": "14:30",
  "createdAt": "{{$isoTimestamp}}"
}
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Order received successfully",
  "data": {
    "orderId": "generated-uuid",
    "orderNumber": "#LEG456",
    "status": "pending",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

---

## 🔄 **STEP 4: Test Error Scenarios**

### **4.1: Invalid Restaurant UID**

**POST {{APP_BASE_URL}}/api/orders/receive**

**Headers**:
```
Content-Type: application/json
X-Restaurant-UID: invalid-uid-12345
X-Website-Restaurant-ID: {{WEBSITE_RESTAURANT_ID}}
X-Idempotency-Key: {{$guid}}
```

**Expected Response** (403 Forbidden):
```json
{
  "success": false,
  "error": "Restaurant UID mismatch - request rejected",
  "errorCode": 403
}
```

### **4.2: Missing Required Headers**

**POST {{APP_BASE_URL}}/api/orders/receive**

**Headers** (Missing X-Restaurant-UID):
```
Content-Type: application/json
X-Website-Restaurant-ID: {{WEBSITE_RESTAURANT_ID}}
X-Idempotency-Key: {{$guid}}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Missing required header: X-Restaurant-UID",
  "errorCode": 400
}
```

### **4.3: Duplicate Idempotency Key**

**POST {{APP_BASE_URL}}/api/orders/receive**

**Headers** (Use same idempotency key twice):
```
Content-Type: application/json
X-Restaurant-UID: {{APP_RESTAURANT_UID}}
X-Website-Restaurant-ID: {{WEBSITE_RESTAURANT_ID}}
X-Idempotency-Key: duplicate-key-12345
```

**Expected Response** (409 Conflict):
```json
{
  "success": false,
  "error": "Duplicate request - idempotency key already processed",
  "errorCode": 409
}
```

---

## 🧪 **STEP 5: Test Collection Setup**

### **Pre-Request Script** (Collection Level):
```javascript
// Generate unique idempotency key for each request
pm.environment.set("IDEMPOTENCY_KEY", pm.variables.replaceIn("{{$guid}}"));

// Log request details
console.log("🚀 Request:", pm.request.name);
console.log("📍 URL:", pm.request.url.toString());
console.log("🔑 Idempotency Key:", pm.environment.get("IDEMPOTENCY_KEY"));
```

### **Test Script** (Collection Level):
```javascript
// Common test assertions
pm.test("Response time is less than 2000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});

pm.test("Response has correct Content-Type", function () {
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// Log response for debugging
console.log("📊 Response Status:", pm.response.status);
console.log("📄 Response Body:", pm.response.text());
```

---

## 📱 **STEP 6: Real-Time Testing**

### **6.1: Check Notifications**
After sending an order, check the app's Notifications tab to verify:
- ✅ Real-time notification appears instantly
- ✅ Audio alert plays (kitchen-appropriate beep)
- ✅ Unread badge count increases
- ✅ Order details display correctly

### **6.2: Verify Order Processing**
Check the app's Orders tab to confirm:
- ✅ Order appears in pending status
- ✅ Customer name displays correctly
- ✅ Items and quantities are accurate
- ✅ Total amount matches payload
- ✅ Customizations are visible (for new payload)

### **6.3: Test Receipt Generation**
Use the app's print functionality to verify:
- ✅ GBC logo appears at top
- ✅ Restaurant name is dynamic
- ✅ Pickup time displays correctly
- ✅ Currency symbols (£) appear throughout
- ✅ Per-item prices are accurate
- ✅ Customizations are listed under items

---

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Handshake Fails (429 Rate Limited)**
   - Wait 1 hour or test with different IP
   - Check rate limiting logs in app

2. **Order Rejected (403 Forbidden)**
   - Verify handshake completed successfully
   - Check APP_RESTAURANT_UID is set correctly
   - Ensure headers match exactly

3. **No Real-time Notification**
   - Check app is in foreground
   - Verify Supabase connection
   - Check notification permissions

4. **Receipt Issues**
   - Verify printer connection
   - Check thermal printer settings
   - Test with different receipt options

### **Debug Commands**

**Check App Logs**:
```bash
npx expo start --clear
# Look for console logs in Metro bundler
```

**Verify Handshake Status**:
```bash
# Check AsyncStorage in app
console.log(await AsyncStorage.getItem('currentUser'));
```

**Test Supabase Connection**:
```bash
# Check real-time subscription status
console.log('Supabase connected:', supabase.realtime.isConnected());
```

---

## 🎯 **Success Criteria**

### **✅ Complete Test Flow**
1. **Handshake** → App UID received and stored
2. **New Order** → Order appears in app with real-time notification
3. **Legacy Order** → Backward compatibility confirmed
4. **Error Handling** → Proper error responses for invalid requests
5. **Real-time Updates** → Notifications work with audio alerts
6. **Receipt Printing** → All formatting improvements visible

### **✅ Multi-Tenant Verification**
- Orders with correct UID are accepted
- Orders with incorrect UID are rejected
- No cross-contamination between restaurants
- Status callbacks include both UIDs

---

## 🖥️ **CURL Commands for Terminal Testing**

### **1. Handshake Request**
```bash
curl -X POST "http://localhost:8081/api/handshake" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "website_restaurant_id": "rest_12345",
    "callback_url": "https://gbcanteen-com.stackstaging.com/api/orders/callback",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'
```

### **2. New Order Request**
```bash
# Replace APP_UID with the UID from handshake response
curl -X POST "http://localhost:8081/api/orders/receive" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-Restaurant-UID: YOUR_APP_UID_HERE" \
  -H "X-Website-Restaurant-ID: rest_12345" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -d '{
    "userId": "'$(uuidgen)'",
    "orderNumber": "#100'$RANDOM'",
    "amount": 25.50,
    "amountDisplay": "£25.50",
    "totals": {
      "subtotal": "23.00",
      "discount": "2.00",
      "delivery": "1.50",
      "vat": "3.00",
      "total": "25.50"
    },
    "status": "pending",
    "items": [
      {
        "title": "Chicken Curry",
        "quantity": 1,
        "unitPrice": "12.50",
        "lineTotal": "12.50",
        "unitPriceMinor": 1250,
        "price": 12.50,
        "originalUnitPrice": "12.50",
        "discountedUnitPrice": "12.50",
        "discountPerUnit": "0.00",
        "discountPerLine": "0.00",
        "customizations": [
          {
            "name": "Medium Spice",
            "qty": 1
          },
          {
            "name": "Extra Rice",
            "qty": 1,
            "price": "2.00"
          }
        ]
      }
    ],
    "user": {
      "name": "Test Customer",
      "phone": "+447700900123"
    },
    "restaurant": {
      "name": "General Bilimoria'\''s Canteen"
    }
  }'
```

### **3. Legacy Order Request**
```bash
curl -X POST "http://localhost:8081/api/orders/receive" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-Restaurant-UID: YOUR_APP_UID_HERE" \
  -H "X-Website-Restaurant-ID: rest_12345" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -d '{
    "id": "'$(uuidgen)'",
    "orderNumber": "#LEG'$RANDOM'",
    "amount": 1200,
    "status": "pending",
    "items": [
      {
        "title": "Tea",
        "quantity": 2,
        "price": 600
      }
    ],
    "user": {
      "name": "Legacy Customer",
      "phone": "+44 7111 111111"
    },
    "restaurant": {
      "name": "General Bilimoria'\''s Canteen"
    },
    "createdAt": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'
```

---

## 📊 **Advanced Test Scenarios**

### **Scenario 1: High Volume Order**
Test with large order containing multiple items and customizations:

```json
{
  "userId": "bulk-test-001",
  "orderNumber": "#BULK001",
  "amount": 156.75,
  "amountDisplay": "£156.75",
  "totals": {
    "subtotal": "145.00",
    "discount": "10.00",
    "delivery": "5.00",
    "vat": "16.75",
    "total": "156.75"
  },
  "status": "pending",
  "items": [
    {
      "title": "Chicken Biryani",
      "quantity": 3,
      "unitPrice": "15.99",
      "lineTotal": "47.97",
      "unitPriceMinor": 1599,
      "price": 15.99,
      "customizations": [
        {"name": "Extra Spicy", "qty": 1},
        {"name": "Extra Raita", "qty": 1, "price": "2.50"}
      ]
    },
    {
      "title": "Lamb Curry",
      "quantity": 2,
      "unitPrice": "18.50",
      "lineTotal": "37.00",
      "unitPriceMinor": 1850,
      "price": 18.50,
      "customizations": [
        {"name": "Mild Spice", "qty": 1},
        {"name": "Extra Naan", "qty": 2, "price": "3.00"}
      ]
    },
    {
      "title": "Mango Lassi",
      "quantity": 4,
      "unitPrice": "4.50",
      "lineTotal": "18.00",
      "unitPriceMinor": 450,
      "price": 4.50,
      "customizations": []
    }
  ],
  "user": {
    "name": "Large Order Customer",
    "phone": "+447700900456"
  },
  "restaurant": {
    "name": "General Bilimoria's Canteen"
  }
}
```

### **Scenario 2: Special Characters Test**
Test with special characters in names and customizations:

```json
{
  "userId": "special-chars-001",
  "orderNumber": "#SPEC001",
  "amount": 12.50,
  "amountDisplay": "£12.50",
  "items": [
    {
      "title": "Café Latté with Açaí",
      "quantity": 1,
      "unitPrice": "12.50",
      "price": 12.50,
      "customizations": [
        {"name": "Extra foam ☁️", "qty": 1},
        {"name": "Oat milk (dairy-free) 🌱", "qty": 1, "price": "0.50"}
      ]
    }
  ],
  "user": {
    "name": "José María García-López",
    "phone": "+34 666 123 456"
  },
  "restaurant": {
    "name": "General Bilimoria's Canteen"
  }
}
```

### **Scenario 3: Edge Case - Zero Price Items**
Test with promotional/free items:

```json
{
  "userId": "promo-test-001",
  "orderNumber": "#PROMO001",
  "amount": 15.00,
  "amountDisplay": "£15.00",
  "items": [
    {
      "title": "Main Course",
      "quantity": 1,
      "unitPrice": "15.00",
      "price": 15.00,
      "customizations": []
    },
    {
      "title": "Free Dessert (Promotion)",
      "quantity": 1,
      "unitPrice": "0.00",
      "price": 0.00,
      "customizations": [
        {"name": "Birthday Special 🎂", "qty": 1, "price": "0.00"}
      ]
    }
  ],
  "user": {
    "name": "Birthday Customer",
    "phone": "+447700900789"
  },
  "restaurant": {
    "name": "General Bilimoria's Canteen"
  }
}
```

---

## 🎯 **Performance Testing**

### **Load Test Script** (Node.js)
```javascript
const axios = require('axios');

async function loadTest() {
  const APP_UID = 'YOUR_APP_UID_HERE';
  const BASE_URL = 'http://localhost:8081';

  const promises = [];

  for (let i = 0; i < 10; i++) {
    const orderPromise = axios.post(`${BASE_URL}/api/orders/receive`, {
      userId: `load-test-${i}`,
      orderNumber: `#LOAD${i.toString().padStart(3, '0')}`,
      amount: 10.00 + i,
      amountDisplay: `£${(10.00 + i).toFixed(2)}`,
      status: 'pending',
      items: [{
        title: `Test Item ${i}`,
        quantity: 1,
        unitPrice: (10.00 + i).toString(),
        price: 10.00 + i,
        customizations: []
      }],
      user: {
        name: `Load Test Customer ${i}`,
        phone: `+4477009${i.toString().padStart(5, '0')}`
      },
      restaurant: {
        name: "General Bilimoria's Canteen"
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Restaurant-UID': APP_UID,
        'X-Website-Restaurant-ID': 'rest_12345',
        'X-Idempotency-Key': `load-test-${i}-${Date.now()}`
      }
    });

    promises.push(orderPromise);
  }

  try {
    const results = await Promise.all(promises);
    console.log(`✅ Successfully sent ${results.length} orders`);
    results.forEach((result, index) => {
      console.log(`Order ${index}: ${result.status} - ${result.statusText}`);
    });
  } catch (error) {
    console.error('❌ Load test failed:', error.message);
  }
}

loadTest();
```

---

## 🔍 **Monitoring & Debugging**

### **App Debug Commands**
```javascript
// Check current user and restaurant UID
console.log('Current User:', await AsyncStorage.getItem('currentUser'));

// Check notification context state
console.log('Notifications:', notifications);
console.log('Unread Count:', unreadCount);

// Check Supabase connection
console.log('Supabase Status:', supabase.realtime.isConnected());

// Check order processing
console.log('Orders in state:', orders);
```

### **Network Debugging**
```bash
# Monitor network traffic (macOS/Linux)
sudo tcpdump -i any -A 'port 8081'

# Check app connectivity
ping YOUR_APP_IP_ADDRESS

# Test port accessibility
telnet YOUR_APP_IP_ADDRESS 8081
```

### **Real-time Subscription Debug**
```javascript
// In app console
supabase
  .channel('orders')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'orders' },
    (payload) => console.log('Real-time order:', payload)
  )
  .subscribe((status) => console.log('Subscription status:', status));
```

**🎉 The new payload system is ready for production integration!**
