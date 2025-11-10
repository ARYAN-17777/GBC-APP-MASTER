# 🚀 POSTMAN CONFIGURATION - COMPLETE SETUP

## ✅ **VERIFIED WORKING CONFIGURATION**

### **📡 ENDPOINT DETAILS**

**Method**: `POST`  
**URL**: `https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/create-order`

### **🔐 HEADERS (Required)**

| Key | Value | Description |
|-----|-------|-------------|
| `Content-Type` | `application/json` | JSON content type |
| `apikey` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M` | Supabase anon key |
| `Prefer` | `return=representation` | Return created object |
| `Authorization` | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M` | Bearer token |

### **📝 BODY (JSON - Raw)**

```json
{
  "userId": "8073867c-18dc-40f4-8ced-ce9887032fb3",
  "orderNumber": "GBC-POSTMAN-001",
  "amount": 2500,
  "status": "pending",
  "items": [
    {
      "title": "Chicken Biryani",
      "quantity": 1,
      "price": 1500
    },
    {
      "title": "Mango Lassi",
      "quantity": 1,
      "price": 1000
    }
  ],
  "user": {
    "name": "Postman Test Customer",
    "phone": "+44 7123 456789",
    "email": "postman@gbccanteen.com",
    "address": "123 Test Street, London, UK"
  },
  "restaurant": {
    "name": "General Bilimoria's Canteen"
  },
  "stripeId": "pi_postman_test_123456",
  "time": "14:30 PM",
  "createdAt": "2025-01-04T14:30:00.000Z"
}
```

---

## 🔧 **STEP-BY-STEP POSTMAN SETUP**

### **Step 1: Create New Request**
1. Open Postman
2. Click "New" → "Request"
3. Name: "GBC Create Order - Real-time Test"
4. Collection: Create "GBC Restaurant API"

### **Step 2: Configure Request**
1. **Method**: Select `POST`
2. **URL**: `https://evqmvmjnfeefeeizeljq.supabase.co/functions/v1/create-order`

### **Step 3: Add Headers**
Go to "Headers" tab and add:

```
Content-Type: application/json
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M
Prefer: return=representation
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M
```

### **Step 4: Configure Body**
1. Go to "Body" tab
2. Select "raw"
3. Choose "JSON" from dropdown
4. Paste the JSON payload above

### **Step 5: Test the Request**
1. Click "Send"
2. Expected Response: `201 Created`
3. Response body should show order details

---

## 🧪 **TESTING DIFFERENT SCENARIOS**

### **Test 1: Basic Order**
```json
{
  "userId": "8073867c-18dc-40f4-8ced-ce9887032fb3",
  "orderNumber": "GBC-TEST-001",
  "amount": 1500,
  "status": "pending",
  "items": [
    {
      "title": "Tea",
      "quantity": 2,
      "price": 750
    }
  ],
  "user": {
    "name": "Test User 1",
    "phone": "+44 7111 111111"
  }
}
```

### **Test 2: Large Order**
```json
{
  "userId": "8073867c-18dc-40f4-8ced-ce9887032fb3",
  "orderNumber": "GBC-LARGE-001",
  "amount": 5500,
  "status": "pending",
  "items": [
    {
      "title": "Chicken Curry",
      "quantity": 2,
      "price": 1800
    },
    {
      "title": "Rice",
      "quantity": 2,
      "price": 800
    },
    {
      "title": "Naan",
      "quantity": 3,
      "price": 1100
    }
  ],
  "user": {
    "name": "Large Order Customer",
    "phone": "+44 7222 222222"
  }
}
```

### **Test 3: Quick Order**
```json
{
  "userId": "8073867c-18dc-40f4-8ced-ce9887032fb3",
  "orderNumber": "GBC-QUICK-001",
  "amount": 500,
  "status": "pending",
  "items": [
    {
      "title": "Coffee",
      "quantity": 1,
      "price": 500
    }
  ],
  "user": {
    "name": "Quick Customer",
    "phone": "+44 7333 333333"
  }
}
```

---

## ✅ **EXPECTED RESPONSES**

### **Success Response (201 Created)**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "id": "uuid-generated-id",
    "orderNumber": "GBC-POSTMAN-001",
    "status": "pending",
    "amount": 2500,
    "createdAt": "2025-01-04T14:30:00.000Z"
  }
}
```

### **Error Response (400 Bad Request)**
```json
{
  "success": false,
  "error": "Missing required fields",
  "details": "userId and orderNumber are required"
}
```

---

## 🔍 **TROUBLESHOOTING**

### **Issue 1: 401 Unauthorized**
**Solution**: Check apikey and Authorization headers are correct

### **Issue 2: 400 Bad Request**
**Solution**: Verify JSON payload format and required fields

### **Issue 3: 500 Internal Server Error**
**Solution**: Check Supabase function logs in dashboard

### **Issue 4: Order Created but Not Visible in App**
**Solution**: 
1. Check app is connected to same Supabase project
2. Verify real-time subscription is working
3. Check order status (app shows 'pending' as 'active')

---

## 📱 **REAL-TIME VERIFICATION**

### **After Sending Postman Request:**

1. **Check Supabase Dashboard**:
   - Go to: https://supabase.com/dashboard/project/evqmvmjnfeefeeizeljq/editor
   - Table: `orders`
   - Verify new order appears

2. **Check App Orders Page**:
   - Open app: http://localhost:8081
   - Navigate to Orders tab
   - New order should appear automatically (real-time)

3. **Check Console Logs**:
   - App should show: "🔔 Real-time order update"
   - Orders should reload automatically

---

## 🎯 **SUCCESS CRITERIA**

✅ **Postman Request**: Returns 201 Created  
✅ **Supabase Database**: Order appears in orders table  
✅ **App Real-time**: Order appears in app immediately  
✅ **Order Status**: Shows as "ACTIVE" in kitchen dashboard  
✅ **Order Details**: All fields display correctly  

---

## 🚀 **PRODUCTION NOTES**

### **Environment Variables Used:**
- `EXPO_PUBLIC_SUPABASE_URL`: https://evqmvmjnfeefeeizeljq.supabase.co
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: (as shown in headers)
- `EXPO_PUBLIC_CREATE_ORDER_FUNCTION_URL`: /functions/v1/create-order

### **Security:**
- All requests use Supabase Row Level Security (RLS)
- API keys are environment-specific
- Real-time subscriptions are authenticated

### **Performance:**
- Real-time updates via Supabase Realtime
- Automatic order refresh on changes
- Optimistic UI updates for status changes

**🎉 POSTMAN CONFIGURATION COMPLETE - READY FOR REAL-TIME TESTING! 🚀**
