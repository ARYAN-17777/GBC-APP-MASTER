# 🔑 ENVIRONMENT & KEYS PARITY REPORT

## ✅ **SUPABASE PROJECT CONFIGURATION**

**Project URL**: `https://evqmvmjnfeefeeizeljq.supabase.co`  
**Project ID**: `evqmvmjnfeefeeizeljq`  

### **🔐 Available Keys**
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzEwMDUsImV4cCI6MjA3MjUwNzAwNX0.i8eai5eZxc8ELcyIuN_As0di7qsbd4tqHWbfQHeW43M`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.demo_service_key_for_development`

### **📱 App Configuration**
- **App uses**: Anon Key (for RLS-protected queries)
- **Real-time WebSocket**: `wss://evqmvmjnfeefeeizeljq.supabase.co/realtime/v1/websocket`

### **🔧 Postman Configuration Requirements**
For Postman to insert orders visible to the app:

**Option 1: Use Anon Key (Recommended)**
```
Authorization: Bearer [anon_key]
Supabase-URL: https://evqmvmjnfeefeeizeljq.supabase.co
```

**Option 2: Use Service Role Key (Bypasses RLS)**
```
Authorization: Bearer [service_role_key]  
Supabase-URL: https://evqmvmjnfeefeeizeljq.supabase.co
```

---

## ⚠️ **CRITICAL REQUIREMENTS FOR POSTMAN**

### **1. User ID Matching**
- **App User ID**: Must be obtained from app after login
- **Postman Payload**: Must set `userId` field to exact app user ID
- **Field Name**: `userId` (not `user_id`)

### **2. Required Payload Structure**
```json
{
  "userId": "[EXACT_APP_USER_ID]",
  "orderNumber": "ORD-12345",
  "amount": 2500,
  "status": "pending",
  "items": [
    {
      "title": "Test Item",
      "quantity": 1,
      "price": 2500
    }
  ],
  "user": {
    "name": "Test User",
    "phone": "+1234567890"
  },
  "restaurant": {
    "name": "GBC Restaurant"
  }
}
```

### **3. Headers Required**
```
Content-Type: application/json
Authorization: Bearer [key]
apikey: [same_key]
```

---

## 🎯 **NEXT STEPS**
1. ✅ Environment parity confirmed
2. 🔍 Check RLS policies (Step 2)
3. 🧪 Test user ID matching (Step 3)
4. 📊 Verify schema alignment (Step 4)
